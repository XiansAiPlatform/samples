-- BUS Platform Analytical Data Warehouse Schema
-- PostgreSQL Database Creation Script

-- Create the database (run this separately if needed)
-- CREATE DATABASE bus_analytics;

-- Connect to the database
-- \c bus_analytics;

-- Create schema for better organization
CREATE SCHEMA IF NOT EXISTS bus_platform;
SET search_path TO bus_platform, public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Reference Tables

-- Localization table for multi-language support
CREATE TABLE localization (
    localization_id INTEGER PRIMARY KEY,
    name VARCHAR(50),
    culture VARCHAR(50)
);

-- Vehicle Make Groups
CREATE TABLE vehicle_make_group (
    vehicle_make_group_id INTEGER PRIMARY KEY,
    name VARCHAR(100)
);

-- Vehicle Makes
CREATE TABLE vehicle_make (
    vehicle_make_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    common BOOLEAN,
    vehicle_make_group_id INTEGER REFERENCES vehicle_make_group(vehicle_make_group_id)
);

-- Vehicle Colors
CREATE TABLE vehicle_color (
    vehicle_color_id INTEGER PRIMARY KEY,
    name VARCHAR(100)
);

-- Object Types
CREATE TABLE object_type (
    object_type_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(100)
);

CREATE TABLE object_type_translation (
    object_type_id INTEGER REFERENCES object_type(object_type_id),
    localization_id INTEGER REFERENCES localization(localization_id),
    name VARCHAR(100),
    PRIMARY KEY (object_type_id, localization_id)
);

-- Markets
CREATE TABLE market (
    market_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    culture_code VARCHAR(10),
    currency_code VARCHAR(10)
);

-- Test Run and Test Management Tables

CREATE TABLE test_run (
    test_run_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(100),
    vehicle_snapshot_id INTEGER,
    market_id INTEGER REFERENCES market(market_id)
);

CREATE TABLE test_run_scope (
    test_run_scope_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(150)
);

CREATE TABLE test_run_scope_translation (
    test_run_scope_id INTEGER REFERENCES test_run_scope(test_run_scope_id),
    localization_id INTEGER REFERENCES localization(localization_id),
    name VARCHAR(150),
    PRIMARY KEY (test_run_scope_id, localization_id)
);

CREATE TABLE test_status (
    test_status_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(50),
    test_run_scope_id INTEGER REFERENCES test_run_scope(test_run_scope_id)
);

CREATE TABLE test_status_translation (
    test_status_id INTEGER REFERENCES test_status(test_status_id),
    localization_id INTEGER REFERENCES localization(localization_id),
    status VARCHAR(150),
    PRIMARY KEY (test_status_id, localization_id)
);

-- Vehicle Snapshot Tables

CREATE TABLE vehicle_snapshot (
    vehicle_snapshot_id INTEGER PRIMARY KEY,
    reg_no VARCHAR(10),
    vin VARCHAR(20),
    vehicle_make VARCHAR(50),
    model VARCHAR(100),
    type VARCHAR(255),
    car_name VARCHAR(250),
    gear VARCHAR(50),
    fuel VARCHAR(50),
    vehicle_snapshot_fuel_id INTEGER,
    color VARCHAR(200),
    axle_count INTEGER,
    model_year INTEGER,
    engine_code VARCHAR(200),
    displacement INTEGER,
    is_hybrid BOOLEAN,
    wheel_drive VARCHAR(50),
    co2_emissions DECIMAL(10,2),
    registration_date TIMESTAMP,
    manufactured_year INTEGER,
    manufactured_month INTEGER,
    cabin_id INTEGER,
    gear_id INTEGER,
    delay_id INTEGER,
    power_outlet_id INTEGER,
    service_agreement_id INTEGER,
    fleet_management_id INTEGER,
    extension_type_id INTEGER,
    vehicle_make_id INTEGER REFERENCES vehicle_make(vehicle_make_id),
    brake_measurement_type SMALLINT,
    fuel_code INTEGER,
    technical_vehicle_group_id INTEGER,
    environment_class_id INTEGER,
    trim_level TEXT,
    is_trim_level_checked BOOLEAN,
    calculated_tax DECIMAL(10,2),
    bonus_malus DECIMAL(10,2),
    latest_mileage INTEGER,
    last_inspected_date TIMESTAMP,
    last_inspected_mileage INTEGER,
    inspection_due_date TIMESTAMP,
    is_biluppgifter_called BOOLEAN,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP,
    body VARCHAR(70),
    recent_registration_date TIMESTAMP,
    registration_country_date TIMESTAMP,
    used_imported BOOLEAN,
    euronorm_name VARCHAR(20),
    engine_power DECIMAL(10,2),
    hybrid_class VARCHAR(25),
    battery_capacity DECIMAL(10,2),
    is_connected_features_subscribed BOOLEAN,
    is_connected_features_affected BOOLEAN,
    obd_error_code_status_enum INTEGER,
    obd_diagnostics_performed_status_enum INTEGER
);

