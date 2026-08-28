/**
 * AquaWatch - Historical Trend Chart (Recharts - Professional Polish)
 * Dual-axis flow and pressure time-series explorer with anomaly annotations
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistoricalTrendChartProps {
  historyData: Array<{
    timestamp: string;
    flow_value: number;
    pressure_value: number;
    raw_status?: string;
  }>;
  zoneName?: string;
}

export const HistoricalTrendChart: React.FC<HistoricalTrendChartProps> = ({
  historyData,
  zoneName = 'Selected Zone'
}) => {
  const formattedData = historyData.map((d) => {
    const date = new Date(d.timestamp);
    const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return {
      time: timeLabel,
      flow: d.flow_value,
      pressure: d.pressure_value,
      isAnomalous: d.raw_status === 'anomalous'
    };
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Telemetry Time-Series (Flow & Pressure)</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            24-hour synchronized hydraulic trends for <span className="text-blue-700 font-semibold">{zoneName}</span>
          </p>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis
              yAxisId="flowAxis"
              stroke="#2563eb"
              fontSize={11}
              unit=" m³"
              tickLine={false}
            />
            <YAxis
              yAxisId="pressAxis"
              orientation="right"
              stroke="#7c3aed"
              fontSize={11}
              unit=" bar"
              tickLine={false}
              domain={[0, 6]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs font-sans">
                      <div className="text-slate-500 font-mono font-semibold mb-1">{label}</div>
                      <div className="space-y-1 font-mono">
                        <div className="text-blue-600 font-bold">Flow: {data.flow} m³/h</div>
                        <div className="text-purple-600 font-bold">Pressure: {data.pressure} bar</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line
              yAxisId="flowAxis"
              type="monotone"
              dataKey="flow"
              name="Flow Rate (m³/h)"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="pressAxis"
              type="monotone"
              dataKey="pressure"
              name="Hydraulic Pressure (bar)"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

