-- BUS Platform Data Warehouse Setup Script
-- This is the master script that sets up the entire database

-- First, connect to postgres database to create the bus_analytics database
-- Run this part as a superuser or database owner
\c postgres

-- Drop the database if it exists (BE CAREFUL - this will delete all data!)
-- Uncomment the next line only if you want to recreate the database from scratch
-- DROP DATABASE IF EXISTS bus_analytics;

-- Create the database
CREATE DATABASE bus_analytics
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the new database
\c bus_analytics

-- Run the schema creation script
\i 01_create_schema.sql

-- Run the sample data insertion script
\i 02_insert_sample_data.sql

-- Create additional analytical functions and views
\i 03_analytical_queries.sql

-- Grant permissions for Hasura
-- Create a role for Hasura if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hasura') THEN
        CREATE ROLE hasura WITH LOGIN PASSWORD 'hasura_password';
    END IF;
END
$$;

-- Grant necessary permissions to Hasura role
GRANT CONNECT ON DATABASE bus_analytics TO hasura;
GRANT USAGE ON SCHEMA bus_platform TO hasura;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bus_platform TO hasura;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bus_platform TO hasura;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA bus_platform TO hasura;

-- Create a read-only role for reporting
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bus_analytics_read') THEN
        CREATE ROLE bus_analytics_read WITH LOGIN PASSWORD 'readonly_password';
    END IF;
END
$$;

-- Grant read-only permissions
GRANT CONNECT ON DATABASE bus_analytics TO bus_analytics_read;
GRANT USAGE ON SCHEMA bus_platform TO bus_analytics_read;
GRANT SELECT ON ALL TABLES IN SCHEMA bus_platform TO bus_analytics_read;

-- Create indexes for Hasura foreign key detection
-- This helps Hasura automatically detect relationships

-- Add some useful database functions
CREATE OR REPLACE FUNCTION bus_platform.get_test_summary(p_test_id INTEGER)
RETURNS TABLE (
    test_id INTEGER,
    vehicle_info TEXT,
    test_status TEXT,
    defect_count BIGINT,
    total_cost NUMERIC,
    test_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.test_id,
        vs.vehicle_make || ' ' || vs.model || ' (' || vs.reg_no || ')' as vehicle_info,
        tst.status as test_status,
        COUNT(td.test_defect_id) as defect_count,
        COALESCE(SUM(td.common_cost + td.work_cost + td.parts_cost), 0) as total_cost,
        t.created_date as test_date
    FROM bus_platform.test t
    JOIN bus_platform.vehicle_snapshot vs ON t.vehicle_snapshot_id = vs.vehicle_snapshot_id
    JOIN bus_platform.test_status_translation tst ON t.test_status_id = tst.test_status_id
    LEFT JOIN bus_platform.test_defect td ON t.test_id = td.test_id
    WHERE t.test_id = p_test_id AND tst.localization_id = 1  -- English
    GROUP BY t.test_id, vs.vehicle_make, vs.model, vs.reg_no, tst.status, t.created_date;
END;
$$ LANGUAGE plpgsql;

-- Add database documentation
COMMENT ON DATABASE bus_analytics IS 'BUS Platform Analytical Data Warehouse for vehicle testing and inspection data';
COMMENT ON SCHEMA bus_platform IS 'Main schema containing all BUS platform tables and views';

-- Create a simple health check function
CREATE OR REPLACE FUNCTION bus_platform.health_check()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if main tables exist and have data
    RETURN QUERY
    SELECT 'Tables Created'::TEXT, 
           CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
           'Found ' || COUNT(*) || ' tables'
    FROM information_schema.tables 
    WHERE table_schema = 'bus_platform' AND table_type = 'BASE TABLE';
    
    RETURN QUERY
    SELECT 'Sample Data Loaded'::TEXT,
           CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
           'Found ' || COUNT(*) || ' tests'
    FROM bus_platform.test;
    
    RETURN QUERY
    SELECT 'Indexes Created'::TEXT,
           CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
           'Found ' || COUNT(*) || ' indexes'
    FROM pg_indexes
    WHERE schemaname = 'bus_platform';
END;
$$ LANGUAGE plpgsql;

-- Run health check
SELECT * FROM bus_platform.health_check();

-- Display summary
SELECT 
    'Database setup completed!' as message,
    current_database() as database,
    current_user as connected_as,
    now() as setup_time;

-- Display table counts
SELECT 
    'Table Row Counts:' as info;
    
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'bus_platform'
ORDER BY n_live_tup DESC
LIMIT 20;
