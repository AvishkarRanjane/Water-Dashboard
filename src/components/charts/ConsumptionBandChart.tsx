/**
 * AquaWatch - Consumption Band Chart (Recharts - Professional Polish)
 * Expected diurnal consumption band (Confidence interval) vs Actual measured telemetry
 */

import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ConsumptionBandChartProps {
  data: Array<{
    time: string;
    actualFlow: number;
    expectedFlow: number;
    upperBand: number;
    lowerBand: number;
    isAnomaly?: boolean;
    actualPressure?: number;
  }>;
  zoneName?: string;
}

export const ConsumptionBandChart: React.FC<ConsumptionBandChartProps> = ({
  data,
  zoneName = 'All Distribution Zones'
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Expected vs Measured Flow Dynamics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {zoneName}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical 95% baseline envelope (μ ± 2.0σ) with real-time flow deviations
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-100 border border-blue-300"></span>
            <span>Expected Band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500"></span>
            <span>Baseline (μ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-600"></span>
            <span className="text-rose-700 font-semibold">Actual Flow (m³/h)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              unit=" m³"
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const diff = item.actualFlow - item.expectedFlow;
                  const isBurst = diff > 25;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs font-sans">
                      <div className="font-mono text-slate-500 font-semibold mb-1">{label}</div>
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Actual Flow:</span>
                          <span className={`font-bold ${isBurst ? 'text-rose-600' : 'text-blue-600'}`}>
                            {item.actualFlow} m³/h
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Expected Baseline:</span>
                          <span className="text-slate-800">{item.expectedFlow} m³/h</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Normal Range:</span>
                          <span className="text-slate-600">{item.lowerBand} - {item.upperBand} m³/h</span>
                        </div>
                        {diff > 10 && (
                          <div className="pt-1 border-t border-slate-100 flex justify-between gap-4 text-rose-600 font-bold">
                            <span>Deviation (Leak):</span>
                            <span>+{diff.toFixed(1)} m³/h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Expected Range Shading */}
            <Area
              type="monotone"
              dataKey="upperBand"
              stroke="none"
              fill="url(#bandGradient)"
            />
            <Area
              type="monotone"
              dataKey="lowerBand"
              stroke="none"
              fill="#ffffff"
            />
            {/* Expected Median Baseline */}
            <Line
              type="monotone"
              dataKey="expectedFlow"
              stroke="#2563eb"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            {/* Actual Measured Telemetry Flow */}
            <Line
              type="monotone"
              dataKey="actualFlow"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

