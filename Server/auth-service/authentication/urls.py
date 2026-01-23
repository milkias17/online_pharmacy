from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MyTokenObtainPairView, LogoutView, ProfileView, forgot_password, reset_password, verify_email_request, verify_otp, GoogleLoginView

app_name = 'authentication'
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='login'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),  
    path('me/', ProfileView.as_view(), name='profile'),  
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('verify-email/', verify_email_request, name='verify_email'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
]