-- Test Tables

CREATE TABLE test (
    test_id INTEGER PRIMARY KEY,
    test_run_id INTEGER REFERENCES test_run(test_run_id),
    test_run_scope_id INTEGER REFERENCES test_run_scope(test_run_scope_id),
    test_status_id INTEGER REFERENCES test_status(test_status_id),
    object_type_id INTEGER REFERENCES object_type(object_type_id),
    unit_id INTEGER,
    vehicle_snapshot_id INTEGER REFERENCES vehicle_snapshot(vehicle_snapshot_id),
    mileage INTEGER,
    is_battery_test_exclude_from_report BOOLEAN,
    is_obd_exclude_from_report BOOLEAN,
    is_obd_performed BOOLEAN,
    viws_inspection_id INTEGER,
    test_general_information_id INTEGER,
    test_drive_id INTEGER,
    copied_from_test_id INTEGER,
    is_mva_selected BOOLEAN,
    expected_arrival_km INTEGER,
    expected_arrival_date TIMESTAMP,
    key_location VARCHAR(500),
    parking_location VARCHAR(500),
    requested_completion_date TIMESTAMP,
    is_public BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    performed_by INTEGER,
    performed_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP,
    completed_date TIMESTAMP,
    external_reference_id TEXT,
    lease_data_id INTEGER,
    show_equipment_on_report BOOLEAN,
    ordered_by_name VARCHAR(200),
    performed_by_identity_id INTEGER,
    created_by_identity_id INTEGER
);

-- Test Type Management

CREATE TABLE test_type_status (
    test_type_status_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(250)
);

