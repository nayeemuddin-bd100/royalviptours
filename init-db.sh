#!/bin/sh
# Database Initialization Script
# WARNING: This script drops all tables and resets your database!
# Only run this for initial setup or when you explicitly want to reset everything.

set -e

echo "⚠️  WARNING: This will DROP all existing tables and reset your database!"
echo "⚠️  This should ONLY be run for initial setup or in development."
echo ""

# Push database schema
echo "📊 Pushing database schema..."
npx drizzle-kit push

echo "✅ Database initialization complete!"
