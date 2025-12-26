# Stage 1: Build
FROM python:3.12-slim AS builder
WORKDIR /app

# Install system dependencies (optional, but good for stability with Postgres)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --retries 5 --timeout 30 -r requirements.txt
COPY . .

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

# Install runtime Postgres library (needed for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project code
COPY . .

# WhiteNoise needs these files to be in the /app/staticfiles folder
RUN SECRET_KEY=dummy-value-for-build python manage.py collectstatic --noinput

ENV PYTHONUNBUFFERED=1

# Start Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "auth_service.wsgi:application"]