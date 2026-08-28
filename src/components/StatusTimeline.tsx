/**
 * AquaWatch - Status Timeline Component (Professional Polish)
 * 4-Stage Repair Lifecycle: Reported -> Assigned -> In Progress -> Verified Fixed
 */

import React from 'react';
import { Check, CheckCircle2, Clock, Hammer, ShieldAlert, UserCheck } from 'lucide-react';
import { MaintenanceTicket } from '../types';

interface StatusTimelineProps {
  ticket: MaintenanceTicket;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ ticket }) => {
  const stages = [
    {
      key: 'reported',
      label: 'Reported',
      icon: ShieldAlert,
      timestamp: ticket.created_at,
      description: ticket.source === 'hybrid_cross_verified' ? 'Cross-verified by Sensor + Citizen report' : 'Flagged by Z-Score Anomaly Engine'
    },
    {
      key: 'assigned',
      label: 'Assigned',
      icon: UserCheck,
      timestamp: ticket.assigned_at,
      description: ticket.assigned_to ? `Assigned to ${ticket.assigned_to}` : 'Pending field technician assignment'
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: Hammer,
      timestamp: ticket.in_progress_at,
      description: 'Field crew on-site: acoustic correlation & excavation in progress'
    },
    {
      key: 'verified_fixed',
      label: 'Verified Fixed',
      icon: CheckCircle2,
      timestamp: ticket.resolved_at,
      description: ticket.resolution_summary || 'Hydrostatic re-pressurization test passed. No seepage.'
    }
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'reported': return 0;
      case 'assigned': return 1;
      case 'in_progress': return 2;
      case 'verified_fixed': return 3;
      default: return 0;
    }
  };

  const currentIdx = getStageIndex(ticket.status);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Repair Lifecycle Progression</span>
        </h4>
        <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
          Ticket: {ticket.ticket_id}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative">
        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isCurrent 
                  ? 'bg-blue-50/70 border-blue-300 shadow-xs' 
                  : isCompleted 
                  ? 'bg-slate-50 border-slate-200 text-slate-900' 
                  : 'bg-slate-50/40 border-slate-200/60 text-slate-400 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isCurrent 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : isCompleted 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Stage 0{idx + 1}
                  </span>
                </div>

                <div className={`text-xs font-bold ${isCurrent ? 'text-blue-900' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                  {stage.label}
                </div>

                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              {stage.timestamp && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[10px] font-mono text-slate-500 font-medium">
                  {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

