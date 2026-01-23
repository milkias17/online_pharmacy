from datetime import timedelta, timezone
from random import random
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from .serializers import UserSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import EmailVerificationOTP
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import GoogleSocialAuthSerializer
import random
import string
User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token), 
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
            })
        return response

class LogoutView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = UntypedToken(refresh_token)
            RefreshToken(refresh_token).blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

# 1. Forgot Password (Generate UIDb64)
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    # Use env var for frontend URL
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    try:
        user = User.objects.get(email=email)
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        # URL structure: /reset-password?uid=...&token=...
        reset_url = f"{frontend_url}/reset-password?uid={uidb64}&token={token}"

        send_mail(
            'Password Reset Request',
            f'Click here: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass # Don't reveal if user exists

    # Always return success to prevent email enumeration attacks
    return Response({"message": "If an account exists, a reset link has been sent."})

# 2. Reset Password (Decode UIDb64)
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uidb64 = request.data.get('uid') # Get UID from frontend (parsed from URL)
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
        else:
            return Response({"error": "Invalid or expired token"}, status=400)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid token or user"}, status=400)

# Verify Email Request (Send OTP)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_email_request(request):
    user = request.user
    if user.is_verified:
        return Response({"message": "User already verified"}, status=400)

    # Get or Create
    otp_obj, created = EmailVerificationOTP.objects.get_or_create(user=user)

    # Check if existing one is still valid (prevent spamming)
    if not created and otp_obj.is_valid():
        return Response({"message": "Wait before requesting a new OTP"}, status=429)

    # Refresh the code and expiry
    otp_obj.code = str(random.randint(100000, 999999))
    otp_obj.expires_at = timezone.now() + timedelta(minutes=15)
    otp_obj.save()

    send_mail(...) # send mail logic
    return Response({"message": "Verification email sent"})

# Verify OTP
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
                "user": {
                    "id": str(request.user.id),
                    "email": request.user.email,
                    "is_verified": True
                }
            })
        else:
            return Response({"error": "Invalid or expired OTP"}, status=400)
    except EmailVerificationOTP.DoesNotExist:
        return Response({"error": "Invalid OTP"}, status=400)
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
# views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token(request):
    """
    Microservices Internal Endpoint:
    Returns user ID and Role if token is valid.
    """
    return Response({
        "valid": True,
        "user_id": request.user.id,
        "role": request.user.role,
        "email": request.user.email
    })

User = get_user_model()

class GoogleLoginView(APIView):
    serializer_class = GoogleSocialAuthSerializer
    permission_classes = [AllowAny] # Allow anyone to call this

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['auth_token']

        try:
            # 1. Verify the token with Google
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
            )

            # 2. Get user info from the verified token
            email = id_info['email']
            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')

            # 3. Check if user exists, or create a new one
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0], # Generate username from email
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_verified': True, # Google emails are verified
                    'role': 'user' # Default role for social login
                }
            )

            # If user exists but was created via password previously,
            # we just log them in.
            # Note: You might want to handle cases where roles mismatch.

            if created:
                user.set_unusable_password() # Social users don't have a password
                user.save()

            # 4. Generate your JWT Tokens (Same as your Login View)
            refresh = RefreshToken.for_user(user)

            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'userId': str(user.id),
                'role': user.role,
                'email': user.email
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_400_BAD_REQUEST
            )

class GoogleLoginView(APIView):
    serializer_class = GoogleSocialAuthSerializer
    permission_classes = [AllowAny] # Allow anyone to call this

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['auth_token']

        try:
            # 1. Verify the token with Google
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
            )

            # 2. Get user info from the verified token
            email = id_info['email']
            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')

            # 3. Check if user exists, or create a new one
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0], # Generate username from email
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_verified': True, # Google emails are verified
                    'role': 'user' # Default role for social login
                }
            )

            # If user exists but was created via password previously,
            # we just log them in.
            # Note: You might want to handle cases where roles mismatch.

            if created:
                user.set_unusable_password() # Social users don't have a password
                user.save()

            # 4. Generate your JWT Tokens (Same as your Login View)
            refresh = RefreshToken.for_user(user)

            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'userId': str(user.id),
                'role': user.role,
                'email': user.email
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_400_BAD_REQUEST
            )