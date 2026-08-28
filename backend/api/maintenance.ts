/**
 * AquaWatch API - Maintenance Dispatch & Leak Priority Queue
 */

import { Router } from 'express';
import { WebSocketManager } from '../core/websocket_manager';
import { DataStore } from '../db/in_memory_store';

const router = Router();

// Get all maintenance tickets sorted by priority_score descending
router.get('/', (req, res) => {
  const { status, zone_id, sort_by } = req.query;
  let tickets = [...DataStore.maintenanceTickets];

  if (status) {
    tickets = tickets.filter(t => t.status === status);
  }
  if (zone_id) {
    tickets = tickets.filter(t => t.zone_id === zone_id);
  }

  // Default sorting: priority_score descending
  tickets.sort((a, b) => b.priority_score - a.priority_score);

  res.json(tickets);
});

// Get single ticket
router.get('/:ticket_id', (req, res) => {
  const { ticket_id } = req.params;
  const ticket = DataStore.maintenanceTickets.find(t => t.ticket_id === ticket_id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // Fetch linked anomaly and report if any
  const linkedAnomaly = ticket.linked_anomaly_id 
    ? DataStore.anomalyEvents.find(a => a.event_id === ticket.linked_anomaly_id)
    : null;
  const linkedReport = ticket.linked_report_id
    ? DataStore.citizenReports.find(r => r.report_id === ticket.linked_report_id)
    : null;

  res.json({
    ticket,
    linked_anomaly: linkedAnomaly,
    linked_report: linkedReport
  });
});

// Update ticket status or assign technician
router.patch('/:ticket_id', (req, res) => {
  const { ticket_id } = req.params;
  const { status, assigned_to, notes, resolution_summary } = req.body;
  const ticket = DataStore.maintenanceTickets.find(t => t.ticket_id === ticket_id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const now = new Date().toISOString();

  if (assigned_to !== undefined) {
    ticket.assigned_to = assigned_to;
    if (ticket.status === 'reported' && assigned_to) {
      ticket.status = 'assigned';
      ticket.assigned_at = now;
    }
  }

  if (status) {
    ticket.status = status;
    if (status === 'assigned' && !ticket.assigned_at) ticket.assigned_at = now;
    if (status === 'in_progress' && !ticket.in_progress_at) ticket.in_progress_at = now;
    if (status === 'verified_fixed') {
      ticket.resolved_at = now;
      if (resolution_summary) ticket.resolution_summary = resolution_summary;
      
      // Also mark linked anomaly as resolved
      if (ticket.linked_anomaly_id) {
        const anomaly = DataStore.anomalyEvents.find(a => a.event_id === ticket.linked_anomaly_id);
        if (anomaly) {
          anomaly.status = 'resolved';
          anomaly.resolved_at = now;
        }
      }

      // Also mark linked citizen report as verified / resolved
      if (ticket.linked_report_id) {
        const report = DataStore.citizenReports.find(r => r.report_id === ticket.linked_report_id);
        if (report) {
          report.status = 'verified';
        }
      }
    }
  }

  if (notes) ticket.notes = notes;

  // Broadcast WebSocket event for real-time dashboard reactivity
  WebSocketManager.broadcast({
    type: 'TICKET_UPDATED',
    timestamp: now,
    data: ticket
  });

  res.json(ticket);
});

// Create manual ticket
router.post('/', (req, res) => {
  const { zone_id, pipe_id, severity, notes, assigned_to, source } = req.body;
  const zone = DataStore.zones.find(z => z.zone_id === zone_id);
  const now = new Date().toISOString();

  const ticketId = `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  let baseScore = 50;
  if (severity === 'critical') baseScore = 90;
  else if (severity === 'high') baseScore = 75;
  else if (severity === 'low') baseScore = 30;

  const newTicket = {
    ticket_id: ticketId,
    source: source || 'sensor',
    zone_id: zone_id || 'zone-central',
    zone_name: zone?.name || 'Central Zone',
    pipe_id: pipe_id || null,
    priority_score: baseScore,
    severity: severity || 'medium',
    estimated_loss_m3: 15.0,
    status: (assigned_to ? 'assigned' : 'reported') as any,
    assigned_to: assigned_to || null,
    notes: notes || 'Manually created ticket',
    created_at: now,
    assigned_at: assigned_to ? now : null
  };

  DataStore.maintenanceTickets.unshift(newTicket);

  WebSocketManager.broadcast({
    type: 'TICKET_UPDATED',
    timestamp: now,
    data: newTicket
  });

  res.status(201).json(newTicket);
});

export default router;
