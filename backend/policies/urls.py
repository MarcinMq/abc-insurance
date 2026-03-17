from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PolicyViewSet, basename='policy')

urlpatterns = [
    path('products/', views.InsuranceProductListView.as_view(), name='product_list'),
    path('', include(router.urls)),
]
