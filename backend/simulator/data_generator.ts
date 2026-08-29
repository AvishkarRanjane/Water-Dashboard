/**
 * AquaWatch Simulator - Synthetic Hydraulic Telemetry & Leak Injection Engine
 * 
 * Generates continuous, realistic multi-zone flow (m³/h) and pressure (bar) time-series
 * data with realistic diurnal cycles, stochastic noise, and user-injectable physical pipe leaks.
 */

import { AnomalyEngine } from '../core/anomaly_engine';
import { LossEstimationEngine } from '../core/loss_estimation';
import { PriorityRankingEngine } from '../core/priority_ranking';
import { DataStore } from '../db/in_memory_store';
import { AnomalyEvent, AnomalySeverity, AnomalyType, ConsumptionRecord, MaintenanceTicket, Sensor, Zone } from '../../src/types';
import simulatorConstants from '../../data/simulator_constants.json';
import defaultSensitivityConfig from '../../data/default_sensitivity_config.json';

const SC = simulatorConstants;

export interface InjectedLeakScenario {
  zone_id: string;
  pipe_id?: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  flow_increase_m3_h: number;
  pressure_drop_bar: number;
  description: string;
  active: boolean;
  injected_at: string;
}

export class TelemetrySimulator {
  private static activeScenarios: Map<string, InjectedLeakScenario> = new Map();
  private static simulationInterval: NodeJS.Timeout | null = null;
  private static onTelemetryTickCallback: ((packet: any) => void) | null = null;

  /**
   * Initializes historical telemetry cache (past 24 hours at 15-minute intervals)
   */
  public static seedHistoricalTelemetry() {
    const now = Date.now();
    const records: ConsumptionRecord[] = [];
    const intervalMinutes = SC.historical_interval_minutes; // ORIGINAL: 15
    const intervals = (SC.historical_hours /* ORIGINAL: 24 */ * 60) / intervalMinutes; // 96 data points

    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalMinutes * 60 * 1000);
      const hour = timestamp.getHours() + (timestamp.getMinutes() / 60);
      const diurnalMultiplier = AnomalyEngine.getDiurnalMultiplier(hour);

