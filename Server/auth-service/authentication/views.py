import os
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .serializers import (
    UserSerializer,
    GoogleSocialAuthSerializer,
    PharmacyProfileSerializer
)
from .models import EmailVerificationOTP

User = get_user_model()

# --- Custom Permissions (Defined early so views can use them) ---

class IsPharmacyOrAdmin(permissions.BasePermission):
    """Allows access only to pharmacy users or admins."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['pharmacy', 'pharmacy_admin', 'admin']
        )

class IsVerified(permissions.BasePermission):
    """Allows access only to verified users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified

# --- Authentication Views ---

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'userId': str(user.id),
            'role': user.role,
        }, status=status.HTTP_201_CREATED)

class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(email=request.data['email'])
            response.data.update({
                'userId': str(user.id),
                'role': user.role,
                'is_verified': user.is_verified
            })
        return response

class LogoutView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token required"}, status=400)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

# --- Profile Views ---

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class PharmacyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PharmacyProfileSerializer
    permission_classes = [IsAuthenticated, IsPharmacyOrAdmin, IsVerified]

    def get_object(self):
        # Ensure the user has a pharmacy profile or handle the error
        return getattr(self.request.user, 'pharmacyprofile', None)

# --- Password & Role Management ---

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    try:
        user = User.objects.get(email=email)
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{frontend_url}/reset-password?uid={uidb64}&token={token}"

        send_mail(
            'Password Reset Request',
            f'Click here to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass

    return Response({"message": "If an account exists, a reset link has been sent."})

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        token_generator = PasswordResetTokenGenerator()

        if token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password reset successfully"})
        return Response({"error": "Invalid or expired token"}, status=400)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid token or user"}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not user.check_password(old_password):
        return Response({"error": "Wrong old password"}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password updated successfully"})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def upgrade_role(request):
    """
    Endpoint to upgrade user role (e.g., to 'pharmacy').
    """
    user = request.user
    new_role = request.data.get('role')

    valid_roles = ['user', 'pharmacy'] # Define allowed roles
    if new_role not in valid_roles:
        return Response({"error": "Invalid role selection"}, status=400)

    user.role = new_role
    user.save()
    return Response({"message": f"Role updated to {new_role}", "role": user.role})

# --- Email Verification ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_email_request(request):
    user = request.user
    if user.is_verified:
        return Response({"message": "User already verified"}, status=400)

    otp_obj, created = EmailVerificationOTP.objects.get_or_create(user=user)

    if not created and otp_obj.is_valid():
        return Response({"message": "Wait before requesting a new OTP"}, status=429)

    otp_obj.code = "".join(random.choices(string.digits, k=6))
    otp_obj.expires_at = timezone.now() + timedelta(minutes=15)
    otp_obj.save()

    send_mail(
        'Verify your email',
        f'Your OTP is: {otp_obj.code}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    return Response({"message": "Verification email sent"})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def verify_otp(request):
    code = request.data.get('code')
    try:
        otp = EmailVerificationOTP.objects.get(user=request.user, code=code)
        if otp.is_valid():
            request.user.is_verified = True
            request.user.save()
            otp.delete()
            return Response({
                "message": "Email verified successfully",
                "is_verified": True
            })
        return Response({"error": "Expired OTP"}, status=400)
    except EmailVerificationOTP.DoesNotExist:
        return Response({"error": "Invalid OTP"}, status=400)

# --- Social Auth & Internal Validation ---

class GoogleLoginView(APIView):
    serializer_class = GoogleSocialAuthSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['auth_token']

        try:
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
            )

            email = id_info['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': id_info.get('given_name', ''),
                    'last_name': id_info.get('family_name', ''),
                    'is_verified': True,
                    'role': 'user'
                }
            )

            if created:
                user.set_unusable_password()
                user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'userId': str(user.id),
                'role': user.role,
                'email': user.email
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token(request):
    return Response({
        "valid": True,
        "user_id": request.user.id,
        "role": request.user.role,
        "email": request.user.email,
        "is_verified": request.user.is_verified
    })