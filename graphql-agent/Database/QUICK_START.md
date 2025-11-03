# BUS Platform Data Warehouse - Quick Start Guide

## 🚀 Setup in 5 Minutes

### 1. Start the Database
```bash
cd Database
docker-compose up -d
```

### 2. Wait for Initialization
First time setup takes about 2-3 minutes. Check status:
```bash
docker-compose logs -f postgres | grep "Database setup completed"
```

### 3. Access Hasura Console
Open http://localhost:8082 in your browser

### 4. Connect the Database in Hasura
1. Click "Data" → "Manage" → "Connect Database"
2. Enter:
   - Database Display Name: `BUS Analytics`
   - Database URL: `postgres://postgres:postgrespassword@postgres:5432/bus_analytics`
3. Click "Connect Database"

### 5. Track All Tables
1. Go to "Data" → "bus_analytics" → "bus_platform" schema
2. Click "Track All" for tables
3. Click "Track All" for relationships

## 🎯 Test Your Setup

### In Hasura GraphiQL:
```graphql
query TestQuery {
  bus_platform_test(limit: 5) {
    test_id
    mileage
    vehicle_snapshot {
      vehicle_make
      model
      reg_no
    }
  }
}
```

### Direct Database Access:
```bash
# Connect to PostgreSQL
docker exec -it database-postgres-1 psql -U postgres -d bus_analytics

# Run a test query
SELECT COUNT(*) FROM bus_platform.test;
```

## 📊 Sample Analytical Queries

### Vehicle Statistics
```graphql
query VehicleStats {
  bus_platform_vehicle_make_performance {
    make
    total_tests
    total_defects
    avg_mileage
  }
}
```

### Defect Analysis
```graphql
query DefectAnalysis {
  bus_platform_defect_analysis(limit: 10) {
    checkpoint_group
    checkpoint
    defect_count
    avg_total_cost
  }
}
```

## 🛑 Stop Services
```bash
docker-compose down
# To also remove data:
# docker-compose down -v
```

## 📚 Next Steps
- Read the full [README.md](README.md) for detailed documentation
- Explore the [analytical queries](sql/03_analytical_queries.sql)
- Check out the [GraphQL examples](README.md#graphql-examples)

## ⚡ Troubleshooting

**Container won't start?**
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Start fresh
```

**Can't see tables in Hasura?**
- Make sure database is connected
- Check schema is set to `bus_platform`
- Click "Track All" for tables and relationships

**Need help?**
Check the logs:
```bash
docker-compose logs postgres
docker-compose logs graphql-engine
```
