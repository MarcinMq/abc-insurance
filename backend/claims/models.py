from django.db import models
from django.core.validators import MinValueValidator
from users.models import User
from policies.models import Policy


class Claim(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Szkic'
        SUBMITTED = 'submitted', 'Zgłoszona'
        UNDER_REVIEW = 'under_review', 'W trakcie oceny'
        ADDITIONAL_INFO = 'additional_info', 'Oczekuje na uzupełnienie'
        APPROVED = 'approved', 'Zatwierdzona'
        PARTIALLY_APPROVED = 'partially_approved', 'Częściowo zatwierdzona'
        REJECTED = 'rejected', 'Odrzucona'
        PAID = 'paid', 'Wypłacona'
        CLOSED = 'closed', 'Zamknięta'

    class IncidentType(models.TextChoices):
        ACCIDENT = 'accident', 'Wypadek'
        THEFT = 'theft', 'Kradzież'
        FIRE = 'fire', 'Pożar'
        FLOOD = 'flood', 'Powódź'
        VANDALISM = 'vandalism', 'Wandalizm'
        ILLNESS = 'illness', 'Choroba'
        INJURY = 'injury', 'Uraz'
        NATURAL_DISASTER = 'natural_disaster', 'Klęska żywiołowa'
        OTHER = 'other', 'Inne'

    # Workflow statusów: jakie przejścia są dozwolone
    ALLOWED_TRANSITIONS = {
        Status.DRAFT: [Status.SUBMITTED],
        Status.SUBMITTED: [Status.UNDER_REVIEW, Status.REJECTED],
        Status.UNDER_REVIEW: [Status.ADDITIONAL_INFO, Status.APPROVED, Status.PARTIALLY_APPROVED, Status.REJECTED],
        Status.ADDITIONAL_INFO: [Status.UNDER_REVIEW, Status.REJECTED],
        Status.APPROVED: [Status.PAID],
        Status.PARTIALLY_APPROVED: [Status.PAID],
        Status.PAID: [Status.CLOSED],
        Status.REJECTED: [Status.CLOSED],
        Status.CLOSED: [],
    }

    claim_number = models.CharField(max_length=25, unique=True, editable=False)
    policy = models.ForeignKey(Policy, on_delete=models.PROTECT, related_name='claims')
    reported_by = models.ForeignKey(
        User, on_delete=models.PROTECT,
        related_name='reported_claims',
    )
    assigned_agent = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_claims',
        limit_choices_to={'role': 'agent'},
    )
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.DRAFT)
    incident_type = models.CharField(max_length=25, choices=IncidentType.choices)
    incident_date = models.DateField()
    incident_location = models.CharField(max_length=300)
    description = models.TextField()
    estimated_damage = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    approved_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    agent_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Szkoda'
        verbose_name_plural = 'Szkody'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.claim_number:
            self.claim_number = self._generate_claim_number()
        super().save(*args, **kwargs)

    def _generate_claim_number(self):
        import random
        import string
        from datetime import date
        year = date.today().year
        month = str(date.today().month).zfill(2)
        random_part = ''.join(random.choices(string.digits, k=5))
        return f"SZK/{year}/{month}/{random_part}"

    def __str__(self):
        return f"Szkoda {self.claim_number} [{self.get_status_display()}]"

    def can_transition_to(self, new_status):
        return new_status in self.ALLOWED_TRANSITIONS.get(self.status, [])


class ClaimStatusHistory(models.Model):
    """Historia zmian statusu szkody."""
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=25, blank=True)
    new_status = models.CharField(max_length=25)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    comment = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Historia statusu szkody'
        verbose_name_plural = 'Historii statusów szkód'
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.claim.claim_number}: {self.old_status} → {self.new_status}"


class ClaimDocument(models.Model):
    class DocumentType(models.TextChoices):
        PHOTO = 'photo', 'Zdjęcie'
        POLICE_REPORT = 'police_report', 'Protokół policyjny'
        MEDICAL_REPORT = 'medical_report', 'Dokumentacja medyczna'
        REPAIR_ESTIMATE = 'repair_estimate', 'Kosztorys naprawy'
        INVOICE = 'invoice', 'Faktura'
        OTHER = 'other', 'Inne'

    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=25, choices=DocumentType.choices)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='claim_documents/')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Dokument szkody'
        verbose_name_plural = 'Dokumenty szkody'

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.claim.claim_number}"
