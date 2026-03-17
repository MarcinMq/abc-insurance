from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Klient'
        AGENT = 'agent', 'Agent ubezpieczeniowy'
        ADMIN = 'admin', 'Administrator'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone_number = models.CharField(max_length=20, blank=True)
    pesel = models.CharField(max_length=11, blank=True, unique=True, null=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Użytkownik'
        verbose_name_plural = 'Użytkownicy'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) [{self.get_role_display()}]"

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_agent(self):
        return self.role == self.Role.AGENT

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN


class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    license_number = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True)
    specialization = models.JSONField(default=list, blank=True)  # np. ['auto', 'property']
    max_claim_value = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Profil agenta'
        verbose_name_plural = 'Profile agentów'

    def __str__(self):
        return f"Agent: {self.user.get_full_name()} [{self.license_number}]"
