/**
 * AquaWatch Frontend API Client Service & Resilient Client-State Engine
 * 
 * Provides unified HTTP client functions that gracefully fallback to an
 * in-memory client-side simulation store when deployed as a static Single Page Application
 * (e.g. on Vercel) or when the backend server is unreachable.
 */

import {
  AnomalyEvent,
  CitySummaryStats,
  LeakReport,
  MaintenanceTicket,
  PipeSegment,
  Sensor,
  User,
  Zone,
  ZoneSensitivityConfig
} from '../types';

// ==========================================
// In-Memory Fallback Seed Data & State Store
// ==========================================

const INITIAL_USERS: User[] = [
  {
    user_id: 'usr-admin-01',
    name: 'Sarah Chen (Chief Hydrologist)',
    email: 's.chen@metrowater.gov',
    role: 'admin',
    zone_access: ['ALL'],
    department: 'Operations & Hydraulic Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    user_id: 'usr-staff-02',
    name: 'Marcus Ramirez (Field Dispatch Lead)',
    email: 'm.ramirez@metrowater.gov',
    role: 'utility_staff',
    zone_access: ['zone-central', 'zone-north', 'zone-industrial'],
    department: 'Rapid Response Maintenance',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    user_id: 'usr-viewer-03',
    name: 'Elena Rostova (City Auditor)',
    email: 'e.rostova@citygov.org',
    role: 'viewer',
    zone_access: ['ALL'],
    department: 'Municipal Sustainability Oversight',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  }
];

const INITIAL_ZONES: Zone[] = [
  {
    zone_id: 'zone-central',
    name: 'Central Commercial & Downtown (DMA-1)',
    description: 'High-density commercial core, high-rise buildings and transit hubs. Demanding pressure stability.',
    population: 48500,
    target_pressure_bar: 3.8,
    base_demand_m3_h: 185.0,
    risk_level: 'critical',
    current_flow_m3_h: 242.4,
    current_pressure_bar: 2.75,
    nrw_rate_pct: 26.4,
    active_anomalies_count: 2,
    water_loss_last_24h_m3: 1378.0,
    boundary_coordinates: [
      { lat: 37.7785, lng: -122.4215 },
      { lat: 37.7895, lng: -122.4180 },
      { lat: 37.7940, lng: -122.3995 },
      { lat: 37.7820, lng: -122.3920 },
      { lat: 37.7730, lng: -122.4080 }
    ]
  },
  {
    zone_id: 'zone-north',
    name: 'North Hills Residential (DMA-2)',
    description: 'Elevated topography residential community requiring booster pumping stations.',
    population: 32000,
    target_pressure_bar: 4.2,
    base_demand_m3_h: 110.0,
    risk_level: 'medium',
    current_flow_m3_h: 122.8,
    current_pressure_bar: 4.05,
    nrw_rate_pct: 15.2,
    active_anomalies_count: 1,
    water_loss_last_24h_m3: 310.0,
    boundary_coordinates: [
      { lat: 37.7950, lng: -122.4250 },
      { lat: 37.8080, lng: -122.4200 },
      { lat: 37.8060, lng: -122.4050 },
      { lat: 37.7940, lng: -122.4000 }
    ]
  },
  {
    zone_id: 'zone-east',
    name: 'East Riverside Historic Quarter (DMA-3)',
    description: 'Historic district with aging unlined cast iron pipes installed circa 1968.',
    population: 26500,
    target_pressure_bar: 3.2,
    base_demand_m3_h: 95.0,
    risk_level: 'high',
    current_flow_m3_h: 128.5,
    current_pressure_bar: 2.85,
    nrw_rate_pct: 28.5,
    active_anomalies_count: 1,
    water_loss_last_24h_m3: 804.0,
    boundary_coordinates: [
      { lat: 37.7680, lng: -122.3950 },
      { lat: 37.7780, lng: -122.3900 },
      { lat: 37.7760, lng: -122.3810 },
      { lat: 37.7590, lng: -122.3850 }
    ]
  },
  {
    zone_id: 'zone-industrial',
    name: 'South Bay Industrial Corridor (DMA-4)',
    description: 'Manufacturing, logistics facilities and high-volume industrial wash plants.',
    population: 14000,
    target_pressure_bar: 4.5,
    base_demand_m3_h: 210.0,
    risk_level: 'low',
    current_flow_m3_h: 204.0,
    current_pressure_bar: 4.48,
    nrw_rate_pct: 11.4,
    active_anomalies_count: 0,
    water_loss_last_24h_m3: 160.0,
    boundary_coordinates: [
      { lat: 37.7550, lng: -122.4150 },
      { lat: 37.7650, lng: -122.4050 },
      { lat: 37.7560, lng: -122.3880 },
      { lat: 37.7420, lng: -122.4020 }
    ]
  },
  {
    zone_id: 'zone-west',
    name: 'Westside Suburbs & Campus (DMA-5)',
    description: 'Modern suburban expansion with recently replaced ductile iron and smart PRV valves.',
    population: 41000,
    target_pressure_bar: 3.4,
    base_demand_m3_h: 135.0,
    risk_level: 'low',
    current_flow_m3_h: 134.2,
    current_pressure_bar: 3.42,
    nrw_rate_pct: 9.8,
    active_anomalies_count: 0,
    water_loss_last_24h_m3: 125.0,
    boundary_coordinates: [
      { lat: 37.7650, lng: -122.4450 },
      { lat: 37.7850, lng: -122.4400 },
      { lat: 37.7800, lng: -122.4220 },
      { lat: 37.7600, lng: -122.4270 }
    ]
  }
];

