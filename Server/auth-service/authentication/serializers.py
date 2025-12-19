from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PharmacyProfile
from django.core.validators import RegexValidator
from rest_framework.validators import UniqueValidator


User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
    write_only=True,
    validators=[
        RegexValidator(
            regex=r'^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$',
            message='Password must be at least 8 characters, include uppercase, lowercase, and a number.'
        )
    ]

)
    phone = serializers.CharField(
    validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="...")]
)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'role', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.role in ['pharmacy', 'pharmacy_admin']:
            PharmacyProfile.objects.create(user=user)
        return user

class PharmacyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyProfile
        fields = '__all__'
#    authentication/serializers.py

class GoogleSocialAuthSerializer(serializers.Serializer):
    auth_token = serializers.CharField()