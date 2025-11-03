-- BUS Platform Sample Data
-- This script inserts sample data for testing and demonstration purposes

SET search_path TO bus_platform, public;

-- Insert Localizations
INSERT INTO localization (localization_id, name, culture) VALUES
(1, 'English', 'en-US'),
(2, 'Swedish', 'sv-SE'),
(3, 'Norwegian', 'nb-NO'),
(4, 'Danish', 'da-DK'),
(5, 'German', 'de-DE');

-- Insert Markets
INSERT INTO market (market_id, name, culture_code, currency_code) VALUES
(1, 'United States', 'en-US', 'USD'),
(2, 'Sweden', 'sv-SE', 'SEK'),
(3, 'Norway', 'nb-NO', 'NOK'),
(4, 'Denmark', 'da-DK', 'DKK'),
(5, 'Germany', 'de-DE', 'EUR');

-- Insert Vehicle Make Groups
INSERT INTO vehicle_make_group (vehicle_make_group_id, name) VALUES
(1, 'Volkswagen Group'),
(2, 'Stellantis'),
(3, 'BMW Group'),
(4, 'Mercedes-Benz Group'),
(5, 'Toyota Group'),
(6, 'Ford Motor Company'),
(7, 'General Motors'),
(8, 'Hyundai Motor Group'),
(9, 'Renault-Nissan-Mitsubishi'),
(10, 'Others');

-- Insert Vehicle Makes
INSERT INTO vehicle_make (vehicle_make_id, name, common, vehicle_make_group_id) VALUES
(1, 'Volkswagen', true, 1),
(2, 'Audi', true, 1),
(3, 'Porsche', true, 1),
(4, 'BMW', true, 3),
(5, 'Mercedes-Benz', true, 4),
(6, 'Toyota', true, 5),
(7, 'Lexus', false, 5),
(8, 'Ford', true, 6),
(9, 'Volvo', true, 10),
(10, 'Peugeot', true, 2),
(11, 'Citroën', true, 2),
(12, 'Opel', true, 2),
(13, 'Fiat', true, 2),
(14, 'Nissan', true, 9),
(15, 'Renault', true, 9),
(16, 'Hyundai', true, 8),
(17, 'Kia', true, 8),
(18, 'Mazda', true, 10),
(19, 'Tesla', true, 10),
(20, 'Skoda', true, 1);

-- Insert Vehicle Colors
INSERT INTO vehicle_color (vehicle_color_id, name) VALUES
(1, 'Black'),
(2, 'White'),
(3, 'Silver'),
(4, 'Gray'),
(5, 'Red'),
(6, 'Blue'),
(7, 'Green'),
(8, 'Yellow'),
(9, 'Orange'),
(10, 'Brown');

-- Insert Object Types
INSERT INTO object_type (object_type_id, internal_description) VALUES
(1, 'Passenger Car'),
(2, 'Light Commercial Vehicle'),
(3, 'Heavy Commercial Vehicle'),
(4, 'Motorcycle'),
(5, 'Bus'),
(6, 'Trailer');

INSERT INTO object_type_translation (object_type_id, localization_id, name) VALUES
(1, 1, 'Passenger Car'),
(1, 2, 'Personbil'),
(2, 1, 'Light Commercial Vehicle'),
(2, 2, 'Lätt lastbil'),
(3, 1, 'Heavy Commercial Vehicle'),
(3, 2, 'Tung lastbil'),
(4, 1, 'Motorcycle'),
(4, 2, 'Motorcykel'),
(5, 1, 'Bus'),
(5, 2, 'Buss'),
(6, 1, 'Trailer'),
(6, 2, 'Släpvagn');

-- Insert Test Run Scopes
INSERT INTO test_run_scope (test_run_scope_id, internal_description) VALUES
(1, 'Pre-Purchase Inspection'),
(2, 'Annual Inspection'),
(3, 'Warranty Inspection'),
(4, 'Damage Assessment'),
(5, 'Lease Return Inspection');

