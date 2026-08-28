/**
 * AquaWatch API - Sensor Telemetry Ingestion & Live Simulator Controls
 */

import { Router } from 'express';
import { AnomalyEngine } from '../core/anomaly_engine';
import { WebSocketManager } from '../core/websocket_manager';
import { DataStore } from '../db/in_memory_store';
import { TelemetrySimulator } from '../simulator/data_generator';
import { ConsumptionRecord } from '../../src/types';

const router = Router();

// Ingest sensor readings from external IoT gateways
router.post('/telemetry', (req, res) => {
  const { sensor_id, flow_value, pressure_value, timestamp } = req.body;
  if (!sensor_id) {
    return res.status(400).json({ error: 'sensor_id is required' });
  }

  const sensor = DataStore.sensors.find(s => s.sensor_id === sensor_id);
  if (!sensor) {
    return res.status(404).json({ error: 'Sensor not found' });
  }

  const zone = DataStore.zones.find(z => z.zone_id === sensor.zone_id);
  if (!zone) {
    return res.status(404).json({ error: 'Associated zone not found' });
  }

  const ts = timestamp || new Date().toISOString();
  const flow = Number(flow_value) || sensor.current_reading;
  const pressure = Number(pressure_value) || 3.5;

  sensor.current_reading = sensor.type === 'flow' ? flow : pressure;
  sensor.last_ping = ts;

  const record: ConsumptionRecord = {
    record_id: `rec-${Date.now()}-${sensor.sensor_id}`,
    sensor_id,
    zone_id: zone.zone_id,
    timestamp: ts,
    flow_value: flow,
    pressure_value: pressure
  };

  DataStore.consumptionHistory.push(record);

  // Evaluate for anomaly
  const config = DataStore.zoneSensitivityConfigs[zone.zone_id] || {
    zone_id: zone.zone_id,
    z_score_threshold: 2.5,
    rolling_window_minutes: 30,
    min_flow_deviation_pct: 15.0,
    night_flow_multiplier: 1.25,
    auto_ticket_threshold: 75.0
  };

  const recentHistory = DataStore.consumptionHistory.filter(r => r.sensor_id === sensor_id).slice(-15);
  const evalResult = AnomalyEngine.evaluateRecord(
    { flow_value: flow, pressure_value: pressure, timestamp: ts },
    recentHistory,
    zone,
    sensor,
    config
  );

  if (evalResult.isAnomaly && evalResult.event) {
    DataStore.anomalyEvents.unshift(evalResult.event);
    WebSocketManager.broadcast({
      type: 'ANOMALY_DETECTED',
      timestamp: ts,
      data: evalResult.event
    });
  }

  res.status(200).json({
    success: true,
    sensor,
    anomaly_detected: evalResult.isAnomaly,
    z_score_flow: evalResult.zScoreFlow,
    z_score_pressure: evalResult.zScorePressure
  });
});

// Simulator Control: Inject a deliberate leak event for interactive demo
router.post('/simulator/inject', (req, res) => {
  const { zone_id, type, severity, flow_increase_m3_h, pressure_drop_bar } = req.body;
  const targetZoneId = zone_id || 'zone-north';

  const scenario = TelemetrySimulator.injectScenario(
    targetZoneId,
    type || 'Sudden Pipe Burst',
    severity || 'critical',
    Number(flow_increase_m3_h) || 85.0,
    Number(pressure_drop_bar) || 1.35
  );

  // Broadcast to all connected clients
  WebSocketManager.broadcast({
    type: 'SIMULATOR_STATE',
    timestamp: new Date().toISOString(),
    data: {
      action: 'INJECTED',
      scenario,
      active_scenarios: TelemetrySimulator.getActiveScenarios()
    }
  });

  res.json({
    success: true,
    scenario,
    message: `Injected ${scenario.type} in ${targetZoneId}. Anomaly engine and auto-dispatch triggered.`
  });
});

// Simulator Control: Clear scenario for a zone
router.post('/simulator/clear', (req, res) => {
  const { zone_id } = req.body;
  if (zone_id) {
    TelemetrySimulator.clearScenario(zone_id);
  }
  res.json({
    success: true,
    active_scenarios: TelemetrySimulator.getActiveScenarios()
  });
});

// Simulator Status
router.get('/simulator/status', (req, res) => {
  res.json({
    active_scenarios: TelemetrySimulator.getActiveScenarios(),
    connected_clients: WebSocketManager.getActiveClientCount()
  });
});

// System Citywide KPI Summary
router.get('/stats/summary', (req, res) => {
  res.json(DataStore.getCitySummary());
});

export default router;
