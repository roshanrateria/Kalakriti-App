#!/bin/sh

echo "Starting Kalakriti application..."
echo "=============================================="

# Check if database is configured
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Database connection configured"
echo "Database schema already set up via prod:setup"
echo "Starting Next.js server on port $PORT..."
echo "=============================================="

# Start the Next.js standalone server
exec node server.js