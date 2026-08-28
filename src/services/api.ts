/**
 * AquaWatch Frontend API Client Service
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

export const API = {
  // System summary stats
  async getCitySummary(): Promise<CitySummaryStats> {
    const res = await fetch('/api/stats/summary');
    return res.json();
  },

  // Auth / Users
  async getCurrentUser(): Promise<{ user: User; available_users: User[] }> {
    const res = await fetch('/api/auth/me');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    return res.json();
  },

  async switchUser(user_id: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return res.json();
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // Zones & Network
  async getZones(): Promise<Zone[]> {
    const res = await fetch('/api/zones');
    return res.json();
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
    const res = await fetch(`/api/zones/${zone_id}`);
    return res.json();
  },

  async updateZoneSensitivity(zone_id: string, config: Partial<ZoneSensitivityConfig>): Promise<any> {
    const res = await fetch(`/api/zones/${zone_id}/sensitivity`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async getPipes(): Promise<PipeSegment[]> {
    const res = await fetch('/api/zones/network/pipes');
    return res.json();
  },

  async getSensors(): Promise<Sensor[]> {
    const res = await fetch('/api/zones/network/sensors');
    return res.json();
  },

  async createSensor(sensorData: Partial<Sensor>): Promise<Sensor> {
    const res = await fetch('/api/zones/network/sensors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensorData)
    });
    return res.json();
  },

  // Anomalies
  async getAnomalies(params?: { zone_id?: string; severity?: string; status?: string }): Promise<AnomalyEvent[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/anomalies${query ? `?${query}` : ''}`);
    return res.json();
  },

  async updateAnomalyStatus(event_id: string, status: string): Promise<AnomalyEvent> {
    const res = await fetch(`/api/anomalies/${event_id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Maintenance Tickets
  async getMaintenanceTickets(params?: { status?: string; zone_id?: string }): Promise<MaintenanceTicket[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/maintenance${query ? `?${query}` : ''}`);
    return res.json();
  },

  async updateMaintenanceTicket(ticket_id: string, update: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    const res = await fetch(`/api/maintenance/${ticket_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    return res.json();
  },

  async createMaintenanceTicket(data: any): Promise<MaintenanceTicket> {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Citizen Reports
  async submitCitizenReport(data: any): Promise<{ success: boolean; report: LeakReport; message: string }> {
    const res = await fetch('/api/citizen-reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async lookupCitizenReport(report_id: string): Promise<{ report: LeakReport; linked_ticket?: MaintenanceTicket }> {
    const res = await fetch(`/api/citizen-reports/lookup/${report_id}`);
    if (!res.ok) {
      throw new Error('Report not found');
    }
    return res.json();
  },

  async getCitizenReportById(report_id: string): Promise<LeakReport> {
    const res = await fetch(`/api/citizen-reports/lookup/${report_id}`);
    if (!res.ok) {
      throw new Error('Report not found');
    }
    const data = await res.json();
    return data.report || data;
  },

  async getCitizenReports(): Promise<LeakReport[]> {
    const res = await fetch('/api/citizen-reports');
    return res.json();
  },

  // Simulator controls
  async injectLeak(data: {
    zone_id: string;
    type?: string;
    severity?: string;
    flow_increase_m3_h?: number;
    pressure_drop_bar?: number;
  }): Promise<any> {
    const res = await fetch('/api/simulator/inject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async clearLeak(zone_id: string): Promise<any> {
    const res = await fetch('/api/simulator/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone_id })
    });
    return res.json();
  },

  async getSimulatorStatus(): Promise<any> {
    const res = await fetch('/api/simulator/status');
    return res.json();
  }
};
