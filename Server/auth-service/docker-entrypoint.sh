#!/bin/bash
# docker-entrypoint.sh

set -e

MAX_RETRIES=30  # 30 * 5 seconds = 150 seconds max wait
RETRY_COUNT=0

# Function to wait for database with timeout
wait_for_db() {
    echo "Waiting for database connection with SSL..."

    if [ -n "$DATABASE_URL" ]; then
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

        if [ -n "$DB_HOST" ]; then
            echo "Testing connection to database host: $DB_HOST"

            while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                if python -c "
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
import django
django.setup()
from django.db import connection
try:
    connection.ensure_connection()
    print('Database connection successful')
    sys.exit(0)
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
" 2>/dev/null; then
                    echo "Database is ready!"
                    return 0
                else
                    RETRY_COUNT=$((RETRY_COUNT + 1))
                    echo "PostgreSQL is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
                    sleep 5
                fi
            done

            echo "ERROR: Could not connect to database after $MAX_RETRIES attempts"
            echo "Starting application anyway to avoid container crash..."
            return 1
        fi
    fi

    echo "No DATABASE_URL set, skipping database wait"
    return 0
}

# Setup SSL
echo "Setting up SSL environment..."
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" != *"sslmode="* ]]; then
    if [[ "$DATABASE_URL" == *"?"* ]]; then
        export DATABASE_URL="${DATABASE_URL}&sslmode=require"
    else
        export DATABASE_URL="${DATABASE_URL}?sslmode=require"
    fi
    echo "Added sslmode=require to DATABASE_URL"
fi

# Try to connect to database (with timeout)
wait_for_db

# Run migrations if database is available
echo "Running database migrations..."
python manage.py migrate --noinput || echo "Warning: Migrations failed, continuing anyway..."

echo "Starting application..."
exec "$@"