const INITIAL_PIPES: PipeSegment[] = [
  {
    pipe_id: 'pipe-c-01',
    zone_id: 'zone-central',
    material: 'Cast Iron',
    install_year: 1968,
    diameter_mm: 400,
    nominal_pressure_bar: 4.0,
    condition_score: 3.8,
    leak_count_historical: 7,
    has_active_leak: true,
    path_coordinates: [
      { lat: 37.7830, lng: -122.4160 },
      { lat: 37.7860, lng: -122.4110 },
      { lat: 37.7890, lng: -122.4050 }
    ]
  },
  {
    pipe_id: 'pipe-c-02',
    zone_id: 'zone-central',
    material: 'Ductile Iron',
    install_year: 1998,
    diameter_mm: 300,
    nominal_pressure_bar: 4.0,
    condition_score: 7.2,
    leak_count_historical: 2,
    has_active_leak: false,
    path_coordinates: [
      { lat: 37.7890, lng: -122.4050 },
      { lat: 37.7920, lng: -122.4000 },
      { lat: 37.7840, lng: -122.3950 }
    ]
  },
  {
    pipe_id: 'pipe-e-01',
    zone_id: 'zone-east',
    material: 'Cast Iron',
    install_year: 1964,
    diameter_mm: 250,
    nominal_pressure_bar: 3.5,
    condition_score: 3.2,
    leak_count_historical: 9,
    has_active_leak: true,
    path_coordinates: [
      { lat: 37.7690, lng: -122.3930 },
      { lat: 37.7730, lng: -122.3880 },
      { lat: 37.7750, lng: -122.3830 }
    ]
  },
  {
    pipe_id: 'pipe-n-01',
    zone_id: 'zone-north',
    material: 'Ductile Iron',
    install_year: 2004,
    diameter_mm: 350,
    nominal_pressure_bar: 5.0,
    condition_score: 8.1,
    leak_count_historical: 1,
    has_active_leak: false,
    path_coordinates: [
      { lat: 37.7970, lng: -122.4220 },
      { lat: 37.8030, lng: -122.4180 },
      { lat: 37.8050, lng: -122.4100 }
    ]
  },
  {
    pipe_id: 'pipe-w-01',
    zone_id: 'zone-west',
    material: 'HDPE',
    install_year: 2018,
    diameter_mm: 300,
    nominal_pressure_bar: 4.0,
    condition_score: 9.5,
    leak_count_historical: 0,
    has_active_leak: false,
    path_coordinates: [
      { lat: 37.7680, lng: -122.4410 },
      { lat: 37.7750, lng: -122.4350 },
      { lat: 37.7790, lng: -122.4280 }
    ]
  },
  {
    pipe_id: 'pipe-ind-01',
    zone_id: 'zone-industrial',
    material: 'Ductile Iron',
    install_year: 2012,
    diameter_mm: 450,
    nominal_pressure_bar: 5.5,
    condition_score: 8.8,
    leak_count_historical: 1,
    has_active_leak: false,
    path_coordinates: [
      { lat: 37.7520, lng: -122.4110 },
      { lat: 37.7580, lng: -122.4010 },
      { lat: 37.7530, lng: -122.3920 }
    ]
  }
];

