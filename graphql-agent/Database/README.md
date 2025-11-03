# BUS Platform Analytical Data Warehouse

This directory contains all the necessary scripts and configuration to set up a PostgreSQL-based analytical data warehouse for the BUS Platform, with Hasura GraphQL API on top.

## Overview

The BUS Platform Data Warehouse is designed to store and analyze vehicle testing and inspection data. It includes:

- **Core Tables**: Vehicle information, test results, defects, work orders, and more
- **Reference Data**: Localizations, markets, vehicle makes, test types, etc.
- **Analytical Views**: Pre-built queries and materialized views for common analytics
- **Sample Data**: Representative test data for development and testing

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Hasura GUI    │────▶│  Hasura Engine  │
│  (Port: 8082)   │     │   (GraphQL)     │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │  (Port: 5433)   │
                        │                 │
                        │  bus_analytics  │
                        │    database     │
                        └─────────────────┘
```

## Prerequisites

- Docker and Docker Compose
- PostgreSQL client (optional, for direct database access)
- At least 2GB of free disk space

## Quick Start

1. Navigate to the Database directory:
   ```bash
   cd Database
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Wait for the database to initialize (first run only):
   ```bash
   # Check logs to see when initialization is complete
   docker-compose logs -f postgres
   ```

4. Access Hasura Console:
   - Open http://localhost:8082 in your browser
   - The console should open automatically

5. Add the BUS Analytics database to Hasura:
   - In Hasura Console, go to "Data" → "Manage" → "Connect Database"
   - Database Display Name: `BUS Analytics`
   - Database URL: `postgres://postgres:postgrespassword@postgres:5432/bus_analytics`
   - Click "Connect Database"

## Database Structure

### Main Schema: `bus_platform`

The database is organized into several logical groups:

#### 1. Vehicle Management
- `vehicle_snapshot` - Point-in-time vehicle data
- `vehicle_make`, `vehicle_make_group` - Vehicle manufacturer hierarchy
- `vehicle_color` - Vehicle color reference

#### 2. Test Management
- `test` - Main test records
- `test_type` - Different types of tests available
- `test_status` - Test workflow statuses
- `test_defect` - Defects found during testing

#### 3. Checkpoint System
- `checkpoint_group` - Groups of related checkpoints
- `checkpoint` - Individual inspection points
- `checkpoint_comment` - Predefined comments for checkpoints

#### 4. Work Orders
- `work_order` - Work orders created from tests
- `work_order_job` - Individual jobs within work orders

#### 5. Sales Reports
- `sales_report` - Reports generated from tests
- `sales_report_type` - Types of reports available

#### 6. Reference Data
- `localization` - Multi-language support
- `market` - Market/region definitions
- `object_type` - Vehicle type classifications

## Sample Queries

### 1. Get Test Summary
```sql
SELECT * FROM bus_platform.get_test_summary(1);
```

### 2. Vehicle Defect Analysis
```sql
SELECT * FROM bus_platform.defect_analysis
ORDER BY defect_count DESC
LIMIT 10;
```

### 3. Monthly Test Statistics
```sql
SELECT * FROM bus_platform.test_statistics
ORDER BY month DESC;
```

## GraphQL Examples

Once connected to Hasura, you can run GraphQL queries like:

### Get Recent Tests
```graphql
query GetRecentTests {
  bus_platform_test(
    order_by: {created_date: desc}
    limit: 10
  ) {
    test_id
    mileage
    test_status {
      internal_description
    }
    vehicle_snapshot {
      reg_no
      vehicle_make
      model
    }
  }
}
```

### Get Defect Statistics
```graphql
query GetDefectStats {
  bus_platform_test_defect_aggregate {
    aggregate {
      count
      sum {
        common_cost
        work_cost
        parts_cost
      }
    }
  }
}
```

## Maintenance

### Refresh Materialized Views
```sql
SELECT bus_platform.refresh_analytical_views();
```

### Check Database Health
```sql
SELECT * FROM bus_platform.health_check();
```

### Backup Database
```bash
docker exec -t database-postgres-1 pg_dump -U postgres bus_analytics > backup.sql
```

### Restore Database
```bash
docker exec -i database-postgres-1 psql -U postgres bus_analytics < backup.sql
```

### Connect with psql (external)
```bash
# PostgreSQL is exposed on port 5433 (not 5432) to avoid conflicts
psql -h localhost -p 5433 -U postgres -d bus_analytics
```

## Troubleshooting

### Cannot connect to database
- Ensure Docker containers are running: `docker-compose ps`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Verify network connectivity between containers

### Hasura cannot see tables
- Ensure you've connected the correct database
- Check that the schema is set to `bus_platform`
- Try tracking all tables: Data → bus_platform → Track All

### Performance issues
- Run `ANALYZE` on the database
- Check if materialized views need refreshing
- Consider adding additional indexes

## Development

### Adding New Tables
1. Add DDL to `sql/01_create_schema.sql`
2. Add sample data to `sql/02_insert_sample_data.sql`
3. Rebuild the database or run migrations

### Creating New Analytical Queries
1. Add queries to `sql/03_analytical_queries.sql`
2. Consider creating materialized views for complex queries
3. Document the query purpose and expected results

## Security Notes

**⚠️ WARNING**: The current setup uses default passwords and is intended for development only.

For production use:
1. Change all default passwords
2. Use environment variables for credentials
3. Enable Hasura admin secret
4. Implement proper access control
5. Use SSL/TLS for connections
6. Regular security updates

## License

This is part of the BUS Platform system. Refer to the main project license.