CREATE TABLE test_type (
    test_type_id INTEGER PRIMARY KEY,
    test_type_status_id INTEGER REFERENCES test_type_status(test_type_status_id),
    object_type_id INTEGER REFERENCES object_type(object_type_id),
    is_default BOOLEAN DEFAULT false,
    unit_id INTEGER,
    unit_group_id INTEGER,
    internal_description VARCHAR(250),
    include_obd_readings BOOLEAN DEFAULT false,
    is_obd_required BOOLEAN DEFAULT false,
    show_prices_with_tax BOOLEAN DEFAULT true,
    parent_test_type_id INTEGER REFERENCES test_type(test_type_id),
    is_vdn_allowed BOOLEAN DEFAULT false,
    is_public_test_type BOOLEAN DEFAULT true,
    presentation_text TEXT,
    email_recipients TEXT,
    is_mandatory_fields_included BOOLEAN DEFAULT false,
    include_vehicle_images BOOLEAN DEFAULT true,
    is_media_files_mandatory BOOLEAN DEFAULT false,
    is_external_price_catalog_enabled BOOLEAN DEFAULT false,
    include_battery_reading BOOLEAN DEFAULT false,
    is_battery_reading_required BOOLEAN DEFAULT false,
    include_service_history BOOLEAN DEFAULT false,
    is_service_history_required BOOLEAN DEFAULT false,
    include_brake_control_check BOOLEAN DEFAULT false,
    is_brake_control_check_required BOOLEAN DEFAULT false,
    include_lock_nut_check BOOLEAN DEFAULT false,
    is_lock_nut_check_required BOOLEAN DEFAULT false,
    include_minimum_tread_depth_check BOOLEAN DEFAULT false,
    is_minimum_tread_depth_check_required BOOLEAN DEFAULT false,
    is_minimum_tread_depth_check_comment_required BOOLEAN DEFAULT false,
    minimum_tread_depth_for_summer_tyre DECIMAL(5,2),
    minimum_tread_depth_for_winter_tyre DECIMAL(5,2),
    is_low_tread_warning_required BOOLEAN DEFAULT false,
    include_control_checkpoint BOOLEAN DEFAULT false,
    is_control_checkpoint_required BOOLEAN DEFAULT false,
    is_select_mandatory_number_of_images_required BOOLEAN DEFAULT false,
    mandatory_number_of_images INTEGER,
    include_check_number_of_keys BOOLEAN DEFAULT false,
    is_check_number_of_keys_required BOOLEAN DEFAULT false,
    number_of_keys INTEGER,
    include_check_charging_cables BOOLEAN DEFAULT false,
    is_check_charging_cables_required BOOLEAN DEFAULT false,
    number_of_charging_cables INTEGER,
    include_check_luggage_compartment BOOLEAN DEFAULT false,
    is_check_luggage_compartment_required BOOLEAN DEFAULT false,
    include_trial_run BOOLEAN DEFAULT false,
    is_trial_run_required BOOLEAN DEFAULT false,
    include_ac_test BOOLEAN DEFAULT false,
    is_ac_test_required BOOLEAN DEFAULT false,
    is_ac_test_failure_comment_required BOOLEAN DEFAULT false,
    show_defect_price_on_report BOOLEAN DEFAULT true,
    show_checkpoint_controlled_status_on_report BOOLEAN DEFAULT true,
    show_presentation_text_on_report BOOLEAN DEFAULT true,
    show_terms_and_conditions_on_report BOOLEAN DEFAULT true,
    terms_and_conditions TEXT,
    external_file_id INTEGER,
    created_by INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_global BOOLEAN DEFAULT false,
    created_by_identity_id INTEGER
);

-- Checkpoint Management Tables

CREATE TABLE checkpoint_group (
    checkpoint_group_id INTEGER PRIMARY KEY,
    sort_order INTEGER,
    internal_description VARCHAR(100)
);

CREATE TABLE checkpoint (
    checkpoint_id INTEGER PRIMARY KEY,
    checkpoint_group_id INTEGER REFERENCES checkpoint_group(checkpoint_group_id),
    internal_description VARCHAR(100)
);

CREATE TABLE checkpoint_comment (
    checkpoint_comment_id INTEGER PRIMARY KEY,
    checkpoint_id INTEGER REFERENCES checkpoint(checkpoint_id),
    internal_description VARCHAR(250),
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    test_section_id INTEGER
);

-- Test Actions and Positions

CREATE TABLE test_action (
    test_action_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(100)
);

CREATE TABLE test_position (
    test_position_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(100)
);

-- Test Defects

CREATE TABLE test_defect (
    test_defect_id INTEGER PRIMARY KEY,
    test_id INTEGER REFERENCES test(test_id),
    parent_test_defect_id INTEGER REFERENCES test_defect(test_defect_id),
    checkpoint_instance_id INTEGER,
    checkpoint_comment_id INTEGER REFERENCES checkpoint_comment(checkpoint_comment_id),
    common_cost DECIMAL(10,2),
    work_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    is_tax_included BOOLEAN DEFAULT true,
    comment VARCHAR(500)
);

-- Sales Reports

CREATE TABLE sales_report_type (
    sales_report_type_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(250)
);

CREATE TABLE sales_report (
    sales_report_id INTEGER PRIMARY KEY,
    sales_report_type_id INTEGER REFERENCES sales_report_type(sales_report_type_id),
    test_id INTEGER REFERENCES test(test_id),
    show_equipment_on_report BOOLEAN DEFAULT true,
    deviation_notes TEXT
);

-- Work Orders

CREATE TABLE work_order (
    work_order_id INTEGER PRIMARY KEY,
    test_id INTEGER REFERENCES test(test_id),
    jobs_start_date TIMESTAMP,
    jobs_completion_date TIMESTAMP
);

CREATE TABLE work_order_job_status (
    work_order_job_status_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(250)
);

CREATE TABLE work_order_job_type (
    work_order_job_type_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(250)
);

