from django.db import models
from users.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        CLAIM_SUBMITTED = 'claim_submitted', 'Zgłoszono szkodę'
        CLAIM_STATUS_CHANGED = 'claim_status_changed', 'Zmiana statusu szkody'
        POLICY_STATUS_CHANGED = 'policy_status_changed', 'Zmiana statusu polisy'
        POLICY_EXPIRING = 'policy_expiring', 'Polisa wygasa wkrótce'
        ADDITIONAL_INFO_REQUIRED = 'additional_info', 'Wymagane uzupełnienie dokumentów'
        CLAIM_APPROVED = 'claim_approved', 'Szkoda zatwierdzona'
        CLAIM_REJECTED = 'claim_rejected', 'Szkoda odrzucona'
        CLAIM_PAID = 'claim_paid', 'Szkoda wypłacona'

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_claim_id = models.IntegerField(null=True, blank=True)
    related_policy_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Powiadomienie'
        verbose_name_plural = 'Powiadomienia'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username}: {self.title}"
