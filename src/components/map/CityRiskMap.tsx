/**
 * AquaWatch - City Risk Map (Leaflet.js)
 * Displays city distribution zones color-coded by leak probability and active anomaly pulses
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AnomalyEvent, LeakReport, Sensor, Zone } from '../../types';

interface CityRiskMapProps {
  zones: Zone[];
  sensors: Sensor[];
  anomalies: AnomalyEvent[];
  citizenReports?: LeakReport[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  onSelectAnomaly?: (anomaly: AnomalyEvent) => void;
}

export const CityRiskMap: React.FC<CityRiskMapProps> = ({
  zones,
  sensors,
  anomalies,
  citizenReports = [],
  selectedZoneId,
  onSelectZone,
  onSelectAnomaly
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Metro Water District coordinates (San Francisco demo area)
    const map = L.map(mapContainerRef.current, {
      center: [37.778, -122.412],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Dark sleek CartoDB tile layer for modern command-center GIS aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Custom Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers & Overlays whenever data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render District Metered Area (DMA) Polygons
    zones.forEach(zone => {
      const isSelected = selectedZoneId === zone.zone_id;
      const risk = zone.risk_level || 'low';

      let fillColor = '#10b981'; // Emerald - Low risk
      let strokeColor = '#059669';

      if (risk === 'critical') {
        fillColor = '#ef4444'; // Red - Critical
        strokeColor = '#b91c1c';
      } else if (risk === 'high') {
        fillColor = '#f97316'; // Orange - High
        strokeColor = '#c2410c';
      } else if (risk === 'medium') {
        fillColor = '#eab308'; // Amber - Medium
        strokeColor = '#a16207';
      }

      const latLngs = zone.boundary_coordinates.map(c => [c.lat, c.lng] as [number, number]);
      if (latLngs.length > 2) {
        const polygon = L.polygon(latLngs, {
          color: strokeColor,
          weight: isSelected ? 3 : 2,
          opacity: 0.9,
          fillColor: fillColor,
          fillOpacity: isSelected ? 0.45 : 0.25,
          dashArray: isSelected ? '6, 6' : undefined
        });

        polygon.bindTooltip(`
          <div class="px-2 py-1 bg-slate-900 text-white rounded text-xs font-semibold shadow-lg">
            <div class="text-cyan-400 font-bold">${zone.name}</div>
            <div class="text-slate-300">NRW Loss: <span class="font-mono text-amber-400 font-bold">${zone.nrw_rate_pct || 18}%</span></div>
            <div class="text-slate-300">Pop: ${zone.population.toLocaleString()} | Press: ${zone.current_pressure_bar || zone.target_pressure_bar} bar</div>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        polygon.on('click', () => {
          if (onSelectZone) onSelectZone(zone.zone_id);
        });

        layerGroup.addLayer(polygon);
      }
    });

    // 2. Render Real-Time IoT Sensors
    sensors.forEach(sensor => {
      const isWarning = sensor.status === 'warning';
      const isOffline = sensor.status === 'offline';
      
      const markerColor = isOffline ? '#64748b' : (isWarning ? '#f59e0b' : '#06b6d4');
      const iconHtml = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/90 border-2 shadow-md transition-transform hover:scale-125" style="border-color: ${markerColor}">
          <span class="text-[10px] font-mono font-bold text-white">${sensor.type === 'flow' ? 'FL' : 'PR'}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-sensor-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([sensor.location.lat, sensor.location.lng], { icon: customIcon });
      marker.bindPopup(`
        <div class="p-2 min-w-[180px] bg-slate-900 text-slate-100 rounded-lg text-xs font-sans">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
            <span class="font-bold text-cyan-400">${sensor.sensor_id}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${isWarning ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}">${sensor.status}</span>
          </div>
          <div class="space-y-1 font-mono">
            <div class="flex justify-between">
              <span class="text-slate-400">Type:</span>
              <span class="text-white capitalize">${sensor.type} meter</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Reading:</span>
              <span class="text-cyan-300 font-bold">${sensor.current_reading} ${sensor.unit}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Battery:</span>
              <span class="text-emerald-400">${sensor.battery_pct}%</span>
            </div>
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
    });

    // 3. Render Active Anomaly Pulses (Red glowing concentric burst icons)
    anomalies.filter(a => a.status !== 'resolved').forEach(anomaly => {
      const targetSensor = sensors.find(s => s.sensor_id === anomaly.sensor_id);
      const lat = targetSensor ? targetSensor.location.lat : (anomaly.zone_id === 'zone-central' ? 37.7885 : 37.769);
      const lng = targetSensor ? targetSensor.location.lng : (anomaly.zone_id === 'zone-central' ? -122.407 : -122.389);

      const isCritical = anomaly.severity === 'critical';
      const pulseColor = isCritical ? '#ef4444' : '#f97316';

      const pulseHtml = `
        <div class="relative flex items-center justify-center w-10 h-10 cursor-pointer">
          <div class="absolute w-10 h-10 rounded-full animate-ping opacity-75" style="background-color: ${pulseColor}"></div>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs shadow-lg border-2 border-white">
            🚨
          </div>
        </div>
      `;

      const pulseIcon = L.divIcon({
        html: pulseHtml,
        className: 'custom-anomaly-pulse',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const pulseMarker = L.marker([lat, lng], { icon: pulseIcon });
      pulseMarker.on('click', () => {
        if (onSelectAnomaly) onSelectAnomaly(anomaly);
      });

      pulseMarker.bindTooltip(`
        <div class="p-2 bg-red-950/95 border border-red-500/50 text-white rounded shadow-xl text-xs max-w-xs">
          <div class="font-bold text-red-300 uppercase tracking-wide">${anomaly.type}</div>
          <div class="text-slate-200 mt-0.5">${anomaly.zone_name}</div>
          <div class="font-mono text-amber-300 mt-1 font-bold">Z-Score: +${anomaly.z_score} | Loss: ${anomaly.estimated_loss_rate_m3_h} m³/h</div>
          <div class="text-[10px] text-red-200 mt-1">Click to view priority ranking & ticket</div>
        </div>
      `);

      layerGroup.addLayer(pulseMarker);
    });

    // 4. Render Citizen Reports Pins
    citizenReports.forEach(report => {
      const pinHtml = `
        <div class="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-md border-2 border-slate-900">
          📍
        </div>
      `;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: 'citizen-report-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      const reportMarker = L.marker([report.location.lat, report.location.lng], { icon: pinIcon });
      reportMarker.bindPopup(`
        <div class="p-2 min-w-[200px] bg-slate-900 text-slate-100 rounded text-xs">
          <div class="font-bold text-amber-400 flex items-center justify-between">
            <span>Citizen Report [${report.report_id}]</span>
            ${report.cross_referenced_with_sensor ? '<span class="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded font-bold">SENSOR MATCHED</span>' : ''}
          </div>
          <div class="text-slate-300 text-[11px] mt-1">${report.address}</div>
          <p class="text-slate-400 mt-1.5 line-clamp-2 italic">"${report.description}"</p>
          <div class="mt-2 text-[10px] text-slate-400 font-mono">Flow: <span class="text-amber-300 font-semibold">${report.estimated_surface_flow}</span></div>
        </div>
      `);

      layerGroup.addLayer(reportMarker);
    });
  }, [zones, sensors, anomalies, citizenReports, selectedZoneId, onSelectZone, onSelectAnomaly]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend Badge Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-3 shadow-md text-xs text-slate-800">
        <div className="font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          GIS Risk Overlay
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-500/80 border border-red-600"></span>
            <span>Critical (&gt;25% NRW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-orange-500/80 border border-orange-600"></span>
            <span>High (18-25%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-yellow-500/80 border border-yellow-600"></span>
            <span>Medium (14-18%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500/80 border border-emerald-600"></span>
            <span>Optimal (&lt;14%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

