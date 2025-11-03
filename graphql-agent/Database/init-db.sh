#!/bin/bash
# Database initialization script for BUS Platform Data Warehouse

set -e

echo "Starting BUS Platform Database Setup..."

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U postgres
do
  echo "Waiting for PostgreSQL to start..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Create the database and schema
echo "Creating database and schema..."
PGPASSWORD=postgrespassword psql -h localhost -p 5432 -U postgres <<EOF
-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE bus_analytics'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bus_analytics');
\gexec
EOF

# Run the setup scripts
echo "Running database setup scripts..."
cd /docker-entrypoint-initdb.d/sql

# Execute the setup script which will run all other scripts in order
PGPASSWORD=postgrespassword psql -h localhost -p 5432 -U postgres -d postgres -f 00_setup_database.sql

echo "Database setup completed successfully!"

# Run a health check
PGPASSWORD=postgrespassword psql -h localhost -p 5432 -U postgres -d bus_analytics <<EOF
SELECT * FROM bus_platform.health_check();
EOF