const INITIAL_SENSORS: Sensor[] = [
  {
    sensor_id: 'FL-CENTRAL-01',
    pipe_id: 'pipe-c-01',
    zone_id: 'zone-central',
    type: 'flow',
    location: { lat: 37.7855, lng: -122.4135 },
    status: 'warning',
    battery_pct: 94,
    sampling_rate_sec: 10,
    last_ping: new Date().toISOString(),
    current_reading: 242.4,
    unit: 'm³/h'
  },
  {
    sensor_id: 'PR-CENTRAL-01',
    pipe_id: 'pipe-c-01',
    zone_id: 'zone-central',
    type: 'pressure',
    location: { lat: 37.7870, lng: -122.4080 },
    status: 'warning',
    battery_pct: 92,
    sampling_rate_sec: 10,
    last_ping: new Date().toISOString(),
    current_reading: 2.75,
    unit: 'bar'
  },
  {
    sensor_id: 'FL-NORTH-01',
    pipe_id: 'pipe-n-01',
    zone_id: 'zone-north',
    type: 'flow',
    location: { lat: 37.8010, lng: -122.4160 },
    status: 'active',
    battery_pct: 88,
    sampling_rate_sec: 15,
    last_ping: new Date().toISOString(),
    current_reading: 122.8,
    unit: 'm³/h'
  },
  {
    sensor_id: 'PR-NORTH-01',
    pipe_id: 'pipe-n-01',
    zone_id: 'zone-north',
    type: 'pressure',
    location: { lat: 37.8040, lng: -122.4120 },
    status: 'active',
    battery_pct: 96,
    sampling_rate_sec: 15,
    last_ping: new Date().toISOString(),
    current_reading: 4.05,
    unit: 'bar'
  },
  {
    sensor_id: 'FL-EAST-01',
    pipe_id: 'pipe-e-01',
    zone_id: 'zone-east',
    type: 'flow',
    location: { lat: 37.7710, lng: -122.3900 },
    status: 'warning',
    battery_pct: 79,
    sampling_rate_sec: 10,
    last_ping: new Date().toISOString(),
    current_reading: 128.5,
    unit: 'm³/h'
  },
  {
    sensor_id: 'PR-EAST-01',
    pipe_id: 'pipe-e-01',
    zone_id: 'zone-east',
    type: 'pressure',
    location: { lat: 37.7740, lng: -122.3850 },
    status: 'warning',
    battery_pct: 85,
    sampling_rate_sec: 10,
    last_ping: new Date().toISOString(),
    current_reading: 2.85,
    unit: 'bar'
  },
  {
    sensor_id: 'FL-WEST-01',
    pipe_id: 'pipe-w-01',
    zone_id: 'zone-west',
    type: 'flow',
    location: { lat: 37.7720, lng: -122.4380 },
    status: 'active',
    battery_pct: 98,
    sampling_rate_sec: 30,
    last_ping: new Date().toISOString(),
    current_reading: 134.2,
    unit: 'm³/h'
  },
  {
    sensor_id: 'PR-WEST-01',
    pipe_id: 'pipe-w-01',
    zone_id: 'zone-west',
    type: 'pressure',
    location: { lat: 37.7770, lng: -122.4310 },
    status: 'active',
    battery_pct: 95,
    sampling_rate_sec: 30,
    last_ping: new Date().toISOString(),
    current_reading: 3.42,
    unit: 'bar'
  },
  {
    sensor_id: 'FL-IND-01',
    pipe_id: 'pipe-ind-01',
    zone_id: 'zone-industrial',
    type: 'flow',
    location: { lat: 37.7550, lng: -122.4060 },
    status: 'active',
    battery_pct: 91,
    sampling_rate_sec: 15,
    last_ping: new Date().toISOString(),
    current_reading: 204.0,
    unit: 'm³/h'
  },
  {
    sensor_id: 'PR-IND-01',
    pipe_id: 'pipe-ind-01',
    zone_id: 'zone-industrial',
    type: 'pressure',
    location: { lat: 37.7540, lng: -122.3960 },
    status: 'active',
    battery_pct: 87,
    sampling_rate_sec: 15,
    last_ping: new Date().toISOString(),
    current_reading: 4.48,
    unit: 'bar'
  }
];

const INITIAL_ANOMALIES: AnomalyEvent[] = [
  {
    event_id: 'anom-2026-001',
    zone_id: 'zone-central',
    zone_name: 'Central Commercial & Downtown (DMA-1)',
    sensor_id: 'FL-CENTRAL-01',
    pipe_id: 'pipe-c-01',
    detected_at: new Date(Date.now() - 35 * 60000).toISOString(),
    severity: 'critical',
    type: 'Sudden Pipe Burst',
    z_score: 3.84,
    deviation_pct: 31.0,
    observed_flow: 242.4,
    expected_flow: 185.0,
    observed_pressure: 2.75,
    expected_pressure: 3.8,
    estimated_loss_rate_m3_h: 57.4,
    status: 'investigating',
    description: 'Acute hydraulic surge detected on 400mm cast iron main. Pressure collapsed -1.05 bar below baseline target with severe night-flow exceedance.',
    has_cross_referenced_citizen_report: true,
    linked_report_ids: ['REP-8492'],
    linked_ticket_id: 'TCK-2026-081'
  },
  {
    event_id: 'anom-2026-002',
    zone_id: 'zone-east',
    zone_name: 'East Riverside Historic Quarter (DMA-3)',
    sensor_id: 'FL-EAST-01',
    pipe_id: 'pipe-e-01',
    detected_at: new Date(Date.now() - 110 * 60000).toISOString(),
    severity: 'high',
    type: 'Slow Creep Leak',
    z_score: 2.65,
    deviation_pct: 35.3,
    observed_flow: 128.5,
    expected_flow: 95.0,
    observed_pressure: 2.85,
    expected_pressure: 3.2,
    estimated_loss_rate_m3_h: 33.5,
    status: 'ticket_created',
    description: 'Continuous joint failure on 250mm unlined cast iron segment. Elevated minimum night flow during low-demand period.',
    has_cross_referenced_citizen_report: true,
    linked_report_ids: ['REP-5102'],
    linked_ticket_id: 'TCK-2026-082'
  }
];

