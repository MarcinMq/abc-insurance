from django.db import models
from django.core.validators import MinValueValidator
from users.models import User
import uuid


class InsuranceCategory(models.TextChoices):
    AUTO = 'auto', 'Ubezpieczenie pojazdu'
    PROPERTY = 'property', 'Ubezpieczenie majątkowe'
    HEALTH = 'health', 'Ubezpieczenie zdrowotne'
    LIFE = 'life', 'Ubezpieczenie na życie'
    TRAVEL = 'travel', 'Ubezpieczenie podróżne'
    LIABILITY = 'liability', 'Ubezpieczenie OC'


class InsuranceProduct(models.Model):
    """Katalog produktów ubezpieczeniowych oferowanych przez ABC Insurance."""
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=InsuranceCategory.choices)
    description = models.TextField()
    coverage_details = models.JSONField(default=dict)  # szczegóły zakresu ubezpieczenia
    base_price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    max_coverage_amount = models.DecimalField(max_digits=12, decimal_places=2)
    min_coverage_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Produkt ubezpieczeniowy'
        verbose_name_plural = 'Produkty ubezpieczeniowe'
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Policy(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Oczekująca na aktywację'
        ACTIVE = 'active', 'Aktywna'
        EXPIRED = 'expired', 'Wygasła'
        CANCELLED = 'cancelled', 'Anulowana'
        SUSPENDED = 'suspended', 'Zawieszona'

    policy_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT,
        related_name='policies',
        limit_choices_to={'role': 'customer'},
    )
    product = models.ForeignKey(InsuranceProduct, on_delete=models.PROTECT, related_name='policies')
    assigned_agent = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='managed_policies',
        limit_choices_to={'role': 'agent'},
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    coverage_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    premium_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    insured_object = models.JSONField(default=dict)  # np. dane pojazdu, adres nieruchomości
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Polisa'
        verbose_name_plural = 'Polisy'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.policy_number:
            self.policy_number = self._generate_policy_number()
        super().save(*args, **kwargs)

    def _generate_policy_number(self):
        import random
        import string
        prefix = 'ABC'
        year = __import__('datetime').date.today().year
        random_part = ''.join(random.choices(string.digits, k=6))
        return f"{prefix}/{year}/{random_part}"

    def __str__(self):
        return f"Polisa {self.policy_number} - {self.customer.get_full_name()}"

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    @property
    def days_to_expiry(self):
        from datetime import date
        if self.end_date:
            delta = self.end_date - date.today()
            return delta.days
        return None


class PolicyDocument(models.Model):
    class DocumentType(models.TextChoices):
        CONTRACT = 'contract', 'Umowa'
        AMENDMENT = 'amendment', 'Aneks'
        CERTIFICATE = 'certificate', 'Certyfikat'
        OTHER = 'other', 'Inne'

    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='policy_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Dokument polisy'
        verbose_name_plural = 'Dokumenty polisy'

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.policy.policy_number}"
