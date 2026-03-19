from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, AgentProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.get_full_name()
        token['email'] = user.email
        return token


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'pesel',
            'address', 'date_of_birth',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Hasła nie są identyczne.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            **validated_data,
            role=User.Role.CUSTOMER,
        )
        return user


class AgentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentProfile
        fields = ['license_number', 'department', 'specialization', 'max_claim_value']


class UserProfileSerializer(serializers.ModelSerializer):
    agent_profile = AgentProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'pesel', 'address', 'date_of_birth',
            'avatar', 'is_verified', 'agent_profile', 'created_at',
        ]
        read_only_fields = ['id', 'username', 'role', 'is_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'is_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'role', 'is_verified', 'is_active', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    license_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name',
                  'role', 'phone_number', 'license_number', 'department']

    def create(self, validated_data):
        license_number = validated_data.pop('license_number', '')
        department = validated_data.pop('department', '')
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.AGENT:
            AgentProfile.objects.create(
                user=user,
                license_number=license_number or f'AG{user.id:03d}',
                department=department or 'Ogólny',
            )
        return user


class AdminRoleChangeSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Hasła nie są identyczne.'})
        return attrs
