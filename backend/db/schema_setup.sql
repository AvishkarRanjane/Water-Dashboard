-- ==============================================================================
-- AquaWatch: Urban Water Leakage & Loss Detection System
-- Database Schema (PostgreSQL + PostGIS Extension)
-- ==============================================================================

-- 1. Enable PostGIS Extension for geospatial indexing and spatial joins
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean teardown for migrations / seeding
DROP TABLE IF EXISTS maintenance_tickets CASCADE;
DROP TABLE IF EXISTS leak_reports CASCADE;
DROP TABLE IF EXISTS anomaly_events CASCADE;
DROP TABLE IF EXISTS consumption_records CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS pipe_segments CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS zone_sensitivity_configs CASCADE;

-- 3. Users and Role-Based Access Control
CREATE TABLE users (
    user_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'viewer', -- 'admin', 'utility_staff', 'viewer'
    zone_access TEXT[] DEFAULT ARRAY['ALL'],     -- Specific zone_ids or ['ALL']
    department VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. District Metered Areas (DMA) / Zones
CREATE TABLE zones (
    zone_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    population INTEGER NOT NULL DEFAULT 10000,
    target_pressure_bar NUMERIC(4, 2) NOT NULL DEFAULT 3.5, -- Standard operational pressure (bar)
    base_demand_m3_h NUMERIC(6, 2) NOT NULL DEFAULT 120.0, -- Baseline nominal flow (m3/hr)
    geometry GEOMETRY(Polygon, 4326),                     -- GeoJSON polygon boundaries (WGS84)
    boundary_coordinates JSONB NOT NULL,                   -- GeoJSON representation for web apps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Water Pipeline Network Segments
CREATE TABLE pipe_segments (
    pipe_id VARCHAR(64) PRIMARY KEY,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    material VARCHAR(64) NOT NULL,                        -- 'Ductile Iron', 'Cast Iron', 'PVC', 'HDPE', 'Asbestos Cement'
    install_year INTEGER NOT NULL,
    diameter_mm INTEGER NOT NULL,                         -- Nominal diameter in mm (e.g. 150, 250, 400)
    nominal_pressure_bar NUMERIC(4, 2) DEFAULT 4.0,
    condition_score NUMERIC(3, 1) DEFAULT 8.5,            -- Structural rating 1.0 (critical) - 10.0 (pristine)
    geometry GEOMETRY(LineString, 4326),                  -- PostGIS LineString geometry
    path_coordinates JSONB NOT NULL,                      -- Lat/Lng pairs for Leaflet map rendering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. IoT Telemetry Sensors (Flow meters & Pressure transducers)
CREATE TABLE sensors (
    sensor_id VARCHAR(64) PRIMARY KEY,
    pipe_id VARCHAR(64) REFERENCES pipe_segments(pipe_id) ON DELETE SET NULL,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,                            -- 'flow' (m3/h) or 'pressure' (bar) or 'acoustic'
    location_lat NUMERIC(9, 6) NOT NULL,
    location_lng NUMERIC(9, 6) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',         -- 'active', 'warning', 'offline', 'calibrating'
    battery_pct INTEGER DEFAULT 98,
    sampling_rate_sec INTEGER DEFAULT 5,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. High-frequency IoT Telemetry Records
CREATE TABLE consumption_records (
    record_id BIGSERIAL PRIMARY KEY,
    sensor_id VARCHAR(64) NOT NULL REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    flow_value NUMERIC(7, 2),                              -- Real-time measured flow (m3/h)
    pressure_value NUMERIC(5, 2),                          -- Real-time measured pressure (bar)
    raw_status VARCHAR(32) DEFAULT 'normal'
);

-- Index for rapid rolling-window queries
CREATE INDEX idx_consumption_time ON consumption_records(sensor_id, timestamp DESC);
CREATE INDEX idx_consumption_zone ON consumption_records(zone_id, timestamp DESC);

-- 8. Anomaly Events flagged by Z-Score & Statistical Models
CREATE TABLE anomaly_events (
    event_id VARCHAR(64) PRIMARY KEY,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    sensor_id VARCHAR(64) REFERENCES sensors(sensor_id) ON DELETE SET NULL,
    pipe_id VARCHAR(64) REFERENCES pipe_segments(pipe_id) ON DELETE SET NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(32) NOT NULL,                         -- 'critical', 'high', 'medium', 'low'
    type VARCHAR(64) NOT NULL,                             -- 'Sudden Pipe Burst', 'Slow Creep Leak', 'Night Flow Anomaly', 'Pressure Drop', 'Unauthorized Draw'
    z_score NUMERIC(5, 2) NOT NULL,
    deviation_pct NUMERIC(6, 2) NOT NULL,                  -- % deviation from baseline
    observed_flow NUMERIC(7, 2),
    expected_flow NUMERIC(7, 2),
    observed_pressure NUMERIC(5, 2),
    expected_pressure NUMERIC(5, 2),
    estimated_loss_rate_m3_h NUMERIC(6, 2) NOT NULL,       -- Water loss rate in m3/hour
    status VARCHAR(32) NOT NULL DEFAULT 'open',            -- 'open', 'investigating', 'ticket_created', 'resolved', 'false_positive'
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 9. Citizen Public Leak Reports
CREATE TABLE leak_reports (
    report_id VARCHAR(64) PRIMARY KEY,
    citizen_id VARCHAR(64),                                -- Nullable for anonymous citizen submissions
    citizen_name VARCHAR(128),
    citizen_phone VARCHAR(32),
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    location_lat NUMERIC(9, 6) NOT NULL,
    location_lng NUMERIC(9, 6) NOT NULL,
    address TEXT,
    description TEXT NOT NULL,
    estimated_surface_flow VARCHAR(32),                    -- 'Trickle', 'Moderate Pooling', 'Gushing/Geyser', 'Pavement Collapse'
    photo_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',         -- 'pending', 'verified', 'linked_to_ticket', 'dismissed'
    linked_anomaly_id VARCHAR(64) REFERENCES anomaly_events(event_id) ON DELETE SET NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Maintenance & Dispatch Tickets
CREATE TABLE maintenance_tickets (
    ticket_id VARCHAR(64) PRIMARY KEY,
    source VARCHAR(32) NOT NULL,                           -- 'sensor', 'citizen', 'hybrid_cross_verified'
    linked_anomaly_id VARCHAR(64) REFERENCES anomaly_events(event_id) ON DELETE SET NULL,
    linked_report_id VARCHAR(64) REFERENCES leak_reports(report_id) ON DELETE SET NULL,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    pipe_id VARCHAR(64) REFERENCES pipe_segments(pipe_id) ON DELETE SET NULL,
    priority_score NUMERIC(5, 2) NOT NULL,                 -- Computed multi-factor score (0-100)
    severity VARCHAR(32) NOT NULL,
    estimated_loss_m3 NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'reported',        -- 'reported' -> 'assigned' -> 'in_progress' -> 'verified_fixed'
    assigned_to VARCHAR(128),                              -- Field Crew / Lead Technician
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP WITH TIME ZONE,
    in_progress_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 11. Zone Anomaly Sensitivity Configuration
CREATE TABLE zone_sensitivity_configs (
    zone_id VARCHAR(64) PRIMARY KEY REFERENCES zones(zone_id) ON DELETE CASCADE,
    z_score_threshold NUMERIC(3, 2) NOT NULL DEFAULT 2.5,  -- Trigger threshold (std deviations)
    rolling_window_minutes INTEGER NOT NULL DEFAULT 30,
    min_flow_deviation_pct NUMERIC(4, 1) NOT NULL DEFAULT 15.0,
    night_flow_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.25,
    auto_ticket_threshold NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PostGIS Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_pipes_geom ON pipe_segments USING GIST (geometry);
