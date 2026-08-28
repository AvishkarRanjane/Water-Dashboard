/**
 * AquaWatch - Analytics & GIS Intelligence Page (Professional Polish)
 * Advanced hydraulic analytics, GIS multi-layer pipeline explorer,
 * diurnal consumption confidence bands, and area-wise water-loss rankings.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Compass,
  DollarSign,
  Download,
  Droplet,
  Droplets,
  Filter,
  Layers,
  MapPin,
  TrendingUp,
  Waves
} from 'lucide-react';
import { ConsumptionBandChart } from '../components/charts/ConsumptionBandChart';
import { ZoneComparisonChart } from '../components/charts/ZoneComparisonChart';
import { HistoricalTrendChart } from '../components/charts/HistoricalTrendChart';
import { PipelineNetworkMap } from '../components/map/PipelineNetworkMap';
import { AnomalyEvent, PipeSegment, Sensor, Zone } from '../types';

interface AnalyticsProps {
  zones: Zone[];
  pipes: PipeSegment[];
  sensors: Sensor[];
  anomalies: AnomalyEvent[];
  consumptionHistory: any[];
}

export const Analytics: React.FC<AnalyticsProps> = ({
  zones,
  pipes,
  sensors,
  anomalies,
  consumptionHistory
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-central');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const currentZone = zones.find(z => z.zone_id === selectedZoneId) || zones[0];

  // Synthesize Diurnal Consumption Band Data for currentZone
  const bandChartData = Array.from({ length: 24 }).map((_, hour) => {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    
    // Diurnal multiplier pattern
    let mult = 1.0;
    if (hour >= 0 && hour <= 4) mult = 0.38 + (hour * 0.02);
    else if (hour >= 5 && hour <= 6) mult = 0.7 + ((hour - 5) * 0.25);
    else if (hour >= 7 && hour <= 9) mult = 1.5 + (Math.sin((hour - 7) * 0.8) * 0.15);
    else if (hour >= 10 && hour <= 16) mult = 1.05;
    else if (hour >= 17 && hour <= 21) mult = 1.4;
    else mult = 0.7;

    const base = (currentZone?.base_demand_m3_h || 120) * mult;
    const std = base * 0.08;
    const upper = Number((base + 2.0 * std).toFixed(1));
    const lower = Number((Math.max(5, base - 2.0 * std)).toFixed(1));

    // Actual flow with injected anomaly for central/east
    let actual = base + ((Math.random() - 0.5) * (base * 0.05));
    if (currentZone?.zone_id === 'zone-central' && hour >= 18) {
      actual += 78.5; // Injected burst deviation
    } else if (currentZone?.zone_id === 'zone-east' && hour >= 14) {
      actual += 33.0; // Injected slow leak
    }

    return {
      time: hourStr,
      actualFlow: Number(actual.toFixed(1)),
      expectedFlow: Number(base.toFixed(1)),
      upperBand: upper,
      lowerBand: lower,
      isAnomaly: actual > upper
    };
  });

  // Filter consumption history for selected zone
  const zoneHistory = consumptionHistory.filter(h => h.zone_id === selectedZoneId).slice(-48);

  // Ranked water loss summary across all zones
  const rankedLosses = [...zones].sort((a, b) => (b.water_loss_last_24h_m3 || 0) - (a.water_loss_last_24h_m3 || 0));

  return (
    <div className="space-y-6">
      {/* Header & Zone Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Hydraulic Analytics & Network GIS Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Diurnal curve confidence bands, physical leakage losses, and pipeline structural asset layers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Zone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Active DMA:</span>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 font-medium"
            >
              {zones.map(z => (
                <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded-md transition-colors font-medium text-xs ${timeRange === '24h' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              24h
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md transition-colors font-medium text-xs ${timeRange === '7d' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md transition-colors font-medium text-xs ${timeRange === '30d' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: GIS Pipeline Layered Map */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Pipeline Asset & Material GIS Map</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect pipe diameter, vintage material (Cast Iron vs PVC), condition score, and historical leak hotspots
            </p>
          </div>
          <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg font-semibold">
            {pipes.length} Main Segments • 94.6 km
          </span>
        </div>

        <div className="w-full h-[520px] rounded-lg overflow-hidden border border-slate-200">
          <PipelineNetworkMap
            pipes={pipes}
            zones={zones}
            sensors={sensors}
            selectedZoneId={selectedZoneId}
          />
        </div>
      </div>

      {/* Row 2: Expected vs Actual Consumption Band Chart + Zone Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsumptionBandChart
          data={bandChartData}
          zoneName={currentZone?.name}
        />

        <ZoneComparisonChart
          zones={zones}
        />
      </div>

      {/* Row 3: Area-wise Water Loss Ranking Table & Historical Series */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Ranked Area Water Loss Heatmap Table */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-rose-600" />
                <span>Area-Wise Water Loss Ranking (Last 24h)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranked by daily physical volume lost and Non-Revenue Water percentage
              </p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 font-mono border-b border-slate-200 uppercase bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3">DMA Zone</th>
                  <th className="py-2.5 px-3 text-right">NRW %</th>
                  <th className="py-2.5 px-3 text-right">Lost Vol (m³)</th>
                  <th className="py-2.5 px-3 text-right">Financial Cost</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rankedLosses.map((z, idx) => {
                  const isHigh = (z.nrw_rate_pct || 15) > 20;
                  const cost = Math.round((z.water_loss_last_24h_m3 || 0) * 1.65);
                  return (
                    <tr
                      key={z.zone_id}
                      onClick={() => setSelectedZoneId(z.zone_id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedZoneId === z.zone_id ? 'bg-blue-50/60 text-blue-900 font-semibold' : 'text-slate-700'}`}
                    >
                      <td className="py-3 px-3 font-sans font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-4 text-slate-400 font-mono">#{idx + 1}</span>
                          <span className="truncate max-w-[140px]">{z.name.split(' (')[0]}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isHigh ? 'text-rose-600' : 'text-amber-600'}`}>
                        {z.nrw_rate_pct || 15}%
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900">
                        {(z.water_loss_last_24h_m3 || 0).toLocaleString()} m³
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                        ${cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                          z.risk_level === 'critical' 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : z.risk_level === 'high'
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {z.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 6 cols: Historical Dual-Axis Explorer */}
        <div className="lg:col-span-6">
          <HistoricalTrendChart
            historyData={zoneHistory.length > 0 ? zoneHistory : [
              { timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), flow_value: 140, pressure_value: 3.6 },
              { timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), flow_value: 155, pressure_value: 3.5 },
              { timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), flow_value: 180, pressure_value: 3.1 },
              { timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), flow_value: 242, pressure_value: 2.75 },
              { timestamp: new Date().toISOString(), flow_value: 240, pressure_value: 2.74 }
            ]}
            zoneName={currentZone?.name}
          />
        </div>
      </div>
    </div>
  );
};

