/**
 * AquaWatch Database & In-Memory State Store
 * 
 * Provides high-speed in-memory state initialized with realistic urban geospatial
 * and hydraulic telemetry data for Metro Water Utility District.
 */

import {
  AnomalyEvent,
  CitySummaryStats,
  ConsumptionRecord,
  LeakReport,
  MaintenanceTicket,
  PipeSegment,
  Sensor,
  User,
  Zone,
  ZoneSensitivityConfig
} from '../../src/types';

export class DataStore {
  public static users: User[] = [
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

  public static zones: Zone[] = [
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
        { lat: 37.7600, lng: -122.4280 }
      ]
    }
  ];

  public static pipeSegments: PipeSegment[] = [
    {
      pipe_id: 'pipe-c-101',
      zone_id: 'zone-central',
      material: 'Cast Iron',
      install_year: 1974,
      diameter_mm: 350,
      nominal_pressure_bar: 3.8,
      condition_score: 3.4,
      has_active_leak: true,
      leak_count_historical: 7,
      path_coordinates: [
        { lat: 37.7850, lng: -122.4140 },
        { lat: 37.7885, lng: -122.4070 },
        { lat: 37.7910, lng: -122.4010 }
      ]
    },
    {
      pipe_id: 'pipe-c-102',
      zone_id: 'zone-central',
      material: 'Ductile Iron',
      install_year: 1998,
      diameter_mm: 250,
      nominal_pressure_bar: 3.8,
      condition_score: 6.8,
      has_active_leak: false,
      leak_count_historical: 2,
      path_coordinates: [
        { lat: 37.7810, lng: -122.4180 },
        { lat: 37.7850, lng: -122.4140 },
        { lat: 37.7820, lng: -122.4040 }
      ]
    },
    {
      pipe_id: 'pipe-n-201',
      zone_id: 'zone-north',
      material: 'PVC',
      install_year: 2008,
      diameter_mm: 200,
      nominal_pressure_bar: 4.2,
      condition_score: 7.9,
      has_active_leak: false,
      leak_count_historical: 1,
      path_coordinates: [
        { lat: 37.7980, lng: -122.4210 },
        { lat: 37.8040, lng: -122.4150 },
        { lat: 37.8055, lng: -122.4090 }
      ]
    },
    {
      pipe_id: 'pipe-e-301',
      zone_id: 'zone-east',
      material: 'Asbestos Cement',
      install_year: 1968,
      diameter_mm: 300,
      nominal_pressure_bar: 3.2,
      condition_score: 2.8,
      has_active_leak: true,
      leak_count_historical: 9,
      path_coordinates: [
        { lat: 37.7720, lng: -122.3920 },
        { lat: 37.7680, lng: -122.3870 },
        { lat: 37.7640, lng: -122.3840 }
      ]
    },
    {
      pipe_id: 'pipe-i-401',
      zone_id: 'zone-industrial',
      material: 'HDPE',
      install_year: 2019,
      diameter_mm: 400,
      nominal_pressure_bar: 4.5,
      condition_score: 9.4,
      has_active_leak: false,
      leak_count_historical: 0,
      path_coordinates: [
        { lat: 37.7580, lng: -122.4090 },
        { lat: 37.7520, lng: -122.3990 },
        { lat: 37.7470, lng: -122.3940 }
      ]
    },
    {
      pipe_id: 'pipe-w-501',
      zone_id: 'zone-west',
      material: 'Ductile Iron',
      install_year: 2015,
      diameter_mm: 250,
      nominal_pressure_bar: 3.4,
      condition_score: 8.9,
      has_active_leak: false,
      leak_count_historical: 1,
      path_coordinates: [
        { lat: 37.7710, lng: -122.4380 },
        { lat: 37.7760, lng: -122.4310 },
        { lat: 37.7810, lng: -122.4260 }
      ]
    }
  ];

  public static sensors: Sensor[] = [
    {
      sensor_id: 'SEN-FL-01',
      zone_id: 'zone-central',
      pipe_id: 'pipe-c-101',
      type: 'flow',
      location: { lat: 37.7885, lng: -122.4070 },
      status: 'warning',
      battery_pct: 94,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 242.4,
      unit: 'm³/h'
    },
    {
      sensor_id: 'SEN-PR-02',
      zone_id: 'zone-central',
      pipe_id: 'pipe-c-101',
      type: 'pressure',
      location: { lat: 37.7890, lng: -122.4055 },
      status: 'warning',
      battery_pct: 91,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 2.75,
      unit: 'bar'
    },
    {
      sensor_id: 'SEN-FL-03',
      zone_id: 'zone-north',
      pipe_id: 'pipe-n-201',
      type: 'flow',
      location: { lat: 37.8010, lng: -122.4170 },
      status: 'active',
      battery_pct: 98,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 122.8,
      unit: 'm³/h'
    },
    {
      sensor_id: 'SEN-PR-04',
      zone_id: 'zone-north',
      pipe_id: 'pipe-n-201',
      type: 'pressure',
      location: { lat: 37.8040, lng: -122.4150 },
      status: 'active',
      battery_pct: 88,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 4.05,
      unit: 'bar'
    },
    {
      sensor_id: 'SEN-FL-05',
      zone_id: 'zone-east',
      pipe_id: 'pipe-e-301',
      type: 'flow',
      location: { lat: 37.7690, lng: -122.3890 },
      status: 'warning',
      battery_pct: 82,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 128.5,
      unit: 'm³/h'
    },
    {
      sensor_id: 'SEN-PR-06',
      zone_id: 'zone-east',
      pipe_id: 'pipe-e-301',
      type: 'pressure',
      location: { lat: 37.7660, lng: -122.3855 },
      status: 'warning',
      battery_pct: 76,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 2.85,
      unit: 'bar'
    },
    {
      sensor_id: 'SEN-FL-07',
      zone_id: 'zone-industrial',
      pipe_id: 'pipe-i-401',
      type: 'flow',
      location: { lat: 37.7530, lng: -122.4010 },
      status: 'active',
      battery_pct: 99,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 204.0,
      unit: 'm³/h'
    },
    {
      sensor_id: 'SEN-PR-08',
      zone_id: 'zone-industrial',
      pipe_id: 'pipe-i-401',
      type: 'pressure',
      location: { lat: 37.7490, lng: -122.3960 },
      status: 'active',
      battery_pct: 95,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 4.48,
      unit: 'bar'
    },
    {
      sensor_id: 'SEN-FL-09',
      zone_id: 'zone-west',
      pipe_id: 'pipe-w-501',
      type: 'flow',
      location: { lat: 37.7740, lng: -122.4330 },
      status: 'active',
      battery_pct: 96,
      sampling_rate_sec: 5,
      last_ping: new Date().toISOString(),
      current_reading: 134.2,
      unit: 'm³/h'
    }
  ];

  public static anomalyEvents: AnomalyEvent[] = [
    {
      event_id: 'EVT-2026-0891',
      zone_id: 'zone-central',
      zone_name: 'Central Commercial & Downtown (DMA-1)',
      sensor_id: 'SEN-FL-01',
      pipe_id: 'pipe-c-101',
      detected_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      severity: 'critical',
      type: 'Sudden Pipe Burst',
      z_score: 4.25,
      deviation_pct: 48.5,
      observed_flow: 242.4,
      expected_flow: 163.2,
      observed_pressure: 2.75,
      expected_pressure: 3.80,
      estimated_loss_rate_m3_h: 79.2,
      status: 'ticket_created',
      linked_ticket_id: 'TCK-2026-0101',
      has_cross_referenced_citizen_report: true,
      linked_report_ids: ['REP-8492'],
      description: 'Major main rupture detected on Montgomery St 350mm feeder: sudden +48.5% flow spike accompanied by -1.05 bar pressure collapse.'
    },
    {
      event_id: 'EVT-2026-0892',
      zone_id: 'zone-east',
      zone_name: 'East Riverside Historic Quarter (DMA-3)',
      sensor_id: 'SEN-FL-05',
      pipe_id: 'pipe-e-301',
      detected_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      severity: 'high',
      type: 'Slow Creep Leak',
      z_score: 2.95,
      deviation_pct: 35.2,
      observed_flow: 128.5,
      expected_flow: 95.0,
      observed_pressure: 2.85,
      expected_pressure: 3.20,
      estimated_loss_rate_m3_h: 33.5,
      status: 'ticket_created',
      linked_ticket_id: 'TCK-2026-0102',
      has_cross_referenced_citizen_report: false,
      description: 'Progressive joint separation leak in 1968 Asbestos-Cement sub-main. Background loss accumulating steadily.'
    },
    {
      event_id: 'EVT-2026-0888',
      zone_id: 'zone-north',
      zone_name: 'North Hills Residential (DMA-2)',
      sensor_id: 'SEN-FL-03',
      pipe_id: 'pipe-n-201',
      detected_at: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
      severity: 'medium',
      type: 'Night Minimum Flow Surge',
      z_score: 2.45,
      deviation_pct: 21.0,
      observed_flow: 48.2,
      expected_flow: 39.8,
      observed_pressure: 4.10,
      expected_pressure: 4.20,
      estimated_loss_rate_m3_h: 8.4,
      status: 'open',
      description: 'Unusual elevated minimum flow recorded between 03:00-04:30 AM in upper distribution sector.'
    }
  ];

  public static citizenReports: LeakReport[] = [
    {
      report_id: 'REP-8492',
      citizen_name: 'David Alvarez',
      citizen_phone: '+1 (415) 555-0192',
      zone_id: 'zone-central',
      location: { lat: 37.7892, lng: -122.4068 },
      address: '420 Montgomery St (Near Market St intersection)',
      description: 'Heavy stream of clear clean water gushing from under the curb and asphalt near the bus stop. Pavement is starting to buckle.',
      estimated_surface_flow: 'Active Geyser/Rupture',
      photo_url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
      status: 'linked_to_ticket',
      linked_anomaly_id: 'EVT-2026-0891',
      linked_ticket_id: 'TCK-2026-0101',
      reported_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      cross_referenced_with_sensor: true
    },
    {
      report_id: 'REP-8495',
      citizen_name: 'Maya Lin',
      citizen_phone: '+1 (415) 555-0481',
      zone_id: 'zone-north',
      location: { lat: 37.8020, lng: -122.4180 },
      address: '884 Lombard St & Hyde',
      description: 'Constant wet puddle on sidewalk near hydrants for the past 2 days with no rain. Water trickling into gutter.',
      estimated_surface_flow: 'Trickle/Slow Stream',
      photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
      status: 'verified',
      reported_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      cross_referenced_with_sensor: false
    },
    {
      report_id: 'REP-8498',
      citizen_name: 'Anonymous Resident',
      zone_id: 'zone-east',
      location: { lat: 37.7715, lng: -122.3895 },
      address: '350 3rd St, East Riverside',
      description: 'Low water pressure in 4th floor apartments and audible hissing noise near the utility access vault.',
      estimated_surface_flow: 'Puddle/Damp Ground',
      photo_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      status: 'linked_to_ticket',
      linked_anomaly_id: 'EVT-2026-0892',
      linked_ticket_id: 'TCK-2026-0102',
      reported_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      cross_referenced_with_sensor: true
    }
  ];

  public static maintenanceTickets: MaintenanceTicket[] = [
    {
      ticket_id: 'TCK-2026-0101',
      source: 'hybrid_cross_verified',
      linked_anomaly_id: 'EVT-2026-0891',
      linked_report_id: 'REP-8492',
      zone_id: 'zone-central',
      zone_name: 'Central Commercial & Downtown (DMA-1)',
      pipe_id: 'pipe-c-101',
      location: { lat: 37.7888, lng: -122.4069 },
      priority_score: 94.5,
      priority_breakdown: {
        severity_weight: 40.0, // 100 * 0.40
        population_weight: 34.0, // (48500/50000)*100 * 0.35
        loss_rate_weight: 24.8, // (79.2/80)*100 * 0.25
        citizen_bonus: 10.0     // Confirmed visual report
      },
      severity: 'critical',
      estimated_loss_m3: 135.0,
      status: 'in_progress',
      assigned_to: 'Crew Delta-4 (Lead: Tech R. Vance)',
      notes: 'URGENT DISPATCH: Acoustic ground microphone and isolation valve crew en route. Section isolation initiated at Valve C-101-B.',
      created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
      assigned_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      in_progress_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      ticket_id: 'TCK-2026-0102',
      source: 'sensor',
      linked_anomaly_id: 'EVT-2026-0892',
      linked_report_id: 'REP-8498',
      zone_id: 'zone-east',
      zone_name: 'East Riverside Historic Quarter (DMA-3)',
      pipe_id: 'pipe-e-301',
      location: { lat: 37.7690, lng: -122.3890 },
      priority_score: 72.8,
      priority_breakdown: {
        severity_weight: 30.0,
        population_weight: 18.5,
        loss_rate_weight: 14.3,
        citizen_bonus: 10.0
      },
      severity: 'high',
      estimated_loss_m3: 61.5,
      status: 'assigned',
      assigned_to: 'Crew Alpha-2 (Lead: Tech J. Morales)',
      notes: 'Leak correlator attached. Correlation indicates leak within 14 meters of junction 301. Clamp kit prepared.',
      created_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
      assigned_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      ticket_id: 'TCK-2026-0098',
      source: 'sensor',
      zone_id: 'zone-west',
      zone_name: 'Westside Suburbs & Campus (DMA-5)',
      pipe_id: 'pipe-w-501',
      location: { lat: 37.7750, lng: -122.4320 },
      priority_score: 48.0,
      priority_breakdown: {
        severity_weight: 20.0,
        population_weight: 21.0,
        loss_rate_weight: 7.0,
        citizen_bonus: 0
      },
      severity: 'medium',
      estimated_loss_m3: 28.0,
      status: 'verified_fixed',
      assigned_to: 'Crew Beta-1 (Lead: Tech S. Kim)',
      notes: 'Defective packing seal replaced on 250mm gate valve. Post-repair acoustic and pressure test verified normal at 3.42 bar.',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      assigned_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      in_progress_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      resolution_summary: 'Replaced failed gland flange gasket. Zero seepage confirmed on 60-min hydrostatic re-test.'
    }
  ];

  public static zoneSensitivityConfigs: Record<string, ZoneSensitivityConfig> = {
    'zone-central': {
      zone_id: 'zone-central',
      z_score_threshold: 2.3,
      rolling_window_minutes: 30,
      min_flow_deviation_pct: 12.0,
      night_flow_multiplier: 1.30,
      auto_ticket_threshold: 70.0
    },
    'zone-north': {
      zone_id: 'zone-north',
      z_score_threshold: 2.5,
      rolling_window_minutes: 30,
      min_flow_deviation_pct: 15.0,
      night_flow_multiplier: 1.25,
      auto_ticket_threshold: 75.0
    },
    'zone-east': {
      zone_id: 'zone-east',
      z_score_threshold: 2.2,
      rolling_window_minutes: 30,
      min_flow_deviation_pct: 10.0,
      night_flow_multiplier: 1.35,
      auto_ticket_threshold: 65.0
    },
    'zone-industrial': {
      zone_id: 'zone-industrial',
      z_score_threshold: 3.0,
      rolling_window_minutes: 45,
      min_flow_deviation_pct: 20.0,
      night_flow_multiplier: 1.15,
      auto_ticket_threshold: 80.0
    },
    'zone-west': {
      zone_id: 'zone-west',
      z_score_threshold: 2.6,
      rolling_window_minutes: 30,
      min_flow_deviation_pct: 15.0,
      night_flow_multiplier: 1.25,
      auto_ticket_threshold: 75.0
    }
  };

  // Rolling buffer for recent telemetry records (500 records max in buffer)
  public static consumptionHistory: ConsumptionRecord[] = [];

  // Summary statistics for citywide KPIs
  public static getCitySummary(): CitySummaryStats {
    const total_zones = this.zones.length;
    const total_sensors = this.sensors.length;
    const total_pipe_km = 94.6;
    const active_anomalies = this.anomalyEvents.filter(e => e.status !== 'resolved').length;
    const open_tickets = this.maintenanceTickets.filter(t => t.status !== 'verified_fixed').length;
    
    // Average NRW weighted by population
    const totalPop = this.zones.reduce((sum, z) => sum + z.population, 0);
    const weightedNrw = this.zones.reduce((sum, z) => sum + ((z.nrw_rate_pct || 15) * z.population), 0) / (totalPop || 1);
    
    // Cumulative water saved counter (starts at base benchmark + dynamic increment)
    const water_saved_to_date_m3 = 48290.0 + (this.maintenanceTickets.filter(t => t.status === 'verified_fixed').length * 450);
    const financial_savings_usd = water_saved_to_date_m3 * 1.65;

    const totalDailyLossRate = this.anomalyEvents
      .filter(e => e.status !== 'resolved')
      .reduce((sum, e) => sum + e.estimated_loss_rate_m3_h, 0);

    const system_health_index = Math.max(20, Math.min(98, 100 - (active_anomalies * 12) - (weightedNrw * 0.8)));

    return {
      total_zones,
      total_sensors,
      total_pipe_km,
      active_anomalies,
      open_tickets,
      nrw_percentage: Number(weightedNrw.toFixed(1)),
      nrw_previous_month: 24.2,
      water_saved_to_date_m3: Math.round(water_saved_to_date_m3),
      financial_savings_usd: Math.round(financial_savings_usd),
      total_daily_loss_rate_m3_h: Number(totalDailyLossRate.toFixed(1)),
      system_health_index: Math.round(system_health_index)
    };
  }
}