INSERT INTO test_run_scope_translation (test_run_scope_id, localization_id, name) VALUES
(1, 1, 'Pre-Purchase Inspection'),
(1, 2, 'Köpbesiktning'),
(2, 1, 'Annual Inspection'),
(2, 2, 'Årlig kontroll'),
(3, 1, 'Warranty Inspection'),
(3, 2, 'Garantibesiktning'),
(4, 1, 'Damage Assessment'),
(4, 2, 'Skadebedömning'),
(5, 1, 'Lease Return Inspection'),
(5, 2, 'Återlämningsbesiktning');

-- Insert Test Statuses
INSERT INTO test_status (test_status_id, internal_description, test_run_scope_id) VALUES
(1, 'Draft', NULL),
(2, 'Scheduled', NULL),
(3, 'In Progress', NULL),
(4, 'Completed', NULL),
(5, 'Cancelled', NULL),
(6, 'On Hold', NULL);

INSERT INTO test_status_translation (test_status_id, localization_id, status) VALUES
(1, 1, 'Draft'),
(1, 2, 'Utkast'),
(2, 1, 'Scheduled'),
(2, 2, 'Schemalagd'),
(3, 1, 'In Progress'),
(3, 2, 'Pågående'),
(4, 1, 'Completed'),
(4, 2, 'Slutförd'),
(5, 1, 'Cancelled'),
(5, 2, 'Avbruten'),
(6, 1, 'On Hold'),
(6, 2, 'Pausad');

-- Insert Test Type Statuses
INSERT INTO test_type_status (test_type_status_id, internal_description) VALUES
(1, 'Active'),
(2, 'Inactive'),
(3, 'Deprecated');

-- Insert Test Types
INSERT INTO test_type (test_type_id, test_type_status_id, object_type_id, is_default, internal_description, include_obd_readings, is_obd_required, show_prices_with_tax, is_public_test_type) VALUES
(1, 1, 1, true, 'Standard Vehicle Inspection', true, false, true, true),
(2, 1, 1, false, 'Premium Vehicle Inspection', true, true, true, true),
(3, 1, 1, false, 'Basic Safety Check', false, false, true, true),
(4, 1, 1, false, 'Comprehensive Technical Inspection', true, true, true, true),
(5, 1, 1, false, 'Electric Vehicle Inspection', true, false, true, true),
(6, 1, 2, true, 'Commercial Vehicle Standard Check', true, false, true, true),
(7, 1, 1, false, 'Pre-Purchase Inspection', true, true, true, true),
(8, 1, 1, false, 'Warranty Inspection', true, false, true, false),
(9, 1, 1, false, 'Insurance Inspection', true, true, true, false),
(10, 1, 1, false, 'Lease Return Inspection', true, true, true, false);

-- Insert Checkpoint Groups
INSERT INTO checkpoint_group (checkpoint_group_id, sort_order, internal_description) VALUES
(1, 10, 'Exterior'),
(2, 20, 'Interior'),
(3, 30, 'Engine & Transmission'),
(4, 40, 'Brakes & Suspension'),
(5, 50, 'Electrical Systems'),
(6, 60, 'Safety Features'),
(7, 70, 'Documentation'),
(8, 80, 'Test Drive');

-- Insert Checkpoints
INSERT INTO checkpoint (checkpoint_id, checkpoint_group_id, internal_description) VALUES
-- Exterior checkpoints
(1, 1, 'Body Condition'),
(2, 1, 'Paint Quality'),
(3, 1, 'Glass & Mirrors'),
(4, 1, 'Lights & Indicators'),
(5, 1, 'Tires & Wheels'),
-- Interior checkpoints
(6, 2, 'Seats & Upholstery'),
(7, 2, 'Dashboard & Controls'),
(8, 2, 'Air Conditioning'),
(9, 2, 'Audio System'),
(10, 2, 'Safety Equipment'),
-- Engine checkpoints
(11, 3, 'Engine Condition'),
(12, 3, 'Transmission Operation'),
(13, 3, 'Fluid Levels'),
(14, 3, 'Exhaust System'),
(15, 3, 'Cooling System'),
-- Brakes & Suspension
(16, 4, 'Brake Pads & Discs'),
(17, 4, 'Brake Fluid'),
(18, 4, 'Suspension Components'),
(19, 4, 'Steering System'),
(20, 4, 'Wheel Alignment');

