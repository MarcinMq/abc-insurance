from .models import Notification
from users.models import User


def _create_notification(recipient, notification_type, title, message, claim=None, policy=None):
    Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        related_claim_id=claim.id if claim else None,
        related_policy_id=policy.id if policy else None,
    )


def notify_claim_submitted(claim):
    """Powiadom agentów o nowej szkodzie."""
    agents = User.objects.filter(role=User.Role.AGENT, is_active=True)
    for agent in agents:
        _create_notification(
            recipient=agent,
            notification_type=Notification.NotificationType.CLAIM_SUBMITTED,
            title=f"Nowa szkoda: {claim.claim_number}",
            message=(
                f"Klient {claim.reported_by.get_full_name()} zgłosił szkodę "
                f"do polisy {claim.policy.policy_number}. "
                f"Szacowana wartość: {claim.estimated_damage} PLN."
            ),
            claim=claim,
        )


def notify_claim_status_change(claim, changed_by, old_status):
    """Powiadom klienta o zmianie statusu szkody."""
    status_labels = dict(claim.Status.choices)
    customer = claim.policy.customer

    type_map = {
        claim.Status.APPROVED: Notification.NotificationType.CLAIM_APPROVED,
        claim.Status.PARTIALLY_APPROVED: Notification.NotificationType.CLAIM_APPROVED,
        claim.Status.REJECTED: Notification.NotificationType.CLAIM_REJECTED,
        claim.Status.PAID: Notification.NotificationType.CLAIM_PAID,
        claim.Status.ADDITIONAL_INFO: Notification.NotificationType.ADDITIONAL_INFO_REQUIRED,
    }
    notif_type = type_map.get(claim.status, Notification.NotificationType.CLAIM_STATUS_CHANGED)

    _create_notification(
        recipient=customer,
        notification_type=notif_type,
        title=f"Zmiana statusu szkody {claim.claim_number}",
        message=(
            f"Status Twojej szkody {claim.claim_number} zmienił się z "
            f'"{status_labels.get(old_status, old_status)}" na '
            f'"{status_labels.get(claim.status, claim.status)}".'
        ),
        claim=claim,
    )

    # Jeśli wymagane uzupełnienie, powiadom klienta
    if claim.status == claim.Status.ADDITIONAL_INFO and claim.agent_notes:
        _create_notification(
            recipient=customer,
            notification_type=Notification.NotificationType.ADDITIONAL_INFO_REQUIRED,
            title=f"Wymagane uzupełnienie dokumentów – szkoda {claim.claim_number}",
            message=f"Agent prosi o uzupełnienie: {claim.agent_notes}",
            claim=claim,
        )


def notify_policy_status_change(policy, changed_by):
    """Powiadom klienta o zmianie statusu polisy."""
    from policies.models import Policy
    status_labels = dict(Policy.Status.choices)

    _create_notification(
        recipient=policy.customer,
        notification_type=Notification.NotificationType.POLICY_STATUS_CHANGED,
        title=f"Zmiana statusu polisy {policy.policy_number}",
        message=(
            f"Status Twojej polisy {policy.policy_number} zmienił się na "
            f'"{status_labels.get(policy.status, policy.status)}".'
        ),
        policy=policy,
    )
