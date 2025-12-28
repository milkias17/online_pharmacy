# Stage 1: Build
FROM python:3.12-slim AS builder
WORKDIR /app

# Install system dependencies including SSL and PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libssl-dev \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --retries 5 --timeout 30 -r requirements.txt
COPY . .

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

# Install runtime dependencies for PostgreSQL with SSL support
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    openssl \
    ca-certificates \
    libssl-dev \
    postgresql-client \
&& rm -rf /var/lib/apt/lists/*

# Update CA certificates for SSL verification
RUN update-ca-certificates

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project code
COPY . .

# --- Collect Static Files ---
# We pass a dummy SECRET_KEY because the real one is in .env (not available during build)
# WhiteNoise needs these files to be in the /app/staticfiles folder
RUN SECRET_KEY=dummy-value-for-build python manage.py collectstatic --noinput

# Set Python to not buffer output
ENV PYTHONUNBUFFERED=1
# Set default Python path
ENV PYTHONPATH=/app
# Ensure SSL is enabled by default
ENV PGSSLMODE=require

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Health check to verify application is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/auth/health/')" || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "auth_service.wsgi:application"]