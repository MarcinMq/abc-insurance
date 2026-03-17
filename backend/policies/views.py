from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from users.permissions import IsAgentOrAdmin, IsOwnerOrAgent
from .models import Policy, InsuranceProduct, PolicyDocument
from .serializers import (
    PolicyListSerializer,
    PolicyDetailSerializer,
    PolicyStatusUpdateSerializer,
    InsuranceProductSerializer,
    PolicyDocumentSerializer,
)


class InsuranceProductListView(generics.ListAPIView):
    """Katalog produktów ubezpieczeniowych — dostępny dla wszystkich uwierzytelnionych."""
    serializer_class = InsuranceProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = InsuranceProduct.objects.filter(is_active=True)
    filterset_fields = ['category']
    search_fields = ['name', 'description']

    @extend_schema(summary="Lista dostępnych produktów ubezpieczeniowych")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class PolicyViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'product__category']
    search_fields = ['policy_number', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'end_date', 'premium_monthly']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Policy.objects.select_related('customer', 'product', 'assigned_agent')
        if user.is_customer:
            return qs.filter(customer=user)
        # Agenci i admini widzą wszystkie polisy
        return qs.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return PolicyListSerializer
        if self.action == 'update_status':
            return PolicyStatusUpdateSerializer
        return PolicyDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAgentOrAdmin()]
        if self.action in ['update', 'partial_update', 'update_status']:
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated(), IsOwnerOrAgent()]

    @extend_schema(summary="Lista polis")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Szczegóły polisy")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary="Utwórz polisę (tylko agent)")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Przypisz agenta tworzącego polisę
        serializer.save(assigned_agent=request.user if request.user.is_agent else None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Zmień status polisy (tylko agent)")
    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        policy = self.get_object()
        serializer = PolicyStatusUpdateSerializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Powiadomienie klienta
        from notifications.services import notify_policy_status_change
        notify_policy_status_change(policy, request.user)
        return Response(PolicyDetailSerializer(policy).data)

    @extend_schema(summary="Upload dokumentu polisy")
    @action(detail=True, methods=['post'], url_path='documents')
    def upload_document(self, request, pk=None):
        policy = self.get_object()
        serializer = PolicyDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(policy=policy, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
