/**
 * AquaWatch - Live Leak Simulator & Judge Walkthrough Modal (Professional Polish)
 * Enables instantaneous demonstration of physical pipe bursts, Z-score detection, and auto-dispatch
 */

import React, { useState } from 'react';
import { Activity, AlertTriangle, Check, Flame, Play, RefreshCw, X, Zap } from 'lucide-react';
import { AnomalySeverity, AnomalyType, Zone } from '../types';
import { API } from '../services/api';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  onInjectionSuccess?: (scenario: any) => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  zones,
  onInjectionSuccess
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-central');
  const [leakType, setLeakType] = useState<AnomalyType>('Sudden Pipe Burst');
  const [severity, setSeverity] = useState<AnomalySeverity>('critical');
  const [flowIncrease, setFlowIncrease] = useState<number>(85);
  const [pressureDrop, setPressureDrop] = useState<number>(1.35);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      title: '🚨 Major Main Rupture (Central Downtown)',
      zone_id: 'zone-central',
      type: 'Sudden Pipe Burst' as AnomalyType,
      severity: 'critical' as AnomalySeverity,
      flow: 92,
      pressure: 1.45,
      desc: 'Severe 350mm feeder burst causing street flooding and acute pressure drop.'
    },
    {
      title: '💧 Slow Creep Joint Separation (East Historic)',
      zone_id: 'zone-east',
      type: 'Slow Creep Leak' as AnomalyType,
      severity: 'high' as AnomalySeverity,
      flow: 38,
      pressure: 0.40,
      desc: 'Underground socket failure in 1968 pipeline. Continuous baseline loss.'
    },
    {
      title: '🌙 Night Minimum Flow Surge (North Hills)',
      zone_id: 'zone-north',
      type: 'Night Minimum Flow Surge' as AnomalyType,
      severity: 'medium' as AnomalySeverity,
      flow: 26,
      pressure: 0.25,
      desc: 'Abnormal baseline flow spike occurring during 03:00-04:00 AM off-peak window.'
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setSelectedZoneId(p.zone_id);
    setLeakType(p.type);
    setSeverity(p.severity);
    setFlowIncrease(p.flow);
    setPressureDrop(p.pressure);
  };

  const handleInject = async () => {
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const res = await API.injectLeak({
        zone_id: selectedZoneId,
        type: leakType,
        severity: severity,
        flow_increase_m3_h: flowIncrease,
        pressure_drop_bar: pressureDrop
      });

      setResultMessage(`✅ Leak simulated in ${selectedZoneId}! Anomaly detected, Z-score recalculated, and ticket dispatched.`);
      if (onInjectionSuccess) {
        onInjectionSuccess(res.scenario);
      }
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    } catch (err: any) {
      setResultMessage(`❌ Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>IoT Telemetry & Leak Injection Sandbox</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono font-semibold">DEMO READY</span>
              </h3>
              <p className="text-xs text-slate-500">Test the end-to-end detection, priority scoring, and auto-ticket workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="text-slate-900 font-bold block mb-1.5 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> One-Click Demonstration Scenarios:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all group"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-blue-700">{p.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
            {/* Zone Selector */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Target Distribution Zone:</label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:border-blue-500 font-sans"
              >
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* Leak Type */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Anomaly Pattern Type:</label>
              <select
                value={leakType}
                onChange={(e) => setLeakType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 outline-none focus:border-blue-500"
              >
                <option value="Sudden Pipe Burst">Sudden Pipe Burst (High Flow + Drop)</option>
                <option value="Slow Creep Leak">Slow Creep Joint Leak</option>
                <option value="Night Minimum Flow Surge">Night Minimum Flow Surge</option>
                <option value="Pressure Drop Anomaly">Pressure Drop Anomaly</option>
                <option value="Unauthorized Draw / Meter Bypass">Unauthorized Draw</option>
              </select>
            </div>
          </div>

          {/* Sliders for Flow increase and Pressure drop */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-600 font-medium">Flow Increase:</span>
                <span className="text-rose-700 font-bold">+{flowIncrease} m³/h</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={flowIncrease}
                onChange={(e) => setFlowIncrease(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-600 font-medium">Pressure Drop:</span>
                <span className="text-purple-700 font-bold">-{pressureDrop} bar</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={pressureDrop}
                onChange={(e) => setPressureDrop(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {resultMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Triggers Z-score recalculation on next telemetry cycle
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              id="btn-inject-leak"
              onClick={handleInject}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Inject & Trigger System Flow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