-- Insert Test Actions
INSERT INTO test_action (test_action_id, internal_description) VALUES
(1, 'Replace'),
(2, 'Repair'),
(3, 'Adjust'),
(4, 'Clean'),
(5, 'Monitor'),
(6, 'No Action Required');

-- Insert Test Positions
INSERT INTO test_position (test_position_id, internal_description) VALUES
(1, 'Front Left'),
(2, 'Front Right'),
(3, 'Rear Left'),
(4, 'Rear Right'),
(5, 'Front'),
(6, 'Rear'),
(7, 'Center'),
(8, 'Driver Side'),
(9, 'Passenger Side'),
(10, 'Engine Bay');

-- Insert Sample Vehicle Snapshots
INSERT INTO vehicle_snapshot (
    vehicle_snapshot_id, reg_no, vin, vehicle_make, model, type, car_name,
    gear, fuel, color, model_year, engine_code, displacement, is_hybrid,
    wheel_drive, co2_emissions, registration_date, manufactured_year,
    vehicle_make_id, latest_mileage, created_date
) VALUES
(1, 'ABC123', 'WVWZZZ3CZHE123456', 'Volkswagen', 'Golf', 'Hatchback', 'Golf 1.5 TSI Style',
 'Manual', 'Petrol', 'Black', 2021, 'DADA', 1498, false, 'FWD', 130.5,
 '2021-03-15', 2021, 1, 45000, CURRENT_TIMESTAMP),
 
(2, 'XYZ789', 'WAUZZZ8V8KA123456', 'Audi', 'A4', 'Sedan', 'A4 40 TFSI S line',
 'Automatic', 'Petrol', 'White', 2020, 'DETA', 1984, false, 'AWD', 142.0,
 '2020-06-20', 2020, 2, 62000, CURRENT_TIMESTAMP),
 
(3, 'DEF456', 'WBA5B3C50GG123456', 'BMW', '3 Series', 'Sedan', '320d M Sport',
 'Automatic', 'Diesel', 'Gray', 2019, 'B47D20', 1995, false, 'RWD', 110.0,
 '2019-09-10', 2019, 4, 78000, CURRENT_TIMESTAMP),
 
(4, 'GHI789', 'WDD2130421A123456', 'Mercedes-Benz', 'C-Class', 'Sedan', 'C200 AMG Line',
 'Automatic', 'Petrol', 'Silver', 2021, 'M264', 1496, true, 'RWD', 134.0,
 '2021-11-05', 2021, 5, 25000, CURRENT_TIMESTAMP),
 
(5, 'JKL012', 'JTDKBRFU9K3123456', 'Toyota', 'Corolla', 'Sedan', 'Corolla 1.8 Hybrid Active',
 'Automatic', 'Hybrid', 'Blue', 2020, '2ZR-FXE', 1798, true, 'FWD', 76.0,
 '2020-04-22', 2020, 6, 38000, CURRENT_TIMESTAMP),
 
(6, 'MNO345', 'YV1CZ88C8K1123456', 'Volvo', 'XC60', 'SUV', 'XC60 B5 AWD Inscription',
 'Automatic', 'Petrol', 'Black', 2019, 'B420', 1969, true, 'AWD', 163.0,
 '2019-12-18', 2019, 9, 52000, CURRENT_TIMESTAMP),
 
(7, 'PQR678', '5YJ3E1EA8KF123456', 'Tesla', 'Model 3', 'Sedan', 'Model 3 Long Range AWD',
 'Automatic', 'Electric', 'Red', 2021, 'Electric', 0, false, 'AWD', 0.0,
 '2021-07-30', 2021, 19, 18000, CURRENT_TIMESTAMP),
 
(8, 'STU901', 'WF0FXXGCDFKR12345', 'Ford', 'Focus', 'Hatchback', 'Focus 1.0 EcoBoost Titanium',
 'Manual', 'Petrol', 'Blue', 2020, 'M1DA', 999, false, 'FWD', 114.0,
 '2020-02-14', 2020, 8, 41000, CURRENT_TIMESTAMP),
 
