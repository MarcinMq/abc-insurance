from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AgentProfile


class AgentProfileInline(admin.StackedInline):
    model = AgentProfile
    can_delete = False
    verbose_name_plural = 'Profil agenta'


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = [AgentProfileInline]
    list_display = ['username', 'email', 'get_full_name', 'role', 'is_verified', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'pesel']
    ordering = ['-date_joined']
    fieldsets = UserAdmin.fieldsets + (
        ('Dane dodatkowe', {
            'fields': ('role', 'phone_number', 'pesel', 'address', 'date_of_birth', 'avatar', 'is_verified'),
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Dane dodatkowe', {
            'fields': ('role', 'email', 'first_name', 'last_name', 'phone_number'),
        }),
    )


@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'department', 'max_claim_value']
    search_fields = ['user__username', 'user__email', 'license_number']
