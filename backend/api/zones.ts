/**
 * AquaWatch API - Zones, Pipes, and Sensors GIS Management
 */

import { Router } from 'express';
import { LossEstimationEngine } from '../core/loss_estimation';
import { DataStore } from '../db/in_memory_store';

const router = Router();

// List all zones with live calculated statistics
router.get('/', (req, res) => {
  const enrichedZones = DataStore.zones.map(zone => {
    const summary = LossEstimationEngine.computeZoneLossSummary(zone, DataStore.anomalyEvents);
    return {
      ...zone,
      nrw_rate_pct: summary.nrw_rate_pct,
      water_loss_last_24h_m3: summary.total_loss_24h_m3,
      financial_loss_24h_usd: summary.financial_loss_24h_usd,
      active_anomalies_count: summary.active_leak_count,
      loss_intensity_m3_per_km: summary.loss_intensity_m3_per_km,
      sensitivity_config: DataStore.zoneSensitivityConfigs[zone.zone_id]
    };
  });
  res.json(enrichedZones);
});

// Single zone details with pipeline network & sensors
router.get('/:zone_id', (req, res) => {
  const { zone_id } = req.params;
  const zone = DataStore.zones.find(z => z.zone_id === zone_id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found' });
  }

  const pipes = DataStore.pipeSegments.filter(p => p.zone_id === zone_id);
  const sensors = DataStore.sensors.filter(s => s.zone_id === zone_id);
  const anomalies = DataStore.anomalyEvents.filter(a => a.zone_id === zone_id);
  const tickets = DataStore.maintenanceTickets.filter(t => t.zone_id === zone_id);
  const history = DataStore.consumptionHistory.filter(h => h.zone_id === zone_id).slice(-96);
  const config = DataStore.zoneSensitivityConfigs[zone_id];

  res.json({
    zone,
    pipes,
    sensors,
    anomalies,
    tickets,
    history,
    sensitivity_config: config
  });
});

// Update sensitivity threshold for zone
router.put('/:zone_id/sensitivity', (req, res) => {
  const { zone_id } = req.params;
  const { z_score_threshold, rolling_window_minutes, min_flow_deviation_pct, night_flow_multiplier, auto_ticket_threshold } = req.body;
  
  if (!DataStore.zoneSensitivityConfigs[zone_id]) {
    DataStore.zoneSensitivityConfigs[zone_id] = {
      zone_id,
      z_score_threshold: 2.5,
      rolling_window_minutes: 30,
      min_flow_deviation_pct: 15.0,
      night_flow_multiplier: 1.25,
      auto_ticket_threshold: 75.0
    };
  }

  const current = DataStore.zoneSensitivityConfigs[zone_id];
  if (z_score_threshold !== undefined) current.z_score_threshold = Number(z_score_threshold);
  if (rolling_window_minutes !== undefined) current.rolling_window_minutes = Number(rolling_window_minutes);
  if (min_flow_deviation_pct !== undefined) current.min_flow_deviation_pct = Number(min_flow_deviation_pct);
  if (night_flow_multiplier !== undefined) current.night_flow_multiplier = Number(night_flow_multiplier);
  if (auto_ticket_threshold !== undefined) current.auto_ticket_threshold = Number(auto_ticket_threshold);

  res.json({ success: true, config: current });
});

// Get all pipeline segments with GIS coordinates
router.get('/network/pipes', (req, res) => {
  res.json(DataStore.pipeSegments);
});

// Add new pipeline segment
router.post('/network/pipes', (req, res) => {
  const { zone_id, material, install_year, diameter_mm, nominal_pressure_bar, condition_score, path_coordinates } = req.body;
  const newPipe = {
    pipe_id: `pipe-custom-${Date.now().toString().slice(-4)}`,
    zone_id: zone_id || 'zone-central',
    material: material || 'Ductile Iron',
    install_year: Number(install_year) || new Date().getFullYear(),
    diameter_mm: Number(diameter_mm) || 200,
    nominal_pressure_bar: Number(nominal_pressure_bar) || 3.8,
    condition_score: Number(condition_score) || 8.0,
    has_active_leak: false,
    leak_count_historical: 0,
    path_coordinates: path_coordinates || []
  };
  DataStore.pipeSegments.push(newPipe);
  res.status(201).json(newPipe);
});

// Get all sensors
router.get('/network/sensors', (req, res) => {
  res.json(DataStore.sensors);
});

// Add new sensor
router.post('/network/sensors', (req, res) => {
  const { zone_id, pipe_id, type, location, sampling_rate_sec } = req.body;
  const newSensor = {
    sensor_id: `SEN-${type === 'pressure' ? 'PR' : 'FL'}-${Math.floor(10 + Math.random() * 90)}`,
    zone_id: zone_id || 'zone-central',
    pipe_id: pipe_id || undefined,
    type: type || 'flow',
    location: location || { lat: 37.785, lng: -122.41 },
    status: 'active' as const,
    battery_pct: 100,
    sampling_rate_sec: Number(sampling_rate_sec) || 5,
    last_ping: new Date().toISOString(),
    current_reading: type === 'pressure' ? 3.5 : 120.0,
    unit: type === 'pressure' ? 'bar' : 'm³/h'
  };
  DataStore.sensors.push(newSensor);
  res.status(201).json(newSensor);
});

export default router;