(9, 'VWX234', 'VF3LCYHZPKS123456', 'Peugeot', '3008', 'SUV', '3008 1.5 BlueHDi Allure',
 'Automatic', 'Diesel', 'Gray', 2021, 'DV5RC', 1499, false, 'FWD', 106.0,
 '2021-05-28', 2021, 10, 29000, CURRENT_TIMESTAMP),
 
(10, 'YZA567', 'TMBJG7NE4L0123456', 'Skoda', 'Octavia', 'Wagon', 'Octavia 1.5 TSI Style',
 'Manual', 'Petrol', 'Silver', 2020, 'DADA', 1498, false, 'FWD', 113.0,
 '2020-10-12', 2020, 20, 55000, CURRENT_TIMESTAMP);

-- Insert Test Runs
INSERT INTO test_run (test_run_id, internal_description, vehicle_snapshot_id, market_id) VALUES
(1, 'Q4 2021 Inspection Batch', 1, 2),
(2, 'Q1 2022 Inspection Batch', 2, 2),
(3, 'Q2 2022 Inspection Batch', 3, 2),
(4, 'Q3 2022 Inspection Batch', 4, 2),
(5, 'Q4 2022 Inspection Batch', 5, 2);

-- Insert Sample Tests
INSERT INTO test (
    test_id, test_run_id, test_run_scope_id, test_status_id, object_type_id,
    unit_id, vehicle_snapshot_id, mileage, is_public, created_date, performed_date
) VALUES
(1, 1, 1, 4, 1, 1, 1, 45000, true, '2021-12-10', '2021-12-12'),
(2, 1, 2, 4, 1, 1, 2, 62000, true, '2021-12-11', '2021-12-13'),
(3, 2, 1, 4, 1, 1, 3, 78000, true, '2022-03-15', '2022-03-17'),
(4, 2, 3, 4, 1, 1, 4, 25000, true, '2022-03-16', '2022-03-18'),
(5, 3, 1, 4, 1, 1, 5, 38000, true, '2022-06-20', '2022-06-22'),
(6, 3, 2, 3, 1, 2, 6, 52000, true, '2022-06-21', NULL),
(7, 4, 1, 2, 1, 2, 7, 18000, true, '2022-09-10', NULL),
(8, 4, 5, 2, 1, 2, 8, 41000, true, '2022-09-11', NULL),
(9, 5, 1, 1, 1, 3, 9, 29000, true, '2022-12-05', NULL),
(10, 5, 4, 1, 1, 3, 10, 55000, true, '2022-12-06', NULL);

-- Link Tests to Test Types
INSERT INTO link_test_test_type (test_id, test_type_id) VALUES
(1, 1),
(2, 2),
(3, 7),
(4, 8),
(5, 1),
(6, 2),
(7, 5),
(8, 10),
(9, 7),
(10, 4);

-- Insert Sample Checkpoint Comments
INSERT INTO checkpoint_comment (checkpoint_comment_id, checkpoint_id, internal_description, valid_from, valid_to) VALUES
(1, 1, 'Minor scratches acceptable', '2021-01-01', NULL),
(2, 1, 'Dents requiring repair', '2021-01-01', NULL),
(3, 2, 'Paint in good condition', '2021-01-01', NULL),
(4, 2, 'Paint damage visible', '2021-01-01', NULL),
(5, 5, 'Tread depth above 3mm', '2021-01-01', NULL),
(6, 5, 'Tread depth below 3mm', '2021-01-01', NULL),
(7, 11, 'Engine running smoothly', '2021-01-01', NULL),
(8, 11, 'Engine noise detected', '2021-01-01', NULL),
(9, 16, 'Brake pads above 50%', '2021-01-01', NULL),
(10, 16, 'Brake pads below 30%', '2021-01-01', NULL);

