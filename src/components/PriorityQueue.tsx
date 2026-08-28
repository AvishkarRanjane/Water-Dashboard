/**
 * AquaWatch - Leak Priority Queue Component (Professional Polish)
 * Sorts and prioritizes active pipe repairs by multi-factor weighted algorithm
 */

import React, { useState } from 'react';
import { AlertTriangle, ArrowUpDown, CheckCircle, ChevronDown, Clock, Droplets, Filter, ShieldAlert, UserCheck, Users } from 'lucide-react';
import { MaintenanceTicket } from '../types';

interface PriorityQueueProps {
  tickets: MaintenanceTicket[];
  onSelectTicket?: (ticket: MaintenanceTicket) => void;
  onUpdateStatus?: (ticketId: string, status: string) => void;
  onAssignCrew?: (ticketId: string, crewName: string) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  tickets,
  onSelectTicket,
  onUpdateStatus,
  onAssignCrew
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'loss'>('priority');

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'priority') return b.priority_score - a.priority_score;
    if (sortBy === 'loss') return b.estimated_loss_m3 - a.estimated_loss_m3;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPriorityColor = (score: number) => {
    if (score >= 85) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score >= 45) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'assigned':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'verified_fixed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm">
      {/* Controls & Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Leak Priority & Dispatch Queue</h3>
            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-mono font-semibold">
              {sortedTickets.length} Tickets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by: <span className="text-blue-700 font-mono font-medium">Score = (0.40×Sev) + (0.35×Pop) + (0.25×Loss) + CitizenBonus</span>
          </p>
        </div>

        {/* Filter and Sort options */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('reported')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'reported' ? 'bg-white text-amber-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'in_progress' ? 'bg-white text-purple-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('verified_fixed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterStatus === 'verified_fixed' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Fixed
            </button>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 outline-none text-xs cursor-pointer font-medium"
            >
              <option value="priority">Highest Priority</option>
              <option value="loss">Highest Loss Volume</option>
              <option value="date">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
        {sortedTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No maintenance tickets found for selected filter.
          </div>
        ) : (
          sortedTickets.map((ticket, index) => {
            const isFixed = ticket.status === 'verified_fixed';
            const isUrgent = ticket.priority_score >= 80 && !isFixed;

            return (
              <div
                key={ticket.ticket_id}
                id={`ticket-${ticket.ticket_id}`}
                className={`p-4 hover:bg-slate-50/70 transition-colors ${isUrgent ? 'bg-rose-50/20' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Priority Badge & Details */}
                  <div className="flex items-start gap-3.5">
                    {/* Rank Number + Priority Score Box */}
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border font-mono shrink-0 ${getPriorityColor(ticket.priority_score)}`}>
                      <span className="text-[9px] text-slate-500 font-sans uppercase font-bold tracking-wider">Score</span>
                      <span className="text-lg font-black leading-tight">{ticket.priority_score}</span>
                      <span className="text-[9px] text-slate-400">#{index + 1}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {ticket.ticket_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        {ticket.source === 'hybrid_cross_verified' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Sensor + Citizen Match
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-800 font-semibold mt-1">
                        {ticket.zone_name || ticket.zone_id}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-xl">
                        {ticket.notes}
                      </p>

                      {/* Weight Breakdown Sub-Bar */}
                      {ticket.priority_breakdown && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500">
                          <span title="Severity Component (40% max 40pts)">
                            Sev: <b className="text-slate-800">{ticket.priority_breakdown.severity_weight}</b>
                          </span>
                          <span>•</span>
                          <span title="Population Impact Component (35% max 35pts)">
                            Pop: <b className="text-slate-800">{ticket.priority_breakdown.population_weight}</b>
                          </span>
                          <span>•</span>
                          <span title="Loss Rate Component (25% max 25pts)">
                            Loss: <b className="text-slate-800">{ticket.priority_breakdown.loss_rate_weight}</b>
                          </span>
                          {ticket.priority_breakdown.citizen_bonus > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold" title="Citizen Physical Cross-Verification Bonus">
                                Citizen Bonus: +{ticket.priority_breakdown.citizen_bonus}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dispatch / Crew Assignment & Status Progression */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-600 flex items-center gap-1 justify-end font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-slate-900 font-semibold">{ticket.assigned_to || 'Unassigned'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Est. Lost: <span className="text-rose-600 font-bold">{ticket.estimated_loss_m3} m³</span>
                      </div>
                    </div>

                    {/* Status Action Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.status}
                        onChange={(e) => onUpdateStatus && onUpdateStatus(ticket.ticket_id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-medium cursor-pointer"
                      >
                        <option value="reported">Reported</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="verified_fixed">Verified Fixed</option>
                      </select>

                      {onSelectTicket && (
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