      for (const zone of DataStore.zones) {
        const zoneSensors = DataStore.sensors.filter(s => s.zone_id === zone.zone_id);
        
        for (const sensor of zoneSensors) {
          const noiseFlow = (Math.random() - 0.5) * (zone.base_demand_m3_h * SC.noise_flow_factor_historical /* ORIGINAL: 0.06 */);
          const noisePressure = (Math.random() - 0.5) * SC.noise_pressure_factor_historical /* ORIGINAL: 0.15 */;

          let flow = (zone.base_demand_m3_h * diurnalMultiplier) + noiseFlow;
          let pressure = zone.target_pressure_bar + noisePressure;

          // Injected history for Central Zone (burst that started 45 mins ago)
          // ORIGINAL: if (zone.zone_id === 'zone-central' && i <= 3) { flow += 78.0; pressure -= 1.05; }
          const centralHistory = SC.injected_history['zone-central'];
          if (zone.zone_id === 'zone-central' && i <= centralHistory.active_intervals) {
            flow += centralHistory.flow_boost;
            pressure -= centralHistory.pressure_drop;
          }

          // Injected history for East Zone (slow leak for past 2 hours)
          // ORIGINAL: if (zone.zone_id === 'zone-east' && i <= 8) { flow += 33.5; pressure -= 0.35; }
          const eastHistory = SC.injected_history['zone-east'];
          if (zone.zone_id === 'zone-east' && i <= eastHistory.active_intervals) {
            flow += eastHistory.flow_boost;
            pressure -= eastHistory.pressure_drop;
          }

          records.push({
            record_id: `rec-${timestamp.getTime()}-${sensor.sensor_id}`,
            sensor_id: sensor.sensor_id,
            zone_id: zone.zone_id,
            timestamp: timestamp.toISOString(),
            flow_value: Number(Math.max(1, flow).toFixed(2)),
            pressure_value: Number(Math.max(0.5, pressure).toFixed(2)),
            // ORIGINAL: raw_status: (flow > zone.base_demand_m3_h * 1.3) ? 'anomalous' : 'normal'
            raw_status: (flow > zone.base_demand_m3_h * SC.anomalous_flow_threshold_multiplier) ? 'anomalous' : 'normal'
          });
        }
      }
    }

    DataStore.consumptionHistory = records;
  }

  /**
   * Generates a single real-time telemetry frame for all sensors
   */
  public static generateRealtimeFrame(): {
    timestamp: string;
    readings: Array<{ sensor_id: string; zone_id: string; type: string; value: number; unit: string }>;
    newAnomalies: AnomalyEvent[];
    newTickets: MaintenanceTicket[];
  } {
    const timestamp = new Date().toISOString();
    const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
    const diurnalMultiplier = AnomalyEngine.getDiurnalMultiplier(currentHour);

    const readings: Array<{ sensor_id: string; zone_id: string; type: string; value: number; unit: string }> = [];
    const newAnomalies: AnomalyEvent[] = [];
    const newTickets: MaintenanceTicket[] = [];

    for (const zone of DataStore.zones) {
      const zoneSensors = DataStore.sensors.filter(s => s.zone_id === zone.zone_id);
      const config = DataStore.zoneSensitivityConfigs[zone.zone_id] || {
        zone_id: zone.zone_id,
        /* ORIGINAL HARDCODED FALLBACK: z_score_threshold: 2.5, rolling_window_minutes: 30, min_flow_deviation_pct: 15.0, night_flow_multiplier: 1.25, auto_ticket_threshold: 75.0 */
        ...defaultSensitivityConfig
      };

      // Check if this zone has an active injected leak scenario
      const scenario = this.activeScenarios.get(zone.zone_id);
      let injectedFlowBoost = 0;
      let injectedPressureDrop = 0;
      if (scenario && scenario.active) {
        injectedFlowBoost = scenario.flow_increase_m3_h;
        injectedPressureDrop = scenario.pressure_drop_bar;
      }

      // Existing persistent anomalies
      // ORIGINAL: if (zone.zone_id === 'zone-central') { injectedFlowBoost += 75.0; injectedPressureDrop += 1.05; }
      const centralPersistent = SC.persistent_anomalies['zone-central'];
      if (zone.zone_id === 'zone-central') {
        injectedFlowBoost += centralPersistent.flow_boost;
        injectedPressureDrop += centralPersistent.pressure_drop;
      }
      // ORIGINAL: else if (zone.zone_id === 'zone-east') { injectedFlowBoost += 33.0; injectedPressureDrop += 0.35; }
      const eastPersistent = SC.persistent_anomalies['zone-east'];
      if (zone.zone_id === 'zone-east') {
        injectedFlowBoost += eastPersistent.flow_boost;
        injectedPressureDrop += eastPersistent.pressure_drop;
      }

      let currentZoneFlow = 0;
      let currentZonePressure = 0;

      for (const sensor of zoneSensors) {
        const noiseFlow = (Math.random() - 0.5) * (zone.base_demand_m3_h * SC.noise_flow_factor_realtime /* ORIGINAL: 0.05 */);
        const noisePressure = (Math.random() - 0.5) * SC.noise_pressure_factor_realtime /* ORIGINAL: 0.12 */;

        let flow = (zone.base_demand_m3_h * diurnalMultiplier) + noiseFlow + (sensor.type === 'flow' ? injectedFlowBoost : 0);
        let pressure = zone.target_pressure_bar + noisePressure - (sensor.type === 'pressure' ? injectedPressureDrop : 0);

        flow = Math.max(SC.min_flow_floor /* ORIGINAL: 2.0 */, flow);
        pressure = Math.max(SC.min_pressure_floor /* ORIGINAL: 0.4 */, pressure);

        sensor.current_reading = Number((sensor.type === 'flow' ? flow : pressure).toFixed(2));
        sensor.last_ping = timestamp;

        if (sensor.type === 'flow') currentZoneFlow = sensor.current_reading;
        if (sensor.type === 'pressure') currentZonePressure = sensor.current_reading;

        readings.push({
          sensor_id: sensor.sensor_id,
          zone_id: zone.zone_id,
          type: sensor.type,
          value: sensor.current_reading,
          unit: sensor.unit
        });

        // Store in rolling consumption history
        const record: ConsumptionRecord = {
          record_id: `rec-${Date.now()}-${sensor.sensor_id}`,
          sensor_id: sensor.sensor_id,
          zone_id: zone.zone_id,
          timestamp,
          flow_value: flow,
          pressure_value: pressure
        };

        DataStore.consumptionHistory.push(record);
        if (DataStore.consumptionHistory.length > SC.consumption_buffer_max /* ORIGINAL: 800 */) {
          DataStore.consumptionHistory.shift();
        }

        // Run Anomaly Detection Engine evaluation
        const recentHistory = DataStore.consumptionHistory.filter(r => r.sensor_id === sensor.sensor_id).slice(-SC.recent_history_slice_size /* ORIGINAL: 15 */);
        const evalResult = AnomalyEngine.evaluateRecord(
          { flow_value: flow, pressure_value: pressure, timestamp },
          recentHistory,
          zone,
          sensor,
          config
        );

        if (evalResult.isAnomaly && evalResult.event) {
          // Check if an open anomaly of same type already exists for this sensor
          const existing = DataStore.anomalyEvents.find(
            e => e.sensor_id === sensor.sensor_id && e.status === 'open' && e.type === evalResult.type
          );

          if (!existing) {
            const anomaly = evalResult.event;
            DataStore.anomalyEvents.unshift(anomaly);
            newAnomalies.push(anomaly);

            // Cross-reference with citizen reports in the same zone
            const matchingCitizenReports = DataStore.citizenReports.filter(
              r => r.zone_id === zone.zone_id && r.status === 'pending'
            );

            let hasCitizenMatch = matchingCitizenReports.length > 0;
            if (hasCitizenMatch) {
              anomaly.has_cross_referenced_citizen_report = true;
              anomaly.linked_report_ids = matchingCitizenReports.map(r => r.report_id);
              matchingCitizenReports.forEach(r => {
                r.status = 'linked_to_ticket';
                r.linked_anomaly_id = anomaly.event_id;
                r.cross_referenced_with_sensor = true;
              });
            }

            // Calculate Priority Score
            const priorityResult = PriorityRankingEngine.calculatePriority(anomaly, zone, hasCitizenMatch);

            // If priority score exceeds auto-ticket threshold or critical, create maintenance ticket automatically
            if (priorityResult.priorityScore >= config.auto_ticket_threshold || anomaly.severity === 'critical') {
              const ticketId = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
              anomaly.status = 'ticket_created';
              anomaly.linked_ticket_id = ticketId;

              const ticket: MaintenanceTicket = {
                ticket_id: ticketId,
                source: hasCitizenMatch ? 'hybrid_cross_verified' : 'sensor',
                linked_anomaly_id: anomaly.event_id,
                linked_report_id: matchingCitizenReports[0]?.report_id || null,
                zone_id: zone.zone_id,
                zone_name: zone.name,
                pipe_id: anomaly.pipe_id || null,
                location: sensor.location,
                priority_score: priorityResult.priorityScore,
                priority_breakdown: priorityResult.breakdown,
                severity: anomaly.severity,
                estimated_loss_m3: Number((anomaly.estimated_loss_rate_m3_h * SC.estimated_loss_duration_hours /* ORIGINAL: 2.0 */).toFixed(1)),
                status: 'reported',
                assigned_to: 'Auto-Dispatch Queue (Pending Assignee)',
                notes: `Auto-generated ticket: ${anomaly.type} flagged with Priority Score ${priorityResult.priorityScore}. Recommended SLA response within ${priorityResult.recommendedResponseTimeHours} hours.`,
                created_at: timestamp
              };

              DataStore.maintenanceTickets.unshift(ticket);
              newTickets.push(ticket);
            }
          }
        }
      }

      // Update zone live metrics
      if (currentZoneFlow > 0) zone.current_flow_m3_h = Number(currentZoneFlow.toFixed(1));
      if (currentZonePressure > 0) zone.current_pressure_bar = Number(currentZonePressure.toFixed(2));
      
      const zoneLossSummary = LossEstimationEngine.computeZoneLossSummary(zone, DataStore.anomalyEvents);
      zone.nrw_rate_pct = zoneLossSummary.nrw_rate_pct;
      zone.water_loss_last_24h_m3 = zoneLossSummary.total_loss_24h_m3;
      zone.active_anomalies_count = zoneLossSummary.active_leak_count;
    }

    return {
      timestamp,
      readings,
      newAnomalies,
      newTickets
    };
  }

  /**
   * Injects a deliberate leak scenario for live hackathon / judge demos
   */
  public static injectScenario(
    zoneId: string,
    type: AnomalyType = 'Sudden Pipe Burst',
    severity: AnomalySeverity = 'critical',
    flowIncrease: number = SC.default_inject_flow_m3_h /* ORIGINAL: 85.0 */,
    pressureDrop: number = SC.default_inject_pressure_drop_bar /* ORIGINAL: 1.40 */
  ): InjectedLeakScenario {
    const zone = DataStore.zones.find(z => z.zone_id === zoneId);
    const scenario: InjectedLeakScenario = {
      zone_id: zoneId,
      type,
      severity,
      flow_increase_m3_h: flowIncrease,
      pressure_drop_bar: pressureDrop,
      description: `Injected ${type} scenario in ${zone?.name || zoneId}`,
      active: true,
      injected_at: new Date().toISOString()
    };

    this.activeScenarios.set(zoneId, scenario);

    // Immediately trigger a frame calculation to produce the anomaly & ticket
    this.generateRealtimeFrame();

    return scenario;
  }

  /**
   * Clears an active injected leak scenario
   */
  public static clearScenario(zoneId: string) {
    this.activeScenarios.delete(zoneId);
  }

  /**
   * Returns list of currently active simulated scenarios
   */
  public static getActiveScenarios(): InjectedLeakScenario[] {
    return Array.from(this.activeScenarios.values());
  }

  /**
   * Starts periodic simulation loop (every 5 seconds)
   */
  public static startSimulationLoop(onTick?: (packet: any) => void) {
    if (onTick) this.onTelemetryTickCallback = onTick;
    if (this.simulationInterval) return;

    this.seedHistoricalTelemetry();

    this.simulationInterval = setInterval(() => {
      const frame = this.generateRealtimeFrame();
      if (this.onTelemetryTickCallback) {
        this.onTelemetryTickCallback(frame);
      }
    }, SC.simulation_tick_interval_ms /* ORIGINAL: 4000 */);
  }

  public static stopSimulationLoop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}