-- Insert Sample Test Defects
INSERT INTO test_defect (
    test_defect_id, test_id, checkpoint_comment_id, common_cost, work_cost,
    parts_cost, is_tax_included, comment
) VALUES
(1, 1, 2, 0, 150.00, 50.00, true, 'Front bumper dent needs repair'),
(2, 1, 6, 0, 0, 400.00, true, 'Front tires need replacement'),
(3, 2, 4, 0, 200.00, 100.00, true, 'Paint scratch on driver door'),
(4, 3, 8, 0, 300.00, 0, true, 'Engine timing belt noise'),
(5, 3, 10, 0, 100.00, 250.00, true, 'Front brake pads worn'),
(6, 4, 1, 0, 0, 0, true, 'Minor scratches - acceptable wear'),
(7, 5, 6, 0, 0, 800.00, true, 'All tires need replacement'),
(8, 5, 10, 0, 100.00, 500.00, true, 'Complete brake service needed');

-- Link defects to actions
INSERT INTO link_test_defect_action (test_defect_id, test_action_id) VALUES
(1, 2), -- Repair
(2, 1), -- Replace
(3, 2), -- Repair
(4, 3), -- Adjust
(5, 1), -- Replace
(6, 6), -- No Action Required
(7, 1), -- Replace
(8, 1); -- Replace

-- Link defects to positions
INSERT INTO link_test_defect_position (test_defect_id, test_position_id) VALUES
(1, 5), -- Front
(2, 1), -- Front Left
(2, 2), -- Front Right
(3, 8), -- Driver Side
(4, 10), -- Engine Bay
(5, 5), -- Front
(7, 1), -- Front Left
(7, 2), -- Front Right
(7, 3), -- Rear Left
(7, 4), -- Rear Right
(8, 5); -- Front

-- Insert Sample Sales Reports
INSERT INTO sales_report_type (sales_report_type_id, internal_description) VALUES
(1, 'Standard Sales Report'),
(2, 'Detailed Technical Report'),
(3, 'Insurance Report'),
(4, 'Warranty Report');

INSERT INTO sales_report (sales_report_id, sales_report_type_id, test_id, show_equipment_on_report) VALUES
(1, 1, 1, true),
(2, 2, 2, true),
(3, 1, 3, true),
(4, 4, 4, true),
(5, 1, 5, true);

-- Insert Sample Work Orders
INSERT INTO work_order_job_status (work_order_job_status_id, internal_description) VALUES
(1, 'Pending'),
(2, 'In Progress'),
(3, 'Completed'),
(4, 'Cancelled');

INSERT INTO work_order_job_type (work_order_job_type_id, internal_description) VALUES
(1, 'Repair'),
(2, 'Replacement'),
(3, 'Maintenance'),
(4, 'Inspection');

INSERT INTO work_order (work_order_id, test_id, jobs_start_date, jobs_completion_date) VALUES
(1, 1, '2021-12-15', '2021-12-17'),
(2, 2, '2021-12-16', '2021-12-18'),
(3, 3, '2022-03-20', '2022-03-22'),
(4, 5, '2022-06-25', '2022-06-27');

INSERT INTO work_order_job (
    work_order_job_id, work_order_id, work_order_job_status_id, work_order_job_type_id,
    test_defect_id, job_name, repair_cost, start_date, completion_date
) VALUES
(1, 1, 3, 1, 1, 'Front bumper dent repair', 150.00, '2021-12-15', '2021-12-15'),
(2, 1, 3, 2, 2, 'Front tire replacement', 400.00, '2021-12-16', '2021-12-16'),
(3, 2, 3, 1, 3, 'Paint scratch repair - driver door', 200.00, '2021-12-16', '2021-12-17'),
(4, 3, 3, 3, 4, 'Engine timing belt adjustment', 300.00, '2022-03-20', '2022-03-20'),
(5, 3, 3, 2, 5, 'Front brake pad replacement', 350.00, '2022-03-21', '2022-03-21'),
(6, 4, 3, 2, 7, 'Complete tire replacement', 800.00, '2022-06-25', '2022-06-26'),
(7, 4, 3, 3, 8, 'Complete brake service', 600.00, '2022-06-26', '2022-06-27');

-- Insert External Files (sample attachments)
INSERT INTO external_file (external_file_id, blob_file_name, blob_file_path) VALUES
(1, 'test_1_front_view.jpg', '/storage/attachments/2021/12/test_1_front_view.jpg'),
(2, 'test_1_damage_detail.jpg', '/storage/attachments/2021/12/test_1_damage_detail.jpg'),
(3, 'test_2_inspection_report.pdf', '/storage/attachments/2021/12/test_2_inspection_report.pdf'),
(4, 'test_3_engine_video.mp4', '/storage/attachments/2022/03/test_3_engine_video.mp4'),
(5, 'test_5_complete_report.pdf', '/storage/attachments/2022/06/test_5_complete_report.pdf');

