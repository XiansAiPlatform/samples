-- BUS Platform Analytical Queries
-- Sample analytical queries for the data warehouse

SET search_path TO bus_platform, public;

-- 1. Monthly Test Volume Analysis
-- Shows test volume trends over time
SELECT 
    TO_CHAR(t.created_date, 'YYYY-MM') as month,
    trs.internal_description as test_scope,
    COUNT(t.test_id) as test_count,
    COUNT(DISTINCT t.vehicle_snapshot_id) as unique_vehicles,
    COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) as completed_tests,
    ROUND(100.0 * COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) / COUNT(t.test_id), 2) as completion_rate
FROM test t
JOIN test_run_scope trs ON t.test_run_scope_id = trs.test_run_scope_id
WHERE t.created_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(t.created_date, 'YYYY-MM'), trs.internal_description
ORDER BY month DESC, test_count DESC;

-- 2. Vehicle Make Defect Analysis
-- Identifies which vehicle makes have the most defects
WITH defect_stats AS (
    SELECT 
        vm.name as vehicle_make,
        COUNT(DISTINCT t.test_id) as tests_performed,
        COUNT(DISTINCT td.test_defect_id) as total_defects,
        SUM(td.common_cost + td.work_cost + td.parts_cost) as total_repair_cost,
        AVG(vs.latest_mileage) as avg_mileage,
        AVG(EXTRACT(YEAR FROM AGE(t.performed_date, vs.registration_date))) as avg_vehicle_age
    FROM vehicle_make vm
    JOIN vehicle_snapshot vs ON vm.vehicle_make_id = vs.vehicle_make_id
    JOIN test t ON vs.vehicle_snapshot_id = t.vehicle_snapshot_id
    LEFT JOIN test_defect td ON t.test_id = td.test_id
    WHERE t.test_status_id = 4  -- Completed tests only
    GROUP BY vm.name
)
SELECT 
    vehicle_make,
    tests_performed,
    total_defects,
    ROUND(total_defects::numeric / tests_performed, 2) as defects_per_test,
    ROUND(total_repair_cost::numeric, 2) as total_repair_cost,
    ROUND(total_repair_cost::numeric / tests_performed, 2) as avg_repair_cost_per_test,
    ROUND(avg_mileage::numeric, 0) as avg_mileage,
    ROUND(avg_vehicle_age::numeric, 1) as avg_vehicle_age_years
FROM defect_stats
WHERE tests_performed > 0
ORDER BY defects_per_test DESC;

-- 3. Most Common Defects by Checkpoint
-- Identifies the most frequently failing checkpoints
SELECT 
    cg.internal_description as checkpoint_group,
    cp.internal_description as checkpoint,
    cc.internal_description as defect_type,
    COUNT(td.test_defect_id) as defect_count,
    ROUND(AVG(td.common_cost + td.work_cost + td.parts_cost), 2) as avg_repair_cost,
    ROUND(SUM(td.common_cost + td.work_cost + td.parts_cost), 2) as total_repair_cost
FROM test_defect td
JOIN checkpoint_comment cc ON td.checkpoint_comment_id = cc.checkpoint_comment_id
JOIN checkpoint cp ON cc.checkpoint_id = cp.checkpoint_id
JOIN checkpoint_group cg ON cp.checkpoint_group_id = cg.checkpoint_group_id
GROUP BY cg.internal_description, cp.internal_description, cc.internal_description
ORDER BY defect_count DESC
LIMIT 20;

-- 4. Test Type Performance Metrics
-- Analyzes performance by test type
SELECT 
    tt.internal_description as test_type,
    COUNT(DISTINCT ltt.test_id) as tests_performed,
    COUNT(DISTINCT td.test_defect_id) as defects_found,
    ROUND(AVG(t.mileage), 0) as avg_mileage,
    ROUND(AVG(
        CASE 
            WHEN t.performed_date IS NOT NULL AND t.created_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (t.performed_date - t.created_date)) / 3600 
        END
    ), 1) as avg_completion_hours
