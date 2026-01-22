import os
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# 1. Load local .env if it exists (for local testing)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# 2. SECURITY: Injected via Kubernetes env or fallback
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-order-service-default-key')

# 3. DEBUG: Set to False in production for safety
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# 4. NETWORKING: Allow internal Kubernetes traffic and external Ingress
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# 5. APPLICATION DEFINITION
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third Party
    'rest_framework',
    'corsheaders',
    # Local Microservice App
    'orders',
]

# 6. MIDDLEWARE (Order is technically critical)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # 1. Handle Pre-flight first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',       # 2. Standard Logic
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 7. CORS SETTINGS
CORS_ALLOW_ALL_ORIGINS = True  # Safest for distributed demo
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'order_service.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'order_service.wsgi.application'

# 8. THE CORE FIX: DISTRIBUTED DATABASE CONFIGURATION
# This explicitly reads the 'DATABASE_URL' variable injected by Kubernetes
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Fallback for initial local setup only
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# 9. KAFKA CONFIGURATION (The Asynchronous Backbone)
# 'kafka-service' matches the name in your kafka.yaml
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka-service:9092')

# 10. INTERNATIONALIZATION & STATIC FILES
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
