from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from users.permissions import IsAgentOrAdmin, IsOwnerOrAgent
from .models import Claim, ClaimDocument, ClaimStatusHistory
from .serializers import (
    ClaimListSerializer,
    ClaimDetailSerializer,
    ClaimCreateSerializer,
    ClaimStatusUpdateSerializer,
    ClaimDocumentSerializer,
)


class ClaimViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'incident_type', 'policy__product__category']
    search_fields = ['claim_number', 'incident_location', 'description']
    ordering_fields = ['created_at', 'incident_date', 'estimated_damage']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Claim.objects.select_related(
            'policy', 'policy__product', 'reported_by', 'assigned_agent'
        ).prefetch_related('documents', 'status_history')
        if user.is_customer:
            return qs.filter(policy__customer=user)
        return qs.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ClaimListSerializer
        if self.action == 'create':
            return ClaimCreateSerializer
        return ClaimDetailSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'update_status', 'assign_agent']:
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated(), IsOwnerOrAgent()]

    @extend_schema(summary="Lista szkód")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary="Zgłoś szkodę")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        claim = serializer.save(reported_by=request.user)

        # Jeśli od razu wysyła jako submitted
        if request.data.get('submit', False):
            claim.status = Claim.Status.SUBMITTED
            claim.submitted_at = timezone.now()
            claim.save()
            ClaimStatusHistory.objects.create(
                claim=claim,
                old_status=Claim.Status.DRAFT,
                new_status=Claim.Status.SUBMITTED,
                changed_by=request.user,
                comment="Szkoda zgłoszona przez klienta.",
            )

        from notifications.services import notify_claim_submitted
        if claim.status == Claim.Status.SUBMITTED:
            notify_claim_submitted(claim)

        return Response(ClaimDetailSerializer(claim).data, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Szczegóły szkody")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary="Wyślij szkodę do rozpatrzenia (klient)")
    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        claim = self.get_object()
        if claim.reported_by != request.user and not request.user.is_agent:
            return Response({'detail': 'Brak uprawnień.'}, status=status.HTTP_403_FORBIDDEN)
        if claim.status != Claim.Status.DRAFT:
            return Response(
                {'detail': 'Szkodę można wysłać tylko ze statusu "Szkic".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = claim.status
        claim.status = Claim.Status.SUBMITTED
        claim.submitted_at = timezone.now()
        claim.save()
        ClaimStatusHistory.objects.create(
            claim=claim,
            old_status=old_status,
            new_status=Claim.Status.SUBMITTED,
            changed_by=request.user,
            comment="Szkoda wysłana do rozpatrzenia.",
        )
        from notifications.services import notify_claim_submitted
        notify_claim_submitted(claim)
        return Response(ClaimDetailSerializer(claim).data)

    @extend_schema(summary="Zmień status szkody (tylko agent)")
    @action(detail=True, methods=['patch'], url_path='status', permission_classes=[IsAgentOrAdmin])
    def update_status(self, request, pk=None):
        claim = self.get_object()
        serializer = ClaimStatusUpdateSerializer(
            data=request.data,
            context={'claim': claim},
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        old_status = claim.status
        claim.status = data['status']

        if data.get('approved_amount') is not None:
            claim.approved_amount = data['approved_amount']
        if data.get('rejection_reason'):
            claim.rejection_reason = data['rejection_reason']

        if claim.status in [Claim.Status.PAID, Claim.Status.CLOSED, Claim.Status.REJECTED]:
            claim.resolved_at = timezone.now()

        claim.save()

        ClaimStatusHistory.objects.create(
            claim=claim,
            old_status=old_status,
            new_status=claim.status,
            changed_by=request.user,
            comment=data.get('comment', ''),
        )

        from notifications.services import notify_claim_status_change
        notify_claim_status_change(claim, request.user, old_status)

        return Response(ClaimDetailSerializer(claim).data)

    @extend_schema(summary="Przypisz agenta do szkody")
    @action(detail=True, methods=['patch'], url_path='assign', permission_classes=[IsAgentOrAdmin])
    def assign_agent(self, request, pk=None):
        claim = self.get_object()
        agent_id = request.data.get('agent_id')
        if agent_id:
            from users.models import User
            try:
                agent = User.objects.get(id=agent_id, role=User.Role.AGENT)
                claim.assigned_agent = agent
                claim.save()
            except User.DoesNotExist:
                return Response({'detail': 'Agent nie istnieje.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            claim.assigned_agent = request.user
            claim.save()
        return Response(ClaimDetailSerializer(claim).data)

    @extend_schema(summary="Dodaj dokument do szkody")
    @action(detail=True, methods=['post'], url_path='documents')
    def upload_document(self, request, pk=None):
        claim = self.get_object()
        # Klient może dodawać dokumenty tylko do swoich szkód i tylko przed zamknięciem
        if request.user.is_customer:
            if claim.reported_by != request.user:
                return Response({'detail': 'Brak uprawnień.'}, status=status.HTTP_403_FORBIDDEN)
            if claim.status in [Claim.Status.CLOSED, Claim.Status.PAID]:
                return Response(
                    {'detail': 'Nie można dodawać dokumentów do zamkniętej szkody.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = ClaimDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(claim=claim, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AgentClaimDashboardView(generics.ListAPIView):
    """Widok dla agenta: szkody wymagające uwagi."""
    serializer_class = ClaimListSerializer
    permission_classes = [IsAgentOrAdmin]

    def get_queryset(self):
        return Claim.objects.filter(
            status__in=[Claim.Status.SUBMITTED, Claim.Status.ADDITIONAL_INFO]
        ).select_related('policy', 'policy__product', 'reported_by').order_by('submitted_at')

    @extend_schema(summary="Kolejka szkód do rozpatrzenia (agent)")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
