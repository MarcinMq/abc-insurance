from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @extend_schema(summary="Lista powiadomień zalogowanego użytkownika")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Liczba nieprzeczytanych powiadomień")
    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Oznacz wszystkie powiadomienia jako przeczytane")
    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'marked_read': updated})


class MarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Oznacz powiadomienie jako przeczytane")
    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response(NotificationSerializer(notification).data)
        except Notification.DoesNotExist:
            return Response({'detail': 'Nie znaleziono.'}, status=status.HTTP_404_NOT_FOUND)
