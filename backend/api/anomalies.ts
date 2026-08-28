/**
 * AquaWatch API - Anomaly Events & Statistical Flags
 */

import { Router } from 'express';
import { DataStore } from '../db/in_memory_store';

const router = Router();

// List all anomaly events (with optional filtering by zone or status)
router.get('/', (req, res) => {
  const { zone_id, severity, status } = req.query;
  let results = [...DataStore.anomalyEvents];

  if (zone_id) {
    results = results.filter(a => a.zone_id === zone_id);
  }
  if (severity) {
    results = results.filter(a => a.severity === severity);
  }
  if (status) {
    results = results.filter(a => a.status === status);
  }

  res.json(results);
});

// Get single anomaly
router.get('/:event_id', (req, res) => {
  const { event_id } = req.params;
  const anomaly = DataStore.anomalyEvents.find(a => a.event_id === event_id);
  if (!anomaly) {
    return res.status(404).json({ error: 'Anomaly event not found' });
  }
  res.json(anomaly);
});

// Update anomaly status (e.g. mark investigating, resolved, false_positive)
router.patch('/:event_id/status', (req, res) => {
  const { event_id } = req.params;
  const { status } = req.body;
  const anomaly = DataStore.anomalyEvents.find(a => a.event_id === event_id);
  if (!anomaly) {
    return res.status(404).json({ error: 'Anomaly event not found' });
  }

  anomaly.status = status;
  if (status === 'resolved') {
    anomaly.resolved_at = new Date().toISOString();
  }

  res.json(anomaly);
});

export default router;