const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    ticket_id: 'TCK-2026-081',
    source: 'hybrid_cross_verified',
    linked_anomaly_id: 'anom-2026-001',
    linked_report_id: 'REP-8492',
    zone_id: 'zone-central',
    zone_name: 'Central Commercial & Downtown (DMA-1)',
    pipe_id: 'pipe-c-01',
    location: { lat: 37.7860, lng: -122.4110 },
    priority_score: 96,
    priority_breakdown: {
      severity_weight: 40,
      population_weight: 24,
      loss_rate_weight: 22,
      citizen_bonus: 10
    },
    severity: 'critical',
    estimated_loss_m3: 1378.0,
    status: 'in_progress',
    assigned_to: 'Crew Delta-4 (Lead: Tech R. Vance)',
    notes: 'Acoustic correlating equipment confirmed rupture on 400mm main near crosswalk. Hydro-excavation team on-site. Gate valves 4B and 4C isolated.',
    created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    assigned_at: new Date(Date.now() - 25 * 60000).toISOString(),
    in_progress_at: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    ticket_id: 'TCK-2026-082',
    source: 'hybrid_cross_verified',
    linked_anomaly_id: 'anom-2026-002',
    linked_report_id: 'REP-5102',
    zone_id: 'zone-east',
    zone_name: 'East Riverside Historic Quarter (DMA-3)',
    pipe_id: 'pipe-e-01',
    location: { lat: 37.7710, lng: -122.3900 },
    priority_score: 84,
    priority_breakdown: {
      severity_weight: 30,
      population_weight: 18,
      loss_rate_weight: 26,
      citizen_bonus: 10
    },
    severity: 'high',
    estimated_loss_m3: 804.0,
    status: 'assigned',
    assigned_to: 'Crew Alpha-2 (Lead: Tech J. Morales)',
    notes: 'Subsurface cast iron joint seepage. Correlated with citizen photo report of sidewalk depression.',
    created_at: new Date(Date.now() - 95 * 60000).toISOString(),
    assigned_at: new Date(Date.now() - 40 * 60000).toISOString()
  },
  {
    ticket_id: 'TCK-2026-079',
    source: 'sensor',
    linked_anomaly_id: null,
    linked_report_id: null,
    zone_id: 'zone-north',
    zone_name: 'North Hills Residential (DMA-2)',
    pipe_id: 'pipe-n-01',
    location: { lat: 37.8010, lng: -122.4160 },
    priority_score: 62,
    priority_breakdown: {
      severity_weight: 20,
      population_weight: 16,
      loss_rate_weight: 26,
      citizen_bonus: 0
    },
    severity: 'medium',
    estimated_loss_m3: 310.0,
    status: 'reported',
    assigned_to: 'Crew Beta-1 (Lead: Tech S. Kim)',
    notes: 'Scheduled acoustic inspection on booster PRV station bypass line.',
    created_at: new Date(Date.now() - 180 * 60000).toISOString()
  },
  {
    ticket_id: 'TCK-2026-074',
    source: 'citizen',
    linked_anomaly_id: null,
    linked_report_id: null,
    zone_id: 'zone-industrial',
    zone_name: 'South Bay Industrial Corridor (DMA-4)',
    pipe_id: 'pipe-ind-01',
    location: { lat: 37.7550, lng: -122.4060 },
    priority_score: 48,
    priority_breakdown: {
      severity_weight: 15,
      population_weight: 10,
      loss_rate_weight: 18,
      citizen_bonus: 5
    },
    severity: 'low',
    estimated_loss_m3: 160.0,
    status: 'verified_fixed',
    assigned_to: 'Crew Delta-4 (Lead: Tech R. Vance)',
    notes: 'Hydrant curb packing nut tightened and pressure verified. Repaired successfully.',
    created_at: new Date(Date.now() - 360 * 60000).toISOString(),
    assigned_at: new Date(Date.now() - 300 * 60000).toISOString(),
    in_progress_at: new Date(Date.now() - 200 * 60000).toISOString(),
    resolved_at: new Date(Date.now() - 60 * 60000).toISOString(),
    resolution_summary: 'Packing washer replaced. Zero leakage verified at 5.5 bar working pressure.'
  }
];

