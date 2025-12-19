from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import PharmacyProfileView, RegisterView, MyTokenObtainPairView, LogoutView, ProfileView, forgot_password, reset_password, upgrade_role, verify_email_request, verify_otp, GoogleLoginView

app_name = 'authentication'
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'),  # Returns access/refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),  # Optional
    path('me/', ProfileView.as_view(), name='profile'),  # Get/update profile
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('verify-email/', verify_email_request, name='verify_email'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('pharmacy-profile/', PharmacyProfileView.as_view(), name='pharmacy_profile'),
    path('upgrade-role/<int:user_id>/', upgrade_role, name='upgrade_role'),
]