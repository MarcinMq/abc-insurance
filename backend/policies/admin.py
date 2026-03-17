from django.contrib import admin
from .models import InsuranceProduct, Policy, PolicyDocument


@admin.register(InsuranceProduct)
class InsuranceProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'base_price_monthly', 'max_coverage_amount', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']


class PolicyDocumentInline(admin.TabularInline):
    model = PolicyDocument
    extra = 0
    readonly_fields = ['uploaded_at']


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = [
        'policy_number', 'customer', 'product', 'status',
        'coverage_amount', 'start_date', 'end_date', 'assigned_agent',
    ]
    list_filter = ['status', 'product__category']
    search_fields = ['policy_number', 'customer__first_name', 'customer__last_name', 'customer__email']
    readonly_fields = ['policy_number', 'created_at', 'updated_at']
    inlines = [PolicyDocumentInline]
    autocomplete_fields = ['customer', 'assigned_agent']