const INITIAL_REPORTS: LeakReport[] = [
  {
    report_id: 'REP-8492',
    citizen_name: 'David K.',
    citizen_phone: '(415) 555-0192',
    zone_id: 'zone-central',
    location: { lat: 37.7885, lng: -122.4040 },
    address: '480 Market St, Financial District',
    description: 'Clean water bubbling through asphalt near the crosswalk. High volume running into storm drain.',
    estimated_surface_flow: 'Active Geyser/Rupture',
    photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
    status: 'linked_to_ticket',
    linked_anomaly_id: 'anom-2026-001',
    linked_ticket_id: 'TCK-2026-081',
    reported_at: new Date(Date.now() - 30 * 60000).toISOString(),
    cross_referenced_with_sensor: true
  },
  {
    report_id: 'REP-5102',
    citizen_name: 'Aisha M.',
    citizen_phone: '(415) 555-0841',
    zone_id: 'zone-east',
    location: { lat: 37.7685, lng: -122.3920 },
    address: '1240 3rd St, Historic Waterfront',
    description: 'Constant clear water pooling around curb joint even on sunny day. Ground feels hollow.',
    estimated_surface_flow: 'Trickle/Slow Stream',
    photo_url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
    status: 'linked_to_ticket',
    linked_anomaly_id: 'anom-2026-002',
    linked_ticket_id: 'TCK-2026-082',
    reported_at: new Date(Date.now() - 90 * 60000).toISOString(),
    cross_referenced_with_sensor: true
  },
  {
    report_id: 'REP-3091',
    citizen_name: 'Carlos B.',
    citizen_phone: '(415) 555-0319',
    zone_id: 'zone-west',
    location: { lat: 37.7730, lng: -122.4340 },
    address: '2290 Geary Blvd, Western Addition',
    description: 'Damp patch on greenway grass with slight wet sheen.',
    estimated_surface_flow: 'Puddle/Damp Ground',
    photo_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=600&auto=format&fit=crop&q=80',
    status: 'pending',
    linked_anomaly_id: null,
    linked_ticket_id: null,
    reported_at: new Date(Date.now() - 240 * 60000).toISOString(),
    cross_referenced_with_sensor: false
  }
];

class ClientStore {
  public users: User[] = [...INITIAL_USERS];
  public currentUser: User = INITIAL_USERS[0];
  public zones: Zone[] = [...INITIAL_ZONES];
  public pipes: PipeSegment[] = [...INITIAL_PIPES];
  public sensors: Sensor[] = [...INITIAL_SENSORS];
  public anomalies: AnomalyEvent[] = [...INITIAL_ANOMALIES];
  public tickets: MaintenanceTicket[] = [...INITIAL_TICKETS];
  public reports: LeakReport[] = [...INITIAL_REPORTS];

  public getSummary(): CitySummaryStats {
    const activeAnoms = this.anomalies.filter((a) => a.status !== 'resolved').length;
    const openTix = this.tickets.filter((t) => t.status !== 'verified_fixed').length;
    const totalLossRate = this.anomalies
      .filter((a) => a.status !== 'resolved')
      .reduce((sum, a) => sum + (a.estimated_loss_rate_m3_h || 0), 0);

    return {
      total_zones: this.zones.length,
      total_sensors: this.sensors.length,
      total_pipe_km: 94.6,
      active_anomalies: activeAnoms,
      open_tickets: openTix,
      nrw_percentage: 21.8,
      nrw_previous_month: 24.2,
      water_saved_to_date_m3: 184500,
      financial_savings_usd: 304425,
      total_daily_loss_rate_m3_h: Number((114.8 + totalLossRate).toFixed(1)),
      system_health_index: activeAnoms > 2 ? 72.0 : activeAnoms > 0 ? 84.5 : 94.0
    };
  }
}

const clientStore = new ClientStore();

// Safe fetch helper with automated in-memory fallback
async function safeFetch<T>(url: string, options?: RequestInit, fallbackSupplier?: () => T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
    }
  } catch (e) {
    // Backend unreachable (expected when running statically on Vercel)
  }

  if (fallbackSupplier) {
    return fallbackSupplier();
  }
  throw new Error(`Endpoint ${url} unavailable and no fallback provided.`);
}

