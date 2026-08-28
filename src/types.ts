/**
 * AquaWatch: Urban Water Leakage & Loss Detection System
 * Core Data Models and Protocol Types
 */

export type UserRole = 'admin' | 'utility_staff' | 'viewer';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  zone_access: string[]; // e.g. ['ALL'] or ['zone_central', 'zone_north']
  department?: string;
  avatar?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Zone {
  zone_id: string;
  name: string;
  description: string;
  population: number;
  target_pressure_bar: number; // e.g. 3.5 bar
  base_demand_m3_h: number;   // nominal baseline flow in m3/hr
  boundary_coordinates: LatLng[];
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  current_flow_m3_h?: number;
  current_pressure_bar?: number;
  nrw_rate_pct?: number;      // Non-Revenue Water percentage
  active_anomalies_count?: number;
  water_loss_last_24h_m3?: number;
}

export type PipeMaterial = 'Ductile Iron' | 'Cast Iron' | 'PVC' | 'HDPE' | 'Asbestos Cement';

export interface PipeSegment {
  pipe_id: string;
  zone_id: string;
  material: PipeMaterial;
  install_year: number;
  diameter_mm: number;
  nominal_pressure_bar: number;
  condition_score: number; // 1.0 (critical) - 10.0 (pristine)
  path_coordinates: LatLng[];
  leak_count_historical: number;
  has_active_leak?: boolean;
}

export type SensorType = 'flow' | 'pressure' | 'acoustic';
export type SensorStatus = 'active' | 'warning' | 'offline' | 'calibrating';

export interface Sensor {
  sensor_id: string;
  pipe_id?: string;
  zone_id: string;
  type: SensorType;
  location: LatLng;
  status: SensorStatus;
  battery_pct: number;
  sampling_rate_sec: number;
  last_ping: string;
  current_reading: number; // m3/h for flow, bar for pressure
  unit: string;
}

export interface ConsumptionRecord {
  record_id: string | number;
  sensor_id: string;
  zone_id: string;
  timestamp: string; // ISO string
  flow_value: number; // m3/h
  pressure_value: number; // bar
  raw_status?: 'normal' | 'anomalous';
}

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType = 
  | 'Sudden Pipe Burst'
  | 'Slow Creep Leak'
  | 'Night Minimum Flow Surge'
  | 'Pressure Drop Anomaly'
  | 'Unauthorized Draw / Meter Bypass';

export type AnomalyStatus = 'open' | 'investigating' | 'ticket_created' | 'resolved' | 'false_positive';

export interface AnomalyEvent {
  event_id: string;
  zone_id: string;
  zone_name?: string;
  sensor_id?: string;
  pipe_id?: string;
  detected_at: string;
  severity: AnomalySeverity;
  type: AnomalyType;
  z_score: number;
  deviation_pct: number;
  observed_flow: number;
  expected_flow: number;
  observed_pressure: number;
  expected_pressure: number;
  estimated_loss_rate_m3_h: number;
  status: AnomalyStatus;
  resolved_at?: string;
  description?: string;
  has_cross_referenced_citizen_report?: boolean;
  linked_report_ids?: string[];
  linked_ticket_id?: string;
}

export type CitizenReportStatus = 'pending' | 'verified' | 'linked_to_ticket' | 'dismissed';

export type SurfaceFlowSeverity = 
  | 'Active Geyser/Rupture'
  | 'Street Flooding / River'
  | 'Trickle/Slow Stream'
  | 'Puddle/Damp Ground';

export interface LeakReport {
  report_id: string;
  citizen_id?: string | null;
  citizen_name?: string;
  citizen_phone?: string;
  zone_id: string;
  location: LatLng;
  address: string;
  description: string;
  estimated_surface_flow: SurfaceFlowSeverity;
  photo_url?: string;
  status: CitizenReportStatus;
  linked_anomaly_id?: string | null;
  linked_ticket_id?: string | null;
  reported_at: string;
  cross_referenced_with_sensor?: boolean;
}

export type MaintenanceTicketStatus = 'reported' | 'assigned' | 'in_progress' | 'verified_fixed';
export type MaintenanceSource = 'sensor' | 'citizen' | 'hybrid_cross_verified';

export interface MaintenanceTicket {
  ticket_id: string;
  source: MaintenanceSource;
  linked_anomaly_id?: string | null;
  linked_report_id?: string | null;
  zone_id: string;
  zone_name?: string;
  pipe_id?: string | null;
  location?: LatLng;
  priority_score: number; // 0 - 100
  priority_breakdown?: {
    severity_weight: number;
    population_weight: number;
    loss_rate_weight: number;
    citizen_bonus: number;
  };
  severity: AnomalySeverity;
  estimated_loss_m3: number;
  status: MaintenanceTicketStatus;
  assigned_to?: string | null;
  notes?: string;
  created_at: string;
  assigned_at?: string | null;
  in_progress_at?: string | null;
  resolved_at?: string | null;
  resolution_summary?: string;
}

export interface ZoneSensitivityConfig {
  zone_id: string;
  z_score_threshold: number; // e.g. 2.5 standard deviations
  rolling_window_minutes: number; // e.g. 30 min
  min_flow_deviation_pct: number; // e.g. 15%
  night_flow_multiplier: number; // e.g. 1.25
  auto_ticket_threshold: number; // e.g. 75 priority score
}

export interface CitySummaryStats {
  total_zones: number;
  total_sensors: number;
  total_pipe_km: number;
  active_anomalies: number;
  open_tickets: number;
  nrw_percentage: number; // e.g. 21.8%
  nrw_previous_month: number;
  water_saved_to_date_m3: number;
  financial_savings_usd: number;
  total_daily_loss_rate_m3_h: number;
  system_health_index: number; // 0 - 100
}

export interface WebSocketMessage {
  type: 'TELEMETRY_UPDATE' | 'ANOMALY_DETECTED' | 'TICKET_UPDATED' | 'CITIZEN_REPORT_ADDED' | 'SYSTEM_STATS' | 'SIMULATOR_STATE';
  timestamp: string;
  data: any;
}