FROM test_type tt
JOIN link_test_test_type ltt ON tt.test_type_id = ltt.test_type_id
JOIN test t ON ltt.test_id = t.test_id
LEFT JOIN test_defect td ON t.test_id = td.test_id
WHERE t.test_status_id = 4  -- Completed tests
GROUP BY tt.test_type_id, tt.internal_description
ORDER BY tests_performed DESC;

-- 5. Vehicle Age vs Defect Correlation
-- Analyzes how vehicle age correlates with defects
WITH vehicle_age_analysis AS (
    SELECT 
        CASE 
            WHEN EXTRACT(YEAR FROM AGE(t.performed_date, vs.registration_date)) < 2 THEN '0-2 years'
            WHEN EXTRACT(YEAR FROM AGE(t.performed_date, vs.registration_date)) < 4 THEN '2-4 years'
            WHEN EXTRACT(YEAR FROM AGE(t.performed_date, vs.registration_date)) < 6 THEN '4-6 years'
            WHEN EXTRACT(YEAR FROM AGE(t.performed_date, vs.registration_date)) < 8 THEN '6-8 years'
            ELSE '8+ years'
        END as age_group,
        t.test_id,
        vs.latest_mileage
    FROM test t
    JOIN vehicle_snapshot vs ON t.vehicle_snapshot_id = vs.vehicle_snapshot_id
    WHERE t.test_status_id = 4 AND t.performed_date IS NOT NULL
)
SELECT 
    vaa.age_group,
    COUNT(DISTINCT vaa.test_id) as total_tests,
    COUNT(DISTINCT td.test_defect_id) as total_defects,
    ROUND(COUNT(DISTINCT td.test_defect_id)::numeric / COUNT(DISTINCT vaa.test_id), 2) as defects_per_test,
    ROUND(AVG(vaa.latest_mileage), 0) as avg_mileage,
    ROUND(SUM(td.common_cost + td.work_cost + td.parts_cost), 2) as total_repair_cost
FROM vehicle_age_analysis vaa
LEFT JOIN test_defect td ON vaa.test_id = td.test_id
GROUP BY vaa.age_group
ORDER BY 
    CASE 
        WHEN vaa.age_group = '0-2 years' THEN 1
        WHEN vaa.age_group = '2-4 years' THEN 2
        WHEN vaa.age_group = '4-6 years' THEN 3
        WHEN vaa.age_group = '6-8 years' THEN 4
        ELSE 5
    END;

-- 6. Work Order Efficiency Analysis
-- Analyzes work order completion times
SELECT 
    wojt.internal_description as job_type,
    COUNT(woj.work_order_job_id) as total_jobs,
    COUNT(CASE WHEN woj.work_order_job_status_id = 3 THEN 1 END) as completed_jobs,
    ROUND(AVG(
        CASE 
            WHEN woj.completion_date IS NOT NULL AND woj.start_date IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (woj.completion_date - woj.start_date)) / 3600 
        END
    ), 1) as avg_completion_hours,
    ROUND(AVG(woj.repair_cost), 2) as avg_repair_cost
FROM work_order_job woj
JOIN work_order_job_type wojt ON woj.work_order_job_type_id = wojt.work_order_job_type_id
GROUP BY wojt.work_order_job_type_id, wojt.internal_description
ORDER BY total_jobs DESC;

-- 7. Fuel Type Analysis
-- Compares defect rates and costs across different fuel types
SELECT 
    vs.fuel,
    COUNT(DISTINCT t.test_id) as total_tests,
    COUNT(DISTINCT td.test_defect_id) as total_defects,
    ROUND(COUNT(DISTINCT td.test_defect_id)::numeric / COUNT(DISTINCT t.test_id), 2) as defects_per_test,
    ROUND(AVG(vs.co2_emissions), 1) as avg_co2_emissions,
    ROUND(AVG(vs.latest_mileage), 0) as avg_mileage,
    ROUND(SUM(td.common_cost + td.work_cost + td.parts_cost), 2) as total_repair_cost