CREATE TABLE work_order_job (
    work_order_job_id INTEGER PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_order(work_order_id),
    work_order_job_status_id INTEGER REFERENCES work_order_job_status(work_order_job_status_id),
    work_order_job_type_id INTEGER REFERENCES work_order_job_type(work_order_job_type_id),
    test_defect_id INTEGER REFERENCES test_defect(test_defect_id),
    standard_job_id INTEGER,
    job_name VARCHAR(1000),
    repair_cost DECIMAL(10,2),
    external_cost DECIMAL(10,2),
    supplier_id INTEGER,
    is_shared BOOLEAN DEFAULT false,
    is_sent_to_supplier BOOLEAN DEFAULT false,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    comment TEXT
);

-- Price Catalogs

CREATE TABLE price_catalog_status (
    price_catalog_status_id INTEGER PRIMARY KEY,
    internal_description VARCHAR(250)
);

CREATE TABLE price_catalog (
    price_catalog_id INTEGER PRIMARY KEY,
    price_catalog_status_id INTEGER REFERENCES price_catalog_status(price_catalog_status_id),
    name VARCHAR(200),
    source VARCHAR(250),
    unit_id INTEGER,
    group_id INTEGER,
    parent_price_catalog_id INTEGER REFERENCES price_catalog(price_catalog_id),
    is_price_include_tax BOOLEAN DEFAULT true,
    use_limited_validity_period BOOLEAN DEFAULT false,
    is_price_catalog_lock_for_test_type BOOLEAN DEFAULT false,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_identity_id INTEGER
);

-- External Files

CREATE TABLE external_file (
    external_file_id INTEGER PRIMARY KEY,
    blob_file_id UUID DEFAULT uuid_generate_v4(),
    blob_file_name VARCHAR(200),
    blob_file_path VARCHAR(250),
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Run Attachments

CREATE TABLE test_run_attachment (
    test_run_attachment_id INTEGER PRIMARY KEY,
    test_run_id INTEGER REFERENCES test_run(test_run_id),
    external_file_id INTEGER REFERENCES external_file(external_file_id)
);

-- Link Tables

CREATE TABLE link_test_test_type (
    test_id INTEGER REFERENCES test(test_id),
    test_type_id INTEGER REFERENCES test_type(test_type_id),
    PRIMARY KEY (test_id, test_type_id)
);

CREATE TABLE link_object_type_checkpoint (
    object_type_id INTEGER REFERENCES object_type(object_type_id),
    checkpoint_id INTEGER REFERENCES checkpoint(checkpoint_id),
    PRIMARY KEY (object_type_id, checkpoint_id)
);

CREATE TABLE link_test_defect_action (
    test_defect_id INTEGER REFERENCES test_defect(test_defect_id),
    test_action_id INTEGER REFERENCES test_action(test_action_id),
    PRIMARY KEY (test_defect_id, test_action_id)
);

CREATE TABLE link_test_defect_position (
    test_defect_id INTEGER REFERENCES test_defect(test_defect_id),
    test_position_id INTEGER REFERENCES test_position(test_position_id),
    PRIMARY KEY (test_defect_id, test_position_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_test_vehicle_snapshot ON test(vehicle_snapshot_id);
CREATE INDEX idx_test_test_run ON test(test_run_id);
CREATE INDEX idx_test_created_date ON test(created_date);
CREATE INDEX idx_test_status ON test(test_status_id);
CREATE INDEX idx_vehicle_snapshot_vin ON vehicle_snapshot(vin);
CREATE INDEX idx_vehicle_snapshot_reg_no ON vehicle_snapshot(reg_no);
CREATE INDEX idx_test_defect_test ON test_defect(test_id);
CREATE INDEX idx_work_order_test ON work_order(test_id);
CREATE INDEX idx_sales_report_test ON sales_report(test_id);

-- Add comments for documentation
COMMENT ON TABLE test IS 'Main test table containing all vehicle tests performed';
COMMENT ON TABLE vehicle_snapshot IS 'Snapshot of vehicle data at the time of testing';
COMMENT ON TABLE test_defect IS 'Defects found during vehicle testing';
COMMENT ON TABLE work_order IS 'Work orders created based on test results';
COMMENT ON TABLE sales_report IS 'Sales reports generated from tests';
