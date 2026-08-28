/**
 * AquaWatch - Maintenance & Dispatch Workflow Page (Professional Polish)
 * Multi-factor priority queue, 4-stage status timeline, technician dispatch,
 * and citizen report cross-referencing against sensor-flagged zones.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Hammer,
  Layers,
  MapPin,
  MessageSquare,
  Plus,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  Wrench
} from 'lucide-react';
import { PriorityQueue } from '../components/PriorityQueue';
import { StatusTimeline } from '../components/StatusTimeline';
import { LeakReport, MaintenanceTicket, Zone } from '../types';
import { API } from '../services/api';

interface MaintenanceProps {
  tickets: MaintenanceTicket[];
  citizenReports: LeakReport[];
  zones: Zone[];
  onRefreshData: () => void;
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  tickets,
  citizenReports,
  zones,
  onRefreshData
}) => {
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(
    tickets[0] || null
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'citizen_reports'>('queue');

  // New ticket state
  const [newZoneId, setNewZoneId] = useState<string>('zone-central');
  const [newSeverity, setNewSeverity] = useState<string>('high');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newAssignee, setNewAssignee] = useState<string>('Crew Delta-4');

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      const updated = await API.updateMaintenanceTicket(ticketId, { status: status as any });
      if (selectedTicket?.ticket_id === ticketId) {
        setSelectedTicket(updated);
      }
      onRefreshData();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.createMaintenanceTicket({
        zone_id: newZoneId,
        severity: newSeverity,
        notes: newNotes,
        assigned_to: newAssignee,
        source: 'sensor'
      });
      setShowCreateModal(false);
      setNewNotes('');
      onRefreshData();
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Summary & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Emergency Leak Dispatch & Maintenance Operations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective priority scoring, technician task progression, and citizen cross-verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'queue' 
                  ? 'bg-white text-slate-900 font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Priority Queue ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('citizen_reports')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'citizen_reports' 
                  ? 'bg-white text-slate-900 font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Reports ({citizenReports.length})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Selected Ticket Active Lifecycle Timeline (If any ticket selected) */}
      {selectedTicket && (
        <div className="space-y-2">
          <StatusTimeline ticket={selectedTicket} />
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'queue' ? (
        <div className="grid grid-cols-1 gap-6">
          <PriorityQueue
            tickets={tickets}
            onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            onUpdateStatus={handleStatusUpdate}
          />
        </div>
      ) : (
        /* Citizen Reports Cross-Referencing Table */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Citizen Public Leak Reports & Spatial Sensor Correlation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical citizen reports automatically cross-referenced with acoustic/flow telemetry in the same DMA zone
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
              {citizenReports.filter(r => r.cross_referenced_with_sensor).length} Cross-Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {citizenReports.map(report => (
              <div
                key={report.report_id}
                className="bg-slate-50/50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl flex flex-col justify-between space-y-3 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-blue-700">
                      {report.report_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      report.status === 'linked_to_ticket' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Photo Preview if present */}
                  {report.photo_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-2.5 bg-slate-100 border border-slate-200">
                      <img
                        src={report.photo_url}
                        alt="Citizen Leak Photo"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{report.address}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 italic">
                    "{report.description}"
                  </p>

                  <div className="mt-2 text-[11px] font-mono text-slate-500">
                    Surface Flow: <span className="text-amber-700 font-bold">{report.estimated_surface_flow}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                  {report.cross_referenced_with_sensor ? (
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sensor Verified (+10 Pts)</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Pending Sensor Match</span>
                  )}

                  {report.linked_ticket_id && (
                    <span className="text-blue-700 font-mono text-[11px] font-medium">
                      {report.linked_ticket_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Ticket Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Maintenance Dispatch Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Target Zone:</label>
                <select
                  value={newZoneId}
                  onChange={(e) => setNewZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  {zones.map(z => (
                    <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Severity Level:</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="critical">Critical (Immediate Response)</option>
                  <option value="high">High (&lt;6 Hours)</option>
                  <option value="medium">Medium (&lt;24 Hours)</option>
                  <option value="low">Low (&lt;72 Hours)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assign Technician / Crew:</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Crew Delta-4 (Lead: Tech R. Vance)">Crew Delta-4 (Lead: Tech R. Vance)</option>
                  <option value="Crew Alpha-2 (Lead: Tech J. Morales)">Crew Alpha-2 (Lead: Tech J. Morales)</option>
                  <option value="Crew Beta-1 (Lead: Tech S. Kim)">Crew Beta-1 (Lead: Tech S. Kim)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Work Order Notes:</label>
                <textarea
                  required
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Specify suspected pipe segment, acoustic findings, or traffic considerations..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

