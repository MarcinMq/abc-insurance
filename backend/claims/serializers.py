from rest_framework import serializers
from users.serializers import UserListSerializer
from policies.serializers import PolicyListSerializer
from .models import Claim, ClaimDocument, ClaimStatusHistory


class ClaimDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = ClaimDocument
        fields = [
            'id', 'document_type', 'document_type_display', 'title',
            'file', 'description', 'uploaded_by_name', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_at']


class ClaimStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    old_status_display = serializers.SerializerMethodField()
    new_status_display = serializers.SerializerMethodField()

    class Meta:
        model = ClaimStatusHistory
        fields = [
            'id', 'old_status', 'old_status_display',
            'new_status', 'new_status_display',
            'changed_by_name', 'comment', 'changed_at',
        ]

    def get_old_status_display(self, obj):
        return dict(Claim.Status.choices).get(obj.old_status, obj.old_status)

    def get_new_status_display(self, obj):
        return dict(Claim.Status.choices).get(obj.new_status, obj.new_status)


class ClaimListSerializer(serializers.ModelSerializer):
    policy_number = serializers.CharField(source='policy.policy_number', read_only=True)
    policy_category = serializers.CharField(source='policy.product.category', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    incident_type_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id', 'claim_number', 'policy_number', 'policy_category',
            'status', 'status_display', 'incident_type', 'incident_type_display',
            'incident_date', 'incident_location', 'estimated_damage',
            'approved_amount', 'reported_by_name', 'submitted_at', 'created_at',
        ]


class ClaimCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = [
            'policy', 'incident_type', 'incident_date', 'incident_location',
            'description', 'estimated_damage',
        ]

    def validate_policy(self, policy):
        user = self.context['request'].user
        if user.is_customer and policy.customer != user:
            raise serializers.ValidationError("Nie możesz zgłosić szkody do cudzej polisy.")
        if not policy.is_active:
            raise serializers.ValidationError("Można zgłaszać szkody tylko do aktywnych polis.")
        return policy

    def validate_incident_date(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Data zdarzenia nie może być w przyszłości.")
        return value


class ClaimDetailSerializer(serializers.ModelSerializer):
    policy = PolicyListSerializer(read_only=True)
    reported_by = UserListSerializer(read_only=True)
    assigned_agent = UserListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    incident_type_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    documents = ClaimDocumentSerializer(many=True, read_only=True)
    status_history = ClaimStatusHistorySerializer(many=True, read_only=True)
    allowed_next_statuses = serializers.SerializerMethodField()

    class Meta:
        model = Claim
        fields = [
            'id', 'claim_number', 'policy', 'reported_by', 'assigned_agent',
            'status', 'status_display', 'incident_type', 'incident_type_display',
            'incident_date', 'incident_location', 'description',
            'estimated_damage', 'approved_amount', 'agent_notes', 'rejection_reason',
            'documents', 'status_history', 'allowed_next_statuses',
            'submitted_at', 'resolved_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'claim_number', 'reported_by', 'submitted_at',
            'resolved_at', 'created_at', 'updated_at',
        ]

    def get_allowed_next_statuses(self, obj):
        return [
            {'value': s, 'label': dict(Claim.Status.choices)[s]}
            for s in Claim.ALLOWED_TRANSITIONS.get(obj.status, [])
        ]


class ClaimStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Claim.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)
    approved_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        claim = self.context['claim']
        new_status = attrs['status']
        if not claim.can_transition_to(new_status):
            raise serializers.ValidationError(
                f"Niedozwolone przejście statusu: {claim.status} → {new_status}"
            )
        if new_status in [Claim.Status.APPROVED, Claim.Status.PARTIALLY_APPROVED]:
            if not attrs.get('approved_amount'):
                raise serializers.ValidationError(
                    "Przy zatwierdzeniu szkody wymagana jest kwota do wypłaty."
                )
        if new_status == Claim.Status.REJECTED:
            if not attrs.get('rejection_reason'):
                raise serializers.ValidationError(
                    "Przy odrzuceniu szkody wymagane jest podanie powodu."
                )
        return attrs
