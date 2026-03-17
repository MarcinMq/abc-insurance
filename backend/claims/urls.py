from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ClaimViewSet, basename='claim')

urlpatterns = [
    path('queue/', views.AgentClaimDashboardView.as_view(), name='claim_queue'),
    path('', include(router.urls)),
]