FROM vehicle_snapshot vs
JOIN test t ON vs.vehicle_snapshot_id = t.vehicle_snapshot_id
LEFT JOIN test_defect td ON t.test_id = td.test_id
WHERE t.test_status_id = 4
GROUP BY vs.fuel
ORDER BY total_tests DESC;

-- 8. Seasonal Test Pattern Analysis
-- Identifies seasonal patterns in testing
SELECT 
    EXTRACT(QUARTER FROM t.created_date) as quarter,
    EXTRACT(MONTH FROM t.created_date) as month,
    TO_CHAR(t.created_date, 'Month') as month_name,
    COUNT(t.test_id) as test_count,
    COUNT(DISTINCT t.vehicle_snapshot_id) as unique_vehicles,
    ROUND(AVG(t.mileage), 0) as avg_mileage
FROM test t
GROUP BY 
    EXTRACT(QUARTER FROM t.created_date),
    EXTRACT(MONTH FROM t.created_date),
    TO_CHAR(t.created_date, 'Month')
ORDER BY month;

-- 9. Test Action Distribution
-- Shows what actions are most commonly recommended
SELECT 
    ta.internal_description as action_type,
    COUNT(ldta.test_defect_id) as usage_count,
    COUNT(DISTINCT ldta.test_defect_id) as unique_defects,
    ROUND(AVG(td.common_cost + td.work_cost + td.parts_cost), 2) as avg_associated_cost
FROM test_action ta
LEFT JOIN link_test_defect_action ldta ON ta.test_action_id = ldta.test_action_id
LEFT JOIN test_defect td ON ldta.test_defect_id = td.test_defect_id
GROUP BY ta.test_action_id, ta.internal_description
ORDER BY usage_count DESC;

-- 10. Market Performance Comparison
-- Compares test metrics across different markets
SELECT 
    m.name as market,
    m.currency_code,
    COUNT(DISTINCT tr.test_run_id) as test_runs,
    COUNT(DISTINCT t.test_id) as total_tests,
    COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) as completed_tests,
    ROUND(100.0 * COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) / COUNT(t.test_id), 2) as completion_rate,
    COUNT(DISTINCT td.test_defect_id) as total_defects
FROM market m
LEFT JOIN test_run tr ON m.market_id = tr.market_id
LEFT JOIN test t ON tr.test_run_id = t.test_run_id
LEFT JOIN test_defect td ON t.test_id = td.test_id
GROUP BY m.market_id, m.name, m.currency_code
ORDER BY total_tests DESC;

-- Create materialized views for faster analytical queries
CREATE MATERIALIZED VIEW mv_daily_test_summary AS
SELECT 
    DATE(t.created_date) as test_date,
    COUNT(t.test_id) as tests_created,
    COUNT(CASE WHEN t.test_status_id = 4 THEN 1 END) as tests_completed,
    COUNT(DISTINCT t.vehicle_snapshot_id) as unique_vehicles,
    COUNT(DISTINCT t.unit_id) as active_units,
    AVG(t.mileage) as avg_mileage,
    COUNT(DISTINCT td.test_defect_id) as defects_found,
    SUM(td.common_cost + td.work_cost + td.parts_cost) as total_repair_costs
FROM test t
LEFT JOIN test_defect td ON t.test_id = td.test_id
GROUP BY DATE(t.created_date);

CREATE INDEX idx_mv_daily_test_summary_date ON mv_daily_test_summary(test_date);

-- Create a function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytical_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_daily_test_summary;
END;
$$ LANGUAGE plpgsql;

-- Example of calling the refresh function (can be scheduled)
-- SELECT refresh_analytical_views();
