# Use a consistent Python version
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable real-time logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the code
COPY . /app/

# Expose Django port
EXPOSE 8000

# Start with Gunicorn for production-grade performance
CMD ["gunicorn", "order_service.wsgi:application", "--bind", "0.0.0.0:8000"]