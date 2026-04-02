#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
cd /app
bunx prisma migrate deploy || bunx prisma db push

# Start the application
exec "$@"
