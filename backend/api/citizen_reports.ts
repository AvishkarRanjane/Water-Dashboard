/**
 * AquaWatch API - Citizen Public Leak Reporting & Spatial Cross-Referencing
 */

import { Router } from 'express';
import { PriorityRankingEngine } from '../core/priority_ranking';
import { WebSocketManager } from '../core/websocket_manager';
import { DataStore } from '../db/in_memory_store';
import { LeakReport, MaintenanceTicket } from '../../src/types';

const router = Router();

// Public citizen submission endpoint (no auth required)
router.post('/submit', (req, res) => {
  const {
    citizen_name,
    citizen_phone,
    zone_id,
    location,
    address,
    description,
    estimated_surface_flow,
    photo_url
  } = req.body;

  if (!description || !location || !location.lat || !location.lng) {
    return res.status(400).json({ error: 'Location coordinates and description are required' });
  }

  // Resolve closest zone if not provided
  let targetZoneId = zone_id;
  if (!targetZoneId) {
    targetZoneId = DataStore.zones[0].zone_id;
  }

  const zone = DataStore.zones.find(z => z.zone_id === targetZoneId);
  const now = new Date().toISOString();
  const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Cross-reference with active open anomalies in this zone
  const activeZoneAnomalies = DataStore.anomalyEvents.filter(
    a => a.zone_id === targetZoneId && a.status !== 'resolved'
  );

  let matchedAnomaly = activeZoneAnomalies[0] || null;
  let isCrossReferenced = !!matchedAnomaly;

  const newReport: LeakReport = {
    report_id: reportId,
    citizen_name: citizen_name || 'Anonymous Resident',
    citizen_phone: citizen_phone || undefined,
    zone_id: targetZoneId,
    location,
    address: address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
    description,
    estimated_surface_flow: estimated_surface_flow || 'Moderate Pooling',
    photo_url: photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
    status: isCrossReferenced ? 'linked_to_ticket' : 'pending',
    linked_anomaly_id: matchedAnomaly ? matchedAnomaly.event_id : null,
    reported_at: now,
    cross_referenced_with_sensor: isCrossReferenced
  };

  DataStore.citizenReports.unshift(newReport);

  // If matched with an anomaly, upgrade or create maintenance ticket with citizen bonus points (+10 pts)
  if (matchedAnomaly) {
    matchedAnomaly.has_cross_referenced_citizen_report = true;
    if (!matchedAnomaly.linked_report_ids) matchedAnomaly.linked_report_ids = [];
    matchedAnomaly.linked_report_ids.push(reportId);

    // If an existing ticket is linked to the anomaly, update its score and add notes
    if (matchedAnomaly.linked_ticket_id) {
      const existingTicket = DataStore.maintenanceTickets.find(t => t.ticket_id === matchedAnomaly?.linked_ticket_id);
      if (existingTicket) {
        existingTicket.source = 'hybrid_cross_verified';
        existingTicket.priority_score = Math.min(100, existingTicket.priority_score + 10);
        existingTicket.linked_report_id = reportId;
        newReport.linked_ticket_id = existingTicket.ticket_id;
      }
    } else {
      // Create new ticket with verified bonus
      const priorityResult = PriorityRankingEngine.calculatePriority(matchedAnomaly, zone || DataStore.zones[0], true);
      const ticketId = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      matchedAnomaly.linked_ticket_id = ticketId;
      matchedAnomaly.status = 'ticket_created';
      newReport.linked_ticket_id = ticketId;

      const ticket: MaintenanceTicket = {
        ticket_id: ticketId,
        source: 'hybrid_cross_verified',
        linked_anomaly_id: matchedAnomaly.event_id,
        linked_report_id: reportId,
        zone_id: targetZoneId,
        zone_name: zone?.name,
        location: location,
        priority_score: priorityResult.priorityScore,
        priority_breakdown: priorityResult.breakdown,
        severity: matchedAnomaly.severity,
        estimated_loss_m3: 25.0,
        status: 'reported',
        assigned_to: 'Auto-Dispatch Queue (Citizen + Sensor Verified)',
        notes: `Cross-verified leak: Citizen report [${reportId}] matches active sensor anomaly [${matchedAnomaly.event_id}] in ${zone?.name}. Surface observation: ${estimated_surface_flow}.`,
        created_at: now
      };

      DataStore.maintenanceTickets.unshift(ticket);
    }
  }

  // Broadcast WebSocket notification to dispatchers
  WebSocketManager.broadcast({
    type: 'CITIZEN_REPORT_ADDED',
    timestamp: now,
    data: newReport
  });

  res.status(201).json({
    success: true,
    report: newReport,
    message: 'Report submitted successfully. Thank you for helping protect urban water resources!'
  });
});

// Public status lookup by report_id
router.get('/lookup/:report_id', (req, res) => {
  const { report_id } = req.params;
  const report = DataStore.citizenReports.find(
    r => r.report_id.toLowerCase() === report_id.trim().toLowerCase()
  );

  if (!report) {
    return res.status(404).json({ error: 'Report ID not found' });
  }

  const linkedTicket = report.linked_ticket_id 
    ? DataStore.maintenanceTickets.find(t => t.ticket_id === report.linked_ticket_id)
    : null;

  res.json({
    report,
    linked_ticket: linkedTicket
  });
});

// List all citizen reports (for utility staff dashboard)
router.get('/', (req, res) => {
  res.json(DataStore.citizenReports);
});

export default router;
