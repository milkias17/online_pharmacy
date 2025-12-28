#!/bin/bash
# docker-entrypoint.sh

set -e

# Function to wait for database to be ready (with SSL support)
wait_for_db() {
    echo "Waiting for database connection with SSL..."

    # Try to connect to PostgreSQL with SSL
    if [ -n "$DATABASE_URL" ]; then
        # Extract database host from DATABASE_URL
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')

        if [ -n "$DB_HOST" ]; then
            echo "Testing connection to database host: $DB_HOST"

            # Try to connect using psql if available, otherwise use Python
            if command -v psql &> /dev/null; then
                until PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p') psql -h "$DB_HOST" -U "$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')" -d "$(echo $DATABASE_URL | sed -n 's/.*\/\/.*\/\(.*\)/\1/p' | cut -d'?' -f1)" -c '\q' 2>/dev/null; do
                    echo "PostgreSQL is unavailable - sleeping"
                    sleep 5
                done
            else
                # Fallback to Python database check
                until python -c "
import os, sys, time
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_service.settings')
import django
django.setup()
from django.db import connection
try:
    connection.ensure_connection()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    sys.exit(1)
" 2>/dev/null; do
                    echo "Database not ready yet. Sleeping for 5 seconds..."
                    sleep 5
                done
            fi
        fi
    fi

    echo "Database is ready!"
}

# Function to check SSL certificates
setup_ssl() {
    echo "Setting up SSL environment..."

    # Ensure SSL mode is set for PostgreSQL
    if [ -n "$DATABASE_URL" ]; then
        # Force SSL mode if not already specified
        if [[ "$DATABASE_URL" != *"sslmode="* ]]; then
            if [[ "$DATABASE_URL" == *"?"* ]]; then
                export DATABASE_URL="${DATABASE_URL}&sslmode=require"
            else
                export DATABASE_URL="${DATABASE_URL}?sslmode=require"
            fi
            echo "Added sslmode=require to DATABASE_URL"
        fi
    fi

    # Set PostgreSQL SSL environment variables
    export PGSSLMODE=${PGSSLMODE:-require}
    export PGSSLROOTCERT=${PGSSLROOTCERT:-/etc/ssl/certs/ca-certificates.crt}
}

# Setup SSL
setup_ssl

# Wait for database
wait_for_db

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Optional: Create cache table if using database cache
# echo "Creating cache table..."
# python manage.py createcachetable

# Optional: Compile translations if you have any
# echo "Compiling translations..."
# python manage.py compilemessages

echo "Starting application..."
exec "$@"