-- Insert Test Run Attachments
INSERT INTO test_run_attachment (test_run_attachment_id, test_run_id, external_file_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 2, 4),
(5, 3, 5);

-- Insert Sample Price Catalogs
INSERT INTO price_catalog_status (price_catalog_status_id, internal_description) VALUES
(1, 'Active'),
(2, 'Inactive'),
(3, 'Draft');

INSERT INTO price_catalog (
    price_catalog_id, price_catalog_status_id, name, source, unit_id,
    is_price_include_tax, created_date
) VALUES
(1, 1, 'Standard Price Catalog 2022', 'Internal', 1, true, '2022-01-01'),
(2, 1, 'Premium Service Catalog 2022', 'Internal', 1, true, '2022-01-01'),
(3, 1, 'Commercial Vehicle Catalog 2022', 'Internal', 2, true, '2022-01-01'),
(4, 1, 'Electric Vehicle Service Catalog', 'Internal', 1, true, '2022-06-01'),
(5, 2, 'Legacy Price Catalog 2021', 'Internal', 1, true, '2021-01-01');

-- Create some aggregated statistics views for analytical queries
CREATE OR REPLACE VIEW test_statistics AS
SELECT 
    DATE_TRUNC('month', t.created_date) as month,
    COUNT(t.test_id) as total_tests,
    COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) as completed_tests,
    COUNT(DISTINCT t.vehicle_snapshot_id) as unique_vehicles,
    AVG(t.mileage) as avg_mileage,
    COUNT(DISTINCT vm.vehicle_make_id) as unique_makes
FROM test t
LEFT JOIN vehicle_snapshot vs ON t.vehicle_snapshot_id = vs.vehicle_snapshot_id
LEFT JOIN vehicle_make vm ON vs.vehicle_make_id = vm.vehicle_make_id
GROUP BY DATE_TRUNC('month', t.created_date);

CREATE OR REPLACE VIEW defect_analysis AS
SELECT 
    cp.internal_description as checkpoint,
    cg.internal_description as checkpoint_group,
    COUNT(td.test_defect_id) as defect_count,
    AVG(td.common_cost + td.work_cost + td.parts_cost) as avg_total_cost,
    SUM(td.common_cost + td.work_cost + td.parts_cost) as total_cost
FROM test_defect td
JOIN checkpoint_comment cc ON td.checkpoint_comment_id = cc.checkpoint_comment_id
JOIN checkpoint cp ON cc.checkpoint_id = cp.checkpoint_id
JOIN checkpoint_group cg ON cp.checkpoint_group_id = cg.checkpoint_group_id
GROUP BY cp.checkpoint_id, cp.internal_description, cg.internal_description
ORDER BY defect_count DESC;

CREATE OR REPLACE VIEW vehicle_make_performance AS
SELECT 
    vm.name as make,
    vmg.name as make_group,
    COUNT(DISTINCT t.test_id) as total_tests,
    COUNT(DISTINCT td.test_defect_id) as total_defects,
    AVG(vs.latest_mileage) as avg_mileage,
    AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, vs.registration_date))) as avg_age_years
FROM vehicle_make vm
LEFT JOIN vehicle_make_group vmg ON vm.vehicle_make_group_id = vmg.vehicle_make_group_id
LEFT JOIN vehicle_snapshot vs ON vm.vehicle_make_id = vs.vehicle_make_id
LEFT JOIN test t ON vs.vehicle_snapshot_id = t.vehicle_snapshot_id
LEFT JOIN test_defect td ON t.test_id = td.test_id
GROUP BY vm.vehicle_make_id, vm.name, vmg.name
HAVING COUNT(DISTINCT t.test_id) > 0
ORDER BY total_tests DESC;

-- Grant permissions for Hasura
GRANT USAGE ON SCHEMA bus_platform TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bus_platform TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bus_platform TO PUBLIC;
