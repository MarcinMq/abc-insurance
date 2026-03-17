from rest_framework.permissions import BasePermission


class IsAgent(BasePermission):
    """Pozwala tylko agentom ubezpieczeniowym."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_agent)


class IsCustomer(BasePermission):
    """Pozwala tylko klientom."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_customer)


class IsAgentOrAdmin(BasePermission):
    """Pozwala agentom i administratorom."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_agent or request.user.is_admin_user or request.user.is_staff)
        )


class IsOwnerOrAgent(BasePermission):
    """Właściciel zasobu lub agent może go zobaczyć."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_agent or request.user.is_admin_user or request.user.is_staff:
            return True
        # Sprawdzamy czy obiekt ma pole 'user' lub 'customer'
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False
