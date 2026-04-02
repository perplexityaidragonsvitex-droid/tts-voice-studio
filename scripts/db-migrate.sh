#!/bin/bash
# ===========================================
# Production Prisma Migrations
# ===========================================

set -e

echo "🔄 Running Prisma migrations..."

# Generate Prisma Client
bunx prisma generate

# Push schema changes (для PostgreSQL)
bunx prisma db push --skip-generate

echo "✅ Database migrations complete!"
