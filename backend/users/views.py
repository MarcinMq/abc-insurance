from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import User, AgentProfile
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegisterSerializer,
    UserProfileSerializer,
    UserListSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
    AdminCreateUserSerializer,
    AdminRoleChangeSerializer,
)
from .permissions import IsAgentOrAdmin


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                    (request.user.role == 'admin' or request.user.is_staff))


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(
        summary="Logowanie",
        description="Zwraca token JWT z informacją o roli użytkownika.",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Rejestracja klienta")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Wylogowanie (unieważnienie tokena)")
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Wylogowano pomyślnie.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Nieprawidłowy token.'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    @extend_schema(summary="Pobierz profil zalogowanego użytkownika")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary="Aktualizuj profil")
    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Zmiana hasła")
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Nieprawidłowe aktualne hasło.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Hasło zostało zmienione.'}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """Lista użytkowników — tylko dla agentów/adminów."""
    serializer_class = UserListSerializer
    permission_classes = [IsAgentOrAdmin]
    filterset_fields = ['role', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        return User.objects.filter(role=User.Role.CUSTOMER).order_by('-created_at')

    @extend_schema(summary="Lista klientów (tylko dla agentów)")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class AdminUserListCreateView(generics.ListCreateAPIView):
    """Lista wszystkich użytkowników + tworzenie nowych — tylko admin."""
    permission_classes = [IsAdminUser]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateUserSerializer
        return AdminUserSerializer

    def get_queryset(self):
        return User.objects.exclude(username='admin').order_by('role', '-created_at')

    @extend_schema(summary="Lista wszystkich użytkowników (admin)")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(summary="Utwórz użytkownika (admin)")
    def post(self, request, *args, **kwargs):
        serializer = AdminCreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserRoleView(APIView):
    """Zmiana roli użytkownika — tylko admin."""
    permission_classes = [IsAdminUser]

    @extend_schema(summary="Zmień rolę użytkownika (admin)")
    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Użytkownik nie istnieje.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminRoleChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_role = serializer.validated_data['role']
        old_role = user.role
        user.role = new_role
        user.save()

        # Utwórz AgentProfile jeśli zmieniono na agenta
        if new_role == User.Role.AGENT and old_role != User.Role.AGENT:
            AgentProfile.objects.get_or_create(
                user=user,
                defaults={'license_number': f'AG{user.id:03d}', 'department': 'Ogólny'}
            )

        return Response(AdminUserSerializer(user).data)
