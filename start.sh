#!/bin/sh
set -e

echo "🚀 Starting Royal VIP Tours..."

# Push database schema (creates tables if they don't exist)
echo "📊 Pushing database schema..."
npm run db:push

# Seed database with admin account and initial data
echo "🌱 Seeding database..."
tsx server/seed.ts

echo "🌐 Starting application server..."

# Start the application
exec npm start
