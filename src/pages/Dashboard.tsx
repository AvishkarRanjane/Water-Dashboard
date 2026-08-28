/**
 * AquaWatch - Dashboard View (Professional Polish)
 * Operational command center with NRW KPI metrics, City Risk Map, live telemetry readouts,
 * scrolling Anomaly Feed, and Water-Saved-To-Date counter.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Droplet,
  Droplets,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  Percent,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Waves
} from 'lucide-react';
import { CityRiskMap } from '../components/map/CityRiskMap';
import { AnomalyFeed } from '../components/AnomalyFeed';
import { AnomalyEvent, CitySummaryStats, LeakReport, Sensor, Zone } from '../types';

interface DashboardProps {
  summary: CitySummaryStats;
  zones: Zone[];
  sensors: Sensor[];
  anomalies: AnomalyEvent[];
  citizenReports: LeakReport[];
  onSelectZone: (zoneId: string) => void;
  onSelectAnomaly: (anomaly: AnomalyEvent) => void;
  onOpenSimulator: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  zones,
  sensors,
  anomalies,
  citizenReports,
  onSelectZone,
  onSelectAnomaly,
  onOpenSimulator
}) => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [inspectedAnomaly, setInspectedAnomaly] = useState<AnomalyEvent | null>(null);

  const displayedZones = selectedZoneFilter === 'all' 
    ? zones 
    : zones.filter(z => z.zone_id === selectedZoneFilter);

  const handleAnomalyClick = (anomaly: AnomalyEvent) => {
    setInspectedAnomaly(anomaly);
    onSelectAnomaly(anomaly);
  };

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Hero KPI: NRW % */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Citywide NRW Rate</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
                {summary.nrw_percentage}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <TrendingDown className="w-3 h-3 mr-0.5" /> -2.4% MoM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Non-Revenue Water (Benchmark: &lt;15%)
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Loss: {summary.total_daily_loss_rate_m3_h} m³/h</span>
            <span className="text-slate-400">Prev: {summary.nrw_previous_month}%</span>
          </div>
        </div>

        {/* 2. Water Saved To Date */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Water Saved to Date</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 font-mono">
                {summary.water_saved_to_date_m3.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">m³</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Conserved via predictive acoustic dispatch
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> ${(summary.financial_savings_usd).toLocaleString()} Recovered
            </span>
            <span className="text-slate-400">$1.65/m³</span>
          </div>
        </div>

        {/* 3. Active Leak Anomalies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Anomalies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 font-mono">
                {summary.active_anomalies}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({summary.open_tickets} dispatched)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Detected by continuous Z-score triggers
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600">Physical Pipe Bursts</span>
            <button
              onClick={onOpenSimulator}
              className="text-blue-600 hover:text-blue-700 font-semibold underline text-xs"
            >
              Simulate Leak
            </button>
          </div>
        </div>

        {/* 4. Network Health Index */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Health Index</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 font-mono">
                {summary.system_health_index}/100
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Optimal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.total_sensors} active IoT telemetry loggers
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>5 DMAs • 94.6 km Pipe</span>
            <span className="text-emerald-600 font-semibold">99.8% Uptime</span>
          </div>
        </div>
      </div>

      {/* Main Grid: GIS Risk Map + Live Anomaly Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: GIS City Risk Map */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-600" />
                <span>Geospatial Risk & Pipe Burst Map</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                District Metered Areas color-coded by real-time Non-Revenue Water leakage probability
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Distribution Zones (5)</option>
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="w-full flex-1 min-h-[440px] rounded-lg overflow-hidden border border-slate-200">
            <CityRiskMap
              zones={displayedZones}
              sensors={sensors}
              anomalies={anomalies}
              citizenReports={citizenReports}
              onSelectZone={onSelectZone}
              onSelectAnomaly={handleAnomalyClick}
            />
          </div>
        </div>

        {/* Right 4 Cols: Live Anomaly Stream */}
        <div className="lg:col-span-4">
          <AnomalyFeed
            anomalies={anomalies}
            onSelectAnomaly={handleAnomalyClick}
          />
        </div>
      </div>

      {/* Real-Time Zone Telemetry Readouts Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              <span>Real-Time Zone Telemetry & Pressure Balance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live flow rates, target pressure differentials, and physical loss intensity per DMA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {zones.map(zone => {
            const flowDev = (zone.current_flow_m3_h || zone.base_demand_m3_h) - zone.base_demand_m3_h;
            const pressDev = (zone.current_pressure_bar || zone.target_pressure_bar) - zone.target_pressure_bar;
            const isCritical = zone.risk_level === 'critical';
            const isHigh = zone.risk_level === 'high';

            return (
              <div
                key={zone.zone_id}
                onClick={() => onSelectZone(zone.zone_id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  isCritical 
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300' 
                    : isHigh 
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' 
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate" title={zone.name}>
                    {zone.name.split(' (')[0]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                    isCritical 
                      ? 'bg-rose-100 text-rose-800 border-rose-300' 
                      : isHigh 
                      ? 'bg-amber-100 text-amber-800 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {zone.risk_level}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mb-3 font-mono">
                  Pop: {zone.population.toLocaleString()}
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Flow:</span>
                    <span className={`font-bold ${flowDev > 20 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {zone.current_flow_m3_h || zone.base_demand_m3_h} m³/h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Pressure:</span>
                    <span className={`font-bold ${pressDev < -0.6 ? 'text-indigo-600' : 'text-slate-900'}`}>
                      {zone.current_pressure_bar || zone.target_pressure_bar} bar
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                    <span className="text-slate-500 text-[11px]">NRW Loss:</span>
                    <span className="text-amber-600 font-bold">{zone.nrw_rate_pct || 15}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly Quick Detail Drawer Modal if clicked */}
      {inspectedAnomaly && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">{inspectedAnomaly.type}</h3>
              </div>
              <button
                onClick={() => setInspectedAnomaly(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3 text-slate-600">
              <p className="text-slate-800 font-medium">{inspectedAnomaly.description}</p>
              
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl font-mono text-xs border border-slate-200">
                <div><span className="text-slate-500">Zone:</span> <span className="text-slate-900 font-semibold">{inspectedAnomaly.zone_name}</span></div>
                <div><span className="text-slate-500">Severity:</span> <span className="text-rose-600 uppercase font-bold">{inspectedAnomaly.severity}</span></div>
                <div><span className="text-slate-500">Z-Score:</span> <span className="text-amber-600 font-bold">+{inspectedAnomaly.z_score}σ</span></div>
                <div><span className="text-slate-500">Flow Deviation:</span> <span className="text-rose-600 font-bold">+{inspectedAnomaly.deviation_pct}%</span></div>
                <div><span className="text-slate-500">Observed Flow:</span> <span className="text-slate-900">{inspectedAnomaly.observed_flow} m³/h</span></div>
                <div><span className="text-slate-500">Expected Baseline:</span> <span className="text-blue-600 font-semibold">{inspectedAnomaly.expected_flow} m³/h</span></div>
                <div><span className="text-slate-500">Observed Pressure:</span> <span className="text-indigo-600 font-semibold">{inspectedAnomaly.observed_pressure} bar</span></div>
                <div><span className="text-slate-500">Loss Rate:</span> <span className="text-rose-600 font-bold">{inspectedAnomaly.estimated_loss_rate_m3_h} m³/h</span></div>
              </div>

              {inspectedAnomaly.has_cross_referenced_citizen_report && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cross-verified with active visual citizen leak report in this zone! Confidence 99%+.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectedAnomaly(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

