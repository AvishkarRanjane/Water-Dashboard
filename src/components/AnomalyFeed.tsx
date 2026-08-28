/**
 * AquaWatch - Live Anomaly Feed Component (Professional Polish)
 * Real-time scrolling, timestamped stream of detected pipe bursts, leaks, and pressure drops
 */

import React from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Droplet, Gauge, Radio, ShieldAlert } from 'lucide-react';
import { AnomalyEvent } from '../types';

interface AnomalyFeedProps {
  anomalies: AnomalyEvent[];
  onSelectAnomaly?: (anomaly: AnomalyEvent) => void;
}

export const AnomalyFeed: React.FC<AnomalyFeedProps> = ({ anomalies, onSelectAnomaly }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl flex flex-col h-[480px] shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-900">Live Anomaly Feed</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-mono font-bold">
            {anomalies.filter(a => a.status !== 'resolved').length} Active
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Auto-Z-Score Stream
        </span>
      </div>

      {/* Scrolling List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 divide-y divide-slate-100">
        {anomalies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p>All pipeline sectors operating within nominal 95% baseline envelope</p>
          </div>
        ) : (
          anomalies.map((anomaly) => {
            const isResolved = anomaly.status === 'resolved';
            const timeAgo = Math.round((Date.now() - new Date(anomaly.detected_at).getTime()) / 60000);
            const timeDisplay = timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`;

            return (
              <div
                key={anomaly.event_id}
                id={`anomaly-${anomaly.event_id}`}
                onClick={() => onSelectAnomaly && onSelectAnomaly(anomaly)}
                className={`pt-2.5 first:pt-0 group cursor-pointer transition-all duration-150 p-3 rounded-lg border ${
                  isResolved 
                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                    : anomaly.severity === 'critical'
                    ? 'bg-rose-50/40 hover:bg-rose-50/70 border-rose-200 hover:border-rose-300'
                    : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getSeverityBadge(anomaly.severity)}`}>
                      {anomaly.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {anomaly.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {timeDisplay}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-600 font-medium">
                  {anomaly.zone_name || anomaly.zone_id}
                </div>

                {/* Telemetry Metrics Pill Grid */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  <div className="bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Z-Score:</span>
                    <span className="text-amber-600 font-bold">+{anomaly.z_score}σ</span>
                  </div>
                  <div className="bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] flex items-center gap-0.5">
                      <Droplet className="w-2.5 h-2.5 text-blue-600" /> Loss:
                    </span>
                    <span className="text-rose-600 font-bold">{anomaly.estimated_loss_rate_m3_h} m³/h</span>
                  </div>
                  <div className="bg-white px-2 py-1 rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] flex items-center gap-0.5">
                      <Gauge className="w-2.5 h-2.5 text-indigo-600" /> Press:
                    </span>
                    <span className="text-slate-800">{anomaly.observed_pressure} bar</span>
                  </div>
                </div>

                {/* Badges / Cross-Reference tags */}
                <div className="mt-2.5 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {anomaly.has_cross_referenced_citizen_report && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Citizen Confirmed
                      </span>
                    )}
                    {anomaly.linked_ticket_id && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
                        Ticket: {anomaly.linked_ticket_id}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 flex items-center gap-0.5 group-hover:text-blue-600 font-medium">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
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

