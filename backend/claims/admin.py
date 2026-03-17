from django.contrib import admin
from .models import Claim, ClaimDocument, ClaimStatusHistory


class ClaimDocumentInline(admin.TabularInline):
    model = ClaimDocument
    extra = 0
    readonly_fields = ['uploaded_at', 'uploaded_by']


class ClaimStatusHistoryInline(admin.TabularInline):
    model = ClaimStatusHistory
    extra = 0
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'changed_at']
    can_delete = False


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = [
        'claim_number', 'policy', 'reported_by', 'status',
        'incident_type', 'incident_date', 'estimated_damage', 'approved_amount',
        'assigned_agent',
    ]
    list_filter = ['status', 'incident_type', 'policy__product__category']
    search_fields = [
        'claim_number', 'reported_by__first_name', 'reported_by__last_name',
        'incident_location',
    ]
    readonly_fields = ['claim_number', 'submitted_at', 'resolved_at', 'created_at', 'updated_at']
    inlines = [ClaimDocumentInline, ClaimStatusHistoryInline]
    autocomplete_fields = ['policy', 'reported_by', 'assigned_agent']
