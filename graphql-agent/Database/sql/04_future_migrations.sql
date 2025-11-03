-- BUS Platform Future Migrations
-- This file is a template for adding new migrations to the database

-- Migration naming convention: YYYYMMDD_description.sql
-- Example: 20240115_add_battery_test_results.sql

SET search_path TO bus_platform, public;

-- Example migration: Add battery test results table
-- Uncomment and modify as needed

/*
-- Migration: 20240115_add_battery_test_results
-- Description: Add table to store detailed battery test results

CREATE TABLE IF NOT EXISTS battery_test_result (
    battery_test_result_id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES test(test_id),
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    battery_health_percentage DECIMAL(5,2),
    voltage DECIMAL(5,2),
    internal_resistance DECIMAL(10,4),
    cold_cranking_amps INTEGER,
    state_of_charge DECIMAL(5,2),
    temperature_celsius DECIMAL(5,2),
    test_duration_seconds INTEGER,
    test_result VARCHAR(50),
    recommendations TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_battery_test_result_test_id ON battery_test_result(test_id);
CREATE INDEX idx_battery_test_result_date ON battery_test_result(test_date);

-- Add comments
COMMENT ON TABLE battery_test_result IS 'Detailed battery test results from electronic battery testers';
COMMENT ON COLUMN battery_test_result.battery_health_percentage IS 'Overall battery health as percentage (0-100)';
COMMENT ON COLUMN battery_test_result.cold_cranking_amps IS 'Cold Cranking Amps (CCA) measurement';
*/

-- Example migration: Add ADAS calibration tracking
-- Uncomment and modify as needed

/*
-- Migration: 20240120_add_adas_calibration
-- Description: Add tables to track ADAS (Advanced Driver Assistance Systems) calibration

CREATE TABLE IF NOT EXISTS adas_system_type (
    adas_system_type_id SERIAL PRIMARY KEY,
    internal_description VARCHAR(100),
    requires_calibration BOOLEAN DEFAULT true,
    calibration_frequency_months INTEGER
);

CREATE TABLE IF NOT EXISTS adas_calibration (
    adas_calibration_id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES test(test_id),
    adas_system_type_id INTEGER REFERENCES adas_system_type(adas_system_type_id),
    calibration_required BOOLEAN,
    calibration_performed BOOLEAN,
    calibration_date TIMESTAMP,
    calibration_cost DECIMAL(10,2),
    technician_notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert reference data
INSERT INTO adas_system_type (internal_description, requires_calibration, calibration_frequency_months) VALUES
('Front Camera', true, 12),
('Radar Sensors', true, 24),
('Lidar', true, 12),
('Ultrasonic Sensors', false, NULL),
('Lane Departure Warning', true, 12),
('Adaptive Cruise Control', true, 24);
*/

-- Example migration: Add electric vehicle specific data
-- Uncomment and modify as needed

/*
-- Migration: 20240125_add_ev_specific_data
-- Description: Add tables for electric vehicle specific testing data

CREATE TABLE IF NOT EXISTS ev_battery_module (
    ev_battery_module_id SERIAL PRIMARY KEY,
    vehicle_snapshot_id INTEGER REFERENCES vehicle_snapshot(vehicle_snapshot_id),
    module_position VARCHAR(50),
    module_voltage DECIMAL(6,2),
    module_temperature DECIMAL(5,2),
    module_health_status VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ev_charging_test (
    ev_charging_test_id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES test(test_id),
    dc_fast_charge_tested BOOLEAN,
    dc_charge_rate_kw DECIMAL(6,2),
    ac_charge_tested BOOLEAN,
    ac_charge_rate_kw DECIMAL(6,2),
    charging_port_condition VARCHAR(100),
    cable_condition VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

-- Template for adding a new migration:
/*
-- Migration: YYYYMMDD_description_here
-- Description: Detailed description of what this migration does
-- Author: Your name
-- Date: YYYY-MM-DD

-- Your SQL statements here

-- Always include:
-- 1. CREATE TABLE statements with proper foreign keys
-- 2. CREATE INDEX statements for performance
-- 3. INSERT statements for reference data if needed
-- 4. COMMENT statements for documentation
-- 5. GRANT statements if new permissions are needed
*/

-- Function to track migration history (run once to set up)
CREATE TABLE IF NOT EXISTS migration_history (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    description TEXT
);

-- Example of recording a migration
/*
INSERT INTO migration_history (migration_name, description)
VALUES ('20240115_add_battery_test_results', 'Added battery test results table for detailed battery health tracking');
*/
