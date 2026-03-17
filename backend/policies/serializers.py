from rest_framework import serializers
from users.serializers import UserListSerializer
from .models import Policy, InsuranceProduct, PolicyDocument


class InsuranceProductSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = InsuranceProduct
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'coverage_details', 'base_price_monthly',
            'max_coverage_amount', 'min_coverage_amount', 'is_active',
        ]


class PolicyDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = PolicyDocument
        fields = ['id', 'document_type', 'document_type_display', 'title', 'file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class PolicyListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_category = serializers.CharField(source='product.category', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    days_to_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = Policy
        fields = [
            'id', 'policy_number', 'customer_name', 'product_name', 'product_category',
            'status', 'status_display', 'coverage_amount', 'premium_monthly',
            'start_date', 'end_date', 'days_to_expiry', 'created_at',
        ]


class PolicyDetailSerializer(serializers.ModelSerializer):
    product = InsuranceProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=InsuranceProduct.objects.filter(is_active=True),
        source='product',
        write_only=True,
    )
    customer = UserListSerializer(read_only=True)
    assigned_agent = UserListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    documents = PolicyDocumentSerializer(many=True, read_only=True)
    days_to_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = Policy
        fields = [
            'id', 'policy_number', 'customer', 'product', 'product_id',
            'assigned_agent', 'status', 'status_display', 'coverage_amount',
            'premium_monthly', 'start_date', 'end_date', 'insured_object',
            'notes', 'documents', 'days_to_expiry', 'created_at', 'updated_at',
        ]
        read_only_fields = ['policy_number', 'created_at', 'updated_at']

    def validate(self, attrs):
        product = attrs.get('product', getattr(self.instance, 'product', None))
        coverage = attrs.get('coverage_amount', getattr(self.instance, 'coverage_amount', None))
        if product and coverage:
            if coverage < product.min_coverage_amount:
                raise serializers.ValidationError(
                    f"Suma ubezpieczenia nie może być niższa niż {product.min_coverage_amount} PLN."
                )
            if coverage > product.max_coverage_amount:
                raise serializers.ValidationError(
                    f"Suma ubezpieczenia nie może być wyższa niż {product.max_coverage_amount} PLN."
                )
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end <= start:
            raise serializers.ValidationError("Data zakończenia musi być późniejsza niż data początku.")
        return attrs


class PolicyStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ['status', 'notes']
