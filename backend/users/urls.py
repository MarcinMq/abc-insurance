from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('customers/', views.UserListView.as_view(), name='customer_list'),
    path('admin/users/', views.AdminUserListCreateView.as_view(), name='admin_user_list'),
    path('admin/users/<int:pk>/role/', views.AdminUserRoleView.as_view(), name='admin_user_role'),
]
