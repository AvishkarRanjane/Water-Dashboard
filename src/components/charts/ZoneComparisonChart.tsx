/**
 * AquaWatch - Zone Comparison Chart (Recharts - Professional Polish)
 * Compares Distribution Zones across Base Demand, Physical Leak Losses, and NRW %
 */

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  ComposedChart
} from 'recharts';
import { Zone } from '../../types';

interface ZoneComparisonChartProps {
  zones: Zone[];
}

export const ZoneComparisonChart: React.FC<ZoneComparisonChartProps> = ({ zones }) => {
  const chartData = zones.map(z => ({
    name: z.name.split(' (')[0].replace('Residential', 'Res').replace('Commercial', 'Comm'),
    zoneId: z.zone_id,
    baseDemand: z.base_demand_m3_h,
    currentFlow: z.current_flow_m3_h || z.base_demand_m3_h,
    waterLoss: Math.max(0, (z.current_flow_m3_h || z.base_demand_m3_h) - z.base_demand_m3_h),
    nrwPct: z.nrw_rate_pct || 15.0
  }));

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">District Metered Area (DMA) Comparison</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Base Demand vs Real-time Measured Flow & Non-Revenue Water (NRW %)
          </p>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              angle={-15}
              textAnchor="end"
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              fontSize={11}
              unit=" m³"
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#d97706"
              fontSize={11}
              unit="%"
              tickLine={false}
              domain={[0, 40]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs font-sans">
                      <div className="font-bold text-slate-900 mb-1.5">{label}</div>
                      <div className="space-y-1 font-mono">
                        <div className="text-blue-700">Base Demand: {data.baseDemand} m³/h</div>
                        <div className="text-slate-700">Current Measured: {data.currentFlow} m³/h</div>
                        <div className="text-rose-600 font-semibold">Estimated Physical Loss: {data.waterLoss.toFixed(1)} m³/h</div>
                        <div className="text-amber-700 font-bold pt-1 border-t border-slate-100">NRW Loss Rate: {data.nrwPct}%</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Bar
              yAxisId="left"
              dataKey="baseDemand"
              name="Nominal Base Demand (m³/h)"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="waterLoss"
              name="Unmetered Loss Deviation (m³/h)"
              fill="#e11d48"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="nrwPct"
              name="NRW Rate %"
              stroke="#d97706"
              strokeWidth={3}
              dot={{ r: 4, fill: '#d97706' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

