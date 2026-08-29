/**
 * AquaWatch Database & In-Memory State Store
 * 
 * Provides high-speed in-memory state initialized with realistic urban geospatial
 * and hydraulic telemetry data for Metro Water Utility District.
 * 
 * All seed data is loaded from JSON files under /data/.
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

// Import seed data from JSON files
import seedUsersData from '../../data/seed_users.json';
import seedZonesData from '../../data/seed_zones.json';
import seedPipesData from '../../data/seed_pipes.json';
import seedSensorsData from '../../data/seed_sensors.json';
import seedAnomalyEventsData from '../../data/seed_anomaly_events.json';
import seedCitizenReportsData from '../../data/seed_citizen_reports.json';
import seedMaintenanceTicketsData from '../../data/seed_maintenance_tickets.json';
import seedZoneSensitivityConfigsData from '../../data/seed_zone_sensitivity_configs.json';
import citySummaryConstants from '../../data/city_summary_constants.json';

// Helper: convert minute offset to ISO timestamp
function offsetMinutesToISO(offsetMinutes: number): string {
  return new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString();
}

// Helper: convert hour offset to ISO timestamp
function offsetHoursToISO(offsetHours: number): string {
  return new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();
}

// Initialize sensors with dynamic last_ping timestamps
function initSensors(): Sensor[] {
  return (seedSensorsData as any[]).map(s => ({
    ...s,
    last_ping: new Date().toISOString()
  })) as Sensor[];
}

// Initialize anomaly events with dynamic timestamps from offsets
function initAnomalyEvents(): AnomalyEvent[] {
  return (seedAnomalyEventsData as any[]).map(e => {
    const { detected_at_offset_minutes, ...rest } = e;
    return {
      ...rest,
      detected_at: offsetMinutesToISO(detected_at_offset_minutes)
    } as AnomalyEvent;
  });
}

// Initialize citizen reports with dynamic timestamps from offsets
function initCitizenReports(): LeakReport[] {
  return (seedCitizenReportsData as any[]).map(r => {
    const { reported_at_offset_minutes, ...rest } = r;
    return {
      ...rest,
      reported_at: offsetMinutesToISO(reported_at_offset_minutes)
    } as LeakReport;
  });
}

// Initialize maintenance tickets with dynamic timestamps from offsets
function initMaintenanceTickets(): MaintenanceTicket[] {
  return (seedMaintenanceTicketsData as any[]).map(t => {
    const {
      created_at_offset_minutes,
      assigned_at_offset_minutes,
      in_progress_at_offset_minutes,
      created_at_offset_hours,
      assigned_at_offset_hours,
      in_progress_at_offset_hours,
      resolved_at_offset_hours,
      ...rest
    } = t;

    const ticket: any = { ...rest };

    // Handle minute-based offsets
    if (created_at_offset_minutes !== undefined) {
      ticket.created_at = offsetMinutesToISO(created_at_offset_minutes);
    }
    if (assigned_at_offset_minutes !== undefined) {
      ticket.assigned_at = offsetMinutesToISO(assigned_at_offset_minutes);
    }
    if (in_progress_at_offset_minutes !== undefined) {
      ticket.in_progress_at = offsetMinutesToISO(in_progress_at_offset_minutes);
    }

    // Handle hour-based offsets
    if (created_at_offset_hours !== undefined) {
      ticket.created_at = offsetHoursToISO(created_at_offset_hours);
    }
    if (assigned_at_offset_hours !== undefined) {
      ticket.assigned_at = offsetHoursToISO(assigned_at_offset_hours);
    }
    if (in_progress_at_offset_hours !== undefined) {
      ticket.in_progress_at = offsetHoursToISO(in_progress_at_offset_hours);
    }
    if (resolved_at_offset_hours !== undefined) {
      ticket.resolved_at = offsetHoursToISO(resolved_at_offset_hours);
    }

    return ticket as MaintenanceTicket;
  });
}

const SC = citySummaryConstants;

export class DataStore {
  /* ORIGINAL HARDCODED DATA: users array was defined inline — see data/seed_users.json */
  public static users: User[] = seedUsersData as User[];

  /* ORIGINAL HARDCODED DATA: zones array was defined inline — see data/seed_zones.json */
  public static zones: Zone[] = seedZonesData as Zone[];

  /* ORIGINAL HARDCODED DATA: pipeSegments array was defined inline — see data/seed_pipes.json */
  public static pipeSegments: PipeSegment[] = seedPipesData as PipeSegment[];

  /* ORIGINAL HARDCODED DATA: sensors array was defined inline — see data/seed_sensors.json */
  public static sensors: Sensor[] = initSensors();

  /* ORIGINAL HARDCODED DATA: anomalyEvents array was defined inline — see data/seed_anomaly_events.json */
  public static anomalyEvents: AnomalyEvent[] = initAnomalyEvents();

  /* ORIGINAL HARDCODED DATA: citizenReports array was defined inline — see data/seed_citizen_reports.json */
  public static citizenReports: LeakReport[] = initCitizenReports();

  /* ORIGINAL HARDCODED DATA: maintenanceTickets array was defined inline — see data/seed_maintenance_tickets.json */
  public static maintenanceTickets: MaintenanceTicket[] = initMaintenanceTickets();

  /* ORIGINAL HARDCODED DATA: zoneSensitivityConfigs object was defined inline — see data/seed_zone_sensitivity_configs.json */
  public static zoneSensitivityConfigs: Record<string, ZoneSensitivityConfig> = seedZoneSensitivityConfigsData as Record<string, ZoneSensitivityConfig>;

  // Rolling buffer for recent telemetry records (500 records max in buffer)
  public static consumptionHistory: ConsumptionRecord[] = [];

  // Summary statistics for citywide KPIs
  public static getCitySummary(): CitySummaryStats {
    const total_zones = this.zones.length;
    const total_sensors = this.sensors.length;
    const total_pipe_km = SC.total_pipe_km; // ORIGINAL: 94.6
    const active_anomalies = this.anomalyEvents.filter(e => e.status !== 'resolved').length;
    const open_tickets = this.maintenanceTickets.filter(t => t.status !== 'verified_fixed').length;
    
    // Average NRW weighted by population
    const totalPop = this.zones.reduce((sum, z) => sum + z.population, 0);
    const weightedNrw = this.zones.reduce((sum, z) => sum + ((z.nrw_rate_pct || 15) * z.population), 0) / (totalPop || 1);
    
    // Cumulative water saved counter (starts at base benchmark + dynamic increment)
    // ORIGINAL: const water_saved_to_date_m3 = 48290.0 + (this.maintenanceTickets.filter(...).length * 450);
    const water_saved_to_date_m3 = SC.water_saved_base_m3 + (this.maintenanceTickets.filter(t => t.status === 'verified_fixed').length * SC.water_saved_per_fixed_ticket_m3);
    // ORIGINAL: const financial_savings_usd = water_saved_to_date_m3 * 1.65;
    const financial_savings_usd = water_saved_to_date_m3 * SC.water_cost_per_m3_usd;

    const totalDailyLossRate = this.anomalyEvents
      .filter(e => e.status !== 'resolved')
      .reduce((sum, e) => sum + e.estimated_loss_rate_m3_h, 0);

    // ORIGINAL: const system_health_index = Math.max(20, Math.min(98, 100 - (active_anomalies * 12) - (weightedNrw * 0.8)));
    const system_health_index = Math.max(SC.health_index_min, Math.min(SC.health_index_max, SC.health_index_base - (active_anomalies * SC.anomaly_health_weight) - (weightedNrw * SC.nrw_health_weight)));

    return {
      total_zones,
      total_sensors,
      total_pipe_km,
      active_anomalies,
      open_tickets,
      nrw_percentage: Number(weightedNrw.toFixed(1)),
      nrw_previous_month: SC.nrw_previous_month, // ORIGINAL: 24.2
      water_saved_to_date_m3: Math.round(water_saved_to_date_m3),
      financial_savings_usd: Math.round(financial_savings_usd),
      total_daily_loss_rate_m3_h: Number(totalDailyLossRate.toFixed(1)),
      system_health_index: Math.round(system_health_index)
    };
  }
}