export const API = {
  // System summary stats
  async getCitySummary(): Promise<CitySummaryStats> {
    return safeFetch('/api/stats/summary', undefined, () => clientStore.getSummary());
  },

  // Auth / Users
  async getCurrentUser(): Promise<{ user: User; available_users: User[] }> {
    return safeFetch('/api/auth/me', undefined, () => ({
      user: clientStore.currentUser,
      available_users: clientStore.users
    }));
  },

  async getUsers(): Promise<User[]> {
    return safeFetch('/api/auth/users', undefined, () => clientStore.users);
  },

  async switchUser(user_id: string): Promise<{ success: boolean; user: User }> {
    return safeFetch(
      '/api/auth/switch-user',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      },
      () => {
        const found = clientStore.users.find((u) => u.user_id === user_id);
        if (found) {
          clientStore.currentUser = found;
          return { success: true, user: found };
        }
        return { success: false, user: clientStore.currentUser };
      }
    );
  },

  async createUser(userData: Partial<User>): Promise<User> {
    return safeFetch(
      '/api/auth/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      },
      () => {
        const newUser: User = {
          user_id: `usr-${Date.now()}`,
          name: userData.name || 'Utility Member',
          email: userData.email || 'user@metrowater.gov',
          role: userData.role || 'utility_staff',
          zone_access: userData.zone_access || ['ALL'],
          department: userData.department || 'Field Operations',
          avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        };
        clientStore.users.push(newUser);
        return newUser;
      }
    );
  },

  // Zones & Network
  async getZones(): Promise<Zone[]> {
    return safeFetch('/api/zones', undefined, () => clientStore.zones);
  },

  async getZoneDetails(zone_id: string): Promise<{
    zone: Zone;
    pipes: PipeSegment[];
    sensors: Sensor[];
    anomalies: AnomalyEvent[];
    tickets: MaintenanceTicket[];
    history: any[];
    sensitivity_config: ZoneSensitivityConfig;
  }> {
    return safeFetch(`/api/zones/${zone_id}`, undefined, () => {
      const zone = clientStore.zones.find((z) => z.zone_id === zone_id) || clientStore.zones[0];
      const pipes = clientStore.pipes.filter((p) => p.zone_id === zone_id);
      const sensors = clientStore.sensors.filter((s) => s.zone_id === zone_id);
      const anomalies = clientStore.anomalies.filter((a) => a.zone_id === zone_id);
      const tickets = clientStore.tickets.filter((t) => t.zone_id === zone_id);
      return {
        zone,
        pipes,
        sensors,
        anomalies,
        tickets,
        history: [],
        sensitivity_config: {
          zone_id,
          z_score_threshold: 2.5,
          rolling_window_minutes: 30,
          min_flow_deviation_pct: 15,
          night_flow_multiplier: 1.25,
          auto_ticket_threshold: 75
        }
      };
    });
  },

  async updateZoneSensitivity(zone_id: string, config: Partial<ZoneSensitivityConfig>): Promise<any> {
    return safeFetch(
      `/api/zones/${zone_id}/sensitivity`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      },
      () => ({ success: true, zone_id, config })
    );
  },

  async getPipes(): Promise<PipeSegment[]> {
    return safeFetch('/api/zones/network/pipes', undefined, () => clientStore.pipes);
  },

  async getSensors(): Promise<Sensor[]> {
    return safeFetch('/api/zones/network/sensors', undefined, () => clientStore.sensors);
  },

  async createSensor(sensorData: Partial<Sensor>): Promise<Sensor> {
    return safeFetch(
      '/api/zones/network/sensors',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensorData)
      },
      () => {
        const newSensor: Sensor = {
          sensor_id: `${sensorData.type === 'flow' ? 'FL' : 'PR'}-${Date.now().toString().slice(-4)}`,
          zone_id: sensorData.zone_id || 'zone-central',
          type: sensorData.type || 'flow',
          location: sensorData.location || { lat: 37.785, lng: -122.41 },
          status: 'active',
          battery_pct: 100,
          sampling_rate_sec: 15,
          last_ping: new Date().toISOString(),
          current_reading: sensorData.type === 'flow' ? 145.0 : 3.5,
          unit: sensorData.type === 'flow' ? 'm³/h' : 'bar'
        };
        clientStore.sensors.push(newSensor);
        return newSensor;
      }
    );
  },

  // Anomalies
  async getAnomalies(params?: { zone_id?: string; severity?: string; status?: string }): Promise<AnomalyEvent[]> {
    return safeFetch('/api/anomalies', undefined, () => {
      let res = [...clientStore.anomalies];
      if (params?.zone_id) res = res.filter((a) => a.zone_id === params.zone_id);
      if (params?.severity) res = res.filter((a) => a.severity === params.severity);
      if (params?.status) res = res.filter((a) => a.status === params.status);
      return res;
    });
  },

  async updateAnomalyStatus(event_id: string, status: string): Promise<AnomalyEvent> {
    return safeFetch(
      `/api/anomalies/${event_id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      },
      () => {
        const anomaly = clientStore.anomalies.find((a) => a.event_id === event_id);
        if (anomaly) {
          anomaly.status = status as any;
          return anomaly;
        }
        throw new Error('Anomaly not found');
      }
    );
  },

  // Maintenance Tickets
  async getMaintenanceTickets(params?: { status?: string; zone_id?: string }): Promise<MaintenanceTicket[]> {
    return safeFetch('/api/maintenance', undefined, () => {
      let res = [...clientStore.tickets];
      if (params?.status) res = res.filter((t) => t.status === params.status);
      if (params?.zone_id) res = res.filter((t) => t.zone_id === params.zone_id);
      return res;
    });
  },

  async updateMaintenanceTicket(ticket_id: string, update: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    return safeFetch(
      `/api/maintenance/${ticket_id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      },
      () => {
        const ticket = clientStore.tickets.find((t) => t.ticket_id === ticket_id);
        if (ticket) {
          Object.assign(ticket, update);
          if (update.status === 'assigned' && !ticket.assigned_at) ticket.assigned_at = new Date().toISOString();
          if (update.status === 'in_progress' && !ticket.in_progress_at) ticket.in_progress_at = new Date().toISOString();
          if (update.status === 'verified_fixed' && !ticket.resolved_at) ticket.resolved_at = new Date().toISOString();
          return ticket;
        }
        throw new Error('Ticket not found');
      }
    );
  },

  async createMaintenanceTicket(data: any): Promise<MaintenanceTicket> {
    return safeFetch(
      '/api/maintenance',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => {
        const zone = clientStore.zones.find((z) => z.zone_id === data.zone_id);
        const newTicket: MaintenanceTicket = {
          ticket_id: `TCK-2026-${Math.floor(100 + Math.random() * 900)}`,
          source: data.source || 'sensor',
          linked_anomaly_id: data.linked_anomaly_id || null,
          linked_report_id: data.linked_report_id || null,
          zone_id: data.zone_id || 'zone-central',
          zone_name: zone ? zone.name : 'Central Commercial & Downtown (DMA-1)',
          location: zone?.boundary_coordinates[0] || { lat: 37.785, lng: -122.41 },
          priority_score: data.severity === 'critical' ? 95 : data.severity === 'high' ? 82 : 55,
          priority_breakdown: {
            severity_weight: data.severity === 'critical' ? 40 : 25,
            population_weight: 20,
            loss_rate_weight: 25,
            citizen_bonus: 10
          },
          severity: data.severity || 'high',
          estimated_loss_m3: 450,
          status: 'reported',
          assigned_to: data.assigned_to || 'Crew Delta-4 (Lead: Tech R. Vance)',
          notes: data.notes || 'Emergency dispatch created.',
          created_at: new Date().toISOString()
        };
        clientStore.tickets.unshift(newTicket);
        return newTicket;
      }
    );
  },

  // Citizen Reports
  async submitCitizenReport(data: any): Promise<{ success: boolean; report: LeakReport; message: string }> {
    return safeFetch(
      '/api/citizen-reports/submit',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => {
        const zoneId = data.zone_id || 'zone-central';
        const hasMatchingAnomaly = clientStore.anomalies.some((a) => a.zone_id === zoneId && a.status !== 'resolved');

        const newReport: LeakReport = {
          report_id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
          zone_id: zoneId,
          location: data.location || { lat: 37.7885, lng: -122.404 },
          address: data.address || 'Reported street location',
          description: data.description || 'Observed water leakage',
          estimated_surface_flow: data.estimated_surface_flow || 'Active Geyser/Rupture',
          photo_url: data.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
          status: hasMatchingAnomaly ? 'linked_to_ticket' : 'pending',
          linked_anomaly_id: hasMatchingAnomaly ? 'anom-2026-001' : null,
          linked_ticket_id: hasMatchingAnomaly ? 'TCK-2026-081' : null,
          reported_at: new Date().toISOString(),
          cross_referenced_with_sensor: hasMatchingAnomaly
        };

        clientStore.reports.unshift(newReport);
        return {
          success: true,
          report: newReport,
          message: hasMatchingAnomaly
            ? 'Report cross-verified with real-time hydraulic sensor telemetry in this zone!'
            : 'Report submitted successfully and routed to dispatch queue.'
        };
      }
    );
  },

  async lookupCitizenReport(report_id: string): Promise<{ report: LeakReport; linked_ticket?: MaintenanceTicket }> {
    return safeFetch(`/api/citizen-reports/lookup/${report_id}`, undefined, () => {
      const report = clientStore.reports.find((r) => r.report_id.toUpperCase() === report_id.toUpperCase());
      if (report) {
        const ticket = clientStore.tickets.find((t) => t.ticket_id === report.linked_ticket_id);
        return { report, linked_ticket: ticket };
      }
      throw new Error(`Report "${report_id}" not found.`);
    });
  },

  async getCitizenReportById(report_id: string): Promise<LeakReport> {
    return safeFetch(`/api/citizen-reports/lookup/${report_id}`, undefined, () => {
      const report = clientStore.reports.find((r) => r.report_id.toUpperCase() === report_id.toUpperCase());
      if (report) return report;
      throw new Error(`Report "${report_id}" not found.`);
    });
  },

  async getCitizenReports(): Promise<LeakReport[]> {
    return safeFetch('/api/citizen-reports', undefined, () => clientStore.reports);
  },

  // Simulator controls
  async injectLeak(data: {
    zone_id: string;
    type?: string;
    severity?: string;
    flow_increase_m3_h?: number;
    pressure_drop_bar?: number;
  }): Promise<any> {
    return safeFetch(
      '/api/simulator/inject',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      () => {
        const zone = clientStore.zones.find((z) => z.zone_id === data.zone_id);
        if (zone) {
          const flowAdd = data.flow_increase_m3_h || 65.0;
          const pressDrop = data.pressure_drop_bar || 0.85;

          zone.current_flow_m3_h = Number(((zone.current_flow_m3_h || zone.base_demand_m3_h) + flowAdd).toFixed(1));
          zone.current_pressure_bar = Number(Math.max(1.0, (zone.current_pressure_bar || zone.target_pressure_bar) - pressDrop).toFixed(2));
          zone.risk_level = (data.severity as any) || 'critical';
          zone.active_anomalies_count = (zone.active_anomalies_count || 0) + 1;

          const newAnomaly: AnomalyEvent = {
            event_id: `anom-sim-${Date.now()}`,
            zone_id: zone.zone_id,
            zone_name: zone.name,
            detected_at: new Date().toISOString(),
            severity: (data.severity as any) || 'critical',
            type: (data.type as any) || 'Sudden Pipe Burst',
            z_score: 4.12,
            deviation_pct: Number(((flowAdd / zone.base_demand_m3_h) * 100).toFixed(1)),
            observed_flow: zone.current_flow_m3_h,
            expected_flow: zone.base_demand_m3_h,
            observed_pressure: zone.current_pressure_bar,
            expected_pressure: zone.target_pressure_bar,
            estimated_loss_rate_m3_h: flowAdd,
            status: 'investigating',
            description: `Simulated ${data.type || 'Pipe Burst'} in ${zone.name}. +${flowAdd} m³/h flow surge with -${pressDrop} bar pressure drop.`
          };

          clientStore.anomalies.unshift(newAnomaly);

          // Auto-generate ticket
          const newTicket: MaintenanceTicket = {
            ticket_id: `TCK-SIM-${Math.floor(100 + Math.random() * 900)}`,
            source: 'sensor',
            linked_anomaly_id: newAnomaly.event_id,
            zone_id: zone.zone_id,
            zone_name: zone.name,
            location: zone.boundary_coordinates[0],
            priority_score: 95,
            priority_breakdown: {
              severity_weight: 40,
              population_weight: 25,
              loss_rate_weight: 30,
              citizen_bonus: 0
            },
            severity: newAnomaly.severity,
            estimated_loss_m3: flowAdd * 24,
            status: 'reported',
            assigned_to: 'Crew Delta-4 (Lead: Tech R. Vance)',
            notes: `Simulated anomaly triggered automated emergency dispatch.`,
            created_at: new Date().toISOString()
          };

          clientStore.tickets.unshift(newTicket);
          return { success: true, anomaly: newAnomaly, ticket: newTicket };
        }
        return { success: true };
      }
    );
  },

  async clearLeak(zone_id: string): Promise<any> {
    return safeFetch(
      '/api/simulator/clear',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id })
      },
      () => {
        const zone = clientStore.zones.find((z) => z.zone_id === zone_id);
        if (zone) {
          zone.current_flow_m3_h = zone.base_demand_m3_h;
          zone.current_pressure_bar = zone.target_pressure_bar;
          zone.risk_level = 'low';
          zone.active_anomalies_count = 0;
        }
        clientStore.anomalies = clientStore.anomalies.filter((a) => a.zone_id !== zone_id);
        return { success: true, zone_id };
      }
    );
  },

  async getSimulatorStatus(): Promise<any> {
    return safeFetch('/api/simulator/status', undefined, () => ({
      active_scenarios_count: clientStore.anomalies.filter((a) => a.status !== 'resolved').length,
      zones: clientStore.zones
    }));
  }
};
