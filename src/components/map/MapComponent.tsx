/**
 * AquaWatch - Multi-Layer GIS Map Component
 * Provides comprehensive layer controls for Pipe Material, Installation Year,
 * Pressure Zones (DMAs), IoT Sensor telemetry, and Active Leak Hotspots.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Gauge,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Pipette,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Waves,
  Wrench,
  X
} from 'lucide-react';
import { PipeMaterial, PipeSegment, Sensor, Zone } from '../../types';

export interface MapComponentProps {
  pipes: PipeSegment[];
  zones: Zone[];
  sensors?: Sensor[];
  selectedZoneId?: string;
  onSelectPipe?: (pipe: PipeSegment) => void;
  onSelectZone?: (zone: Zone) => void;
  initialLayerMode?: 'material' | 'installationYear' | 'pressure' | 'condition';
  height?: string;
}

export interface LayerToggleState {
  pipes: boolean;
  materialColoring: boolean;
  installationYear: boolean;
  pressureZones: boolean;
  sensors: boolean;
  activeLeaks: boolean;
}

// Material color definitions
export const MATERIAL_COLORS: Record<PipeMaterial, { color: string; label: string; bg: string; border: string }> = {
  'Ductile Iron': { color: '#2563eb', label: 'Ductile Iron', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Cast Iron': { color: '#e11d48', label: 'Cast Iron (High Risk)', bg: 'bg-rose-50', border: 'border-rose-200' },
  'PVC': { color: '#059669', label: 'PVC (Modern Plastic)', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'HDPE': { color: '#7c3aed', label: 'HDPE (Flexible Poly)', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Asbestos Cement': { color: '#d97706', label: 'Asbestos Cement', bg: 'bg-amber-50', border: 'border-amber-200' }
};

// Installation era color mapping
export const getYearColor = (year: number): { color: string; label: string; tag: string } => {
  if (year < 1980) return { color: '#ef4444', label: 'Pre-1980 (>45 yrs)', tag: 'Critical Vintage' };
  if (year < 2000) return { color: '#f97316', label: '1980 - 1999 (25-45 yrs)', tag: 'Aged Metal' };
  if (year < 2015) return { color: '#eab308', label: '2000 - 2014 (10-25 yrs)', tag: 'Transitional' };
  return { color: '#10b981', label: '2015 - Present (<10 yrs)', tag: 'Modern Asset' };
};

// Pressure zone styling helper
export const getPressureZoneStyle = (targetPressure: number) => {
  if (targetPressure >= 4.0) {
    return { stroke: '#0284c7', fill: '#0284c7', label: 'High Pressure Zone (>4.0 bar)', badge: 'bg-sky-50 text-sky-800 border-sky-300' };
  }
  if (targetPressure >= 3.2) {
    return { stroke: '#10b981', fill: '#10b981', label: 'Nominal Pressure Zone (3.2 - 4.0 bar)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
  }
  return { stroke: '#d97706', fill: '#d97706', label: 'Low/Controlled Pressure Zone (<3.2 bar)', badge: 'bg-amber-50 text-amber-800 border-amber-300' };
};

export const MapComponent: React.FC<MapComponentProps> = ({
  pipes = [],
  zones = [],
  sensors = [],
  selectedZoneId,
  onSelectPipe,
  onSelectZone,
  initialLayerMode = 'material',
  height = '520px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Separate LayerGroups for granular multi-layer control
  const pressureZonesGroupRef = useRef<L.LayerGroup | null>(null);
  const pipesGroupRef = useRef<L.LayerGroup | null>(null);
  const sensorsGroupRef = useRef<L.LayerGroup | null>(null);
  const leaksGroupRef = useRef<L.LayerGroup | null>(null);

  // Active primary coloring dimension for pipes
  const [pipeColorDimension, setPipeColorDimension] = useState<'material' | 'installationYear' | 'condition'>(
    initialLayerMode === 'installationYear' ? 'installationYear' : 'material'
  );

  // Independent Layer Visibility States
  const [layers, setLayers] = useState<LayerToggleState>({
    pipes: true,
    materialColoring: initialLayerMode === 'material',
    installationYear: initialLayerMode === 'installationYear',
    pressureZones: true,
    sensors: true,
    activeLeaks: true
  });

  // Selected item details
  const [selectedPipe, setSelectedPipe] = useState<PipeSegment | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [activeBasemap, setActiveBasemap] = useState<'voyager' | 'satellite' | 'positron'>('voyager');
  const [yearFilterMin, setYearFilterMin] = useState<number>(1960);
  const [materialFilter, setMaterialFilter] = useState<string>('ALL');

  // Tile layer reference
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.778, -122.412],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize individual layer groups
    pressureZonesGroupRef.current = L.layerGroup().addTo(map);
    pipesGroupRef.current = L.layerGroup().addTo(map);
    sensorsGroupRef.current = L.layerGroup().addTo(map);
    leaksGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (activeBasemap === 'positron') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    } else if (activeBasemap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    const newTileLayer = L.tileLayer(url, {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(mapInstanceRef.current);

    // Send tile layer to back so vectors stay on top
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeBasemap]);

  // Center on selectedZoneId if specified
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedZoneId || zones.length === 0) return;
    const target = zones.find(z => z.zone_id === selectedZoneId);
    if (target && target.boundary_coordinates.length > 0) {
      const bounds = L.latLngBounds(target.boundary_coordinates.map(c => [c.lat, c.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      setSelectedZone(target);
    }
  }, [selectedZoneId, zones]);

  // 2. Render Pressure Zones Layer (DMAs)
  useEffect(() => {
    const group = pressureZonesGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.pressureZones) return;

    zones.forEach(zone => {
      const latLngs = zone.boundary_coordinates.map(c => [c.lat, c.lng] as [number, number]);
      if (latLngs.length > 2) {
        const style = getPressureZoneStyle(zone.target_pressure_bar);
        const isSelected = selectedZone?.zone_id === zone.zone_id;

        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#1d4ed8' : style.stroke,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? undefined : '5, 5',
          fillColor: style.fill,
          fillOpacity: isSelected ? 0.28 : 0.12
        });

        // Hover Tooltip
        polygon.bindTooltip(`
          <div class="p-2 bg-white text-slate-900 rounded-lg shadow-md border border-slate-200 text-xs font-sans">
            <div class="font-bold text-blue-700">${zone.name}</div>
            <div class="text-[11px] text-slate-600 mt-0.5">Pressure Zone Target: <b class="text-slate-900">${zone.target_pressure_bar} bar</b></div>
            <div class="text-[11px] text-slate-600">Current Measured: <b class="text-slate-900">${zone.current_pressure_bar || zone.target_pressure_bar} bar</b></div>
            <div class="text-[11px] text-slate-600">NRW Loss Rate: <b class="text-rose-600">${zone.nrw_rate_pct || 14}%</b></div>
            <div class="text-[10px] text-blue-600 font-semibold mt-1">Click to inspect Pressure Zone</div>
          </div>
        `, { sticky: true });

        polygon.on('click', () => {
          setSelectedZone(zone);
          if (onSelectZone) onSelectZone(zone);
        });

        group.addLayer(polygon);

        // Zone Center Label Marker
        if (latLngs.length > 0) {
          const centerLat = latLngs.reduce((sum, p) => sum + p[0], 0) / latLngs.length;
          const centerLng = latLngs.reduce((sum, p) => sum + p[1], 0) / latLngs.length;

          const labelIcon = L.divIcon({
            className: 'custom-zone-label',
            html: `
              <div class="px-2 py-0.5 rounded-md bg-white/90 border border-slate-300 shadow-xs text-[10px] font-bold text-slate-800 whitespace-nowrap backdrop-blur-xs flex items-center gap-1 pointer-events-none">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${style.stroke}"></span>
                <span>${zone.name.split(' (')[0]}</span>
                <span class="font-mono text-slate-500 font-normal">(${zone.target_pressure_bar}b)</span>
              </div>
            `,
            iconSize: [120, 20],
            iconAnchor: [60, 10]
          });

          const labelMarker = L.marker([centerLat, centerLng], { icon: labelIcon, interactive: false });
          group.addLayer(labelMarker);
        }
      }
    });
  }, [zones, layers.pressureZones, selectedZone, onSelectZone]);

  // 3. Render Pipeline Segments Layer (Filtered by Material & Installation Year)
  useEffect(() => {
    const group = pipesGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.pipes) return;

    // Filter pipes by material and minimum year
    const visiblePipes = pipes.filter(p => {
      if (materialFilter !== 'ALL' && p.material !== materialFilter) return false;
      if (p.install_year < yearFilterMin) return false;
      return true;
    });

    visiblePipes.forEach(pipe => {
      let strokeColor = '#3b82f6';
      let strokeOpacity = 0.85;
      const weight = Math.max(3, Math.min(8, pipe.diameter_mm / 45));

      // 1. Material coloring
      if (pipeColorDimension === 'material') {
        strokeColor = MATERIAL_COLORS[pipe.material]?.color || '#3b82f6';
      }
      // 2. Installation Year coloring
      else if (pipeColorDimension === 'installationYear') {
        strokeColor = getYearColor(pipe.install_year).color;
      }
      // 3. Structural Condition Score (1.0 - 10.0)
      else if (pipeColorDimension === 'condition') {
        if (pipe.condition_score < 4.0) strokeColor = '#dc2626';
        else if (pipe.condition_score < 7.0) strokeColor = '#ea580c';
        else strokeColor = '#16a34a';
      }

      const isSelected = selectedPipe?.pipe_id === pipe.pipe_id;
      if (isSelected) {
        strokeColor = '#2563eb';
        strokeOpacity = 1.0;
      }

      const coords = pipe.path_coordinates.map(c => [c.lat, c.lng] as [number, number]);
      if (coords.length >= 2) {
        const polyline = L.polyline(coords, {
          color: isSelected ? '#1d4ed8' : strokeColor,
          weight: isSelected ? weight + 3 : weight,
          opacity: strokeOpacity
        });

        polyline.on('click', () => {
          setSelectedPipe(pipe);
          if (onSelectPipe) onSelectPipe(pipe);
        });

        // Year metadata
        const yearInfo = getYearColor(pipe.install_year);

        polyline.bindTooltip(`
          <div class="p-2.5 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 text-xs font-sans min-w-[200px]">
            <div class="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5">
              <span class="font-mono font-bold text-blue-700">${pipe.pipe_id}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-700">${pipe.material}</span>
            </div>
            <div class="space-y-0.5 text-[11px] text-slate-600">
              <div class="flex justify-between"><span>Diameter:</span> <b class="text-slate-900 font-mono">Ø ${pipe.diameter_mm} mm</b></div>
              <div class="flex justify-between"><span>Installed:</span> <b class="text-slate-900 font-mono">${pipe.install_year} (${yearInfo.tag})</b></div>
              <div class="flex justify-between"><span>Rating:</span> <b class="text-slate-900 font-mono">${pipe.nominal_pressure_bar} bar</b></div>
              <div class="flex justify-between"><span>Condition:</span> <b class="font-mono ${pipe.condition_score < 5 ? 'text-rose-600 font-bold' : 'text-emerald-600'}">${pipe.condition_score}/10</b></div>
              <div class="flex justify-between"><span>Historic Leaks:</span> <b class="text-slate-900 font-mono">${pipe.leak_count_historical}</b></div>
            </div>
            ${pipe.has_active_leak ? '<div class="mt-1.5 pt-1 border-t border-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1">⚠️ Active Leak Incident Dispatched</div>' : ''}
          </div>
        `, { sticky: true });

        group.addLayer(polyline);
      }
    });
  }, [pipes, layers.pipes, pipeColorDimension, materialFilter, yearFilterMin, selectedPipe, onSelectPipe]);

  // 4. Render IoT Sensors Layer
  useEffect(() => {
    const group = sensorsGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.sensors) return;

    sensors.forEach(sensor => {
      const isFlow = sensor.type === 'flow';
      const isAcoustic = sensor.type === 'acoustic';

      const sensorMarker = L.circleMarker([sensor.location.lat, sensor.location.lng], {
        radius: isFlow ? 6 : 5,
        color: '#ffffff',
        weight: 2,
        fillColor: isFlow ? '#0284c7' : isAcoustic ? '#ea580c' : '#7c3aed',
        fillOpacity: 0.95
      });

      sensorMarker.bindTooltip(`
        <div class="p-2 bg-white text-slate-900 rounded-lg shadow-md border border-slate-200 text-xs font-sans">
          <div class="flex items-center gap-1.5 font-bold ${isFlow ? 'text-sky-700' : 'text-purple-700'}">
            <span>${sensor.sensor_id}</span>
            <span class="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-600">${sensor.type}</span>
          </div>
          <div class="mt-1 font-mono font-bold text-slate-900">
            ${sensor.current_reading} ${sensor.unit}
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">Battery: ${sensor.battery_pct}% • ${sensor.status}</div>
        </div>
      `, { sticky: true });

      group.addLayer(sensorMarker);
    });
  }, [sensors, layers.sensors]);

  // 5. Render Active Leaks & Incident Hotspots Layer
  useEffect(() => {
    const group = leaksGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.activeLeaks) return;

    const leakingPipes = pipes.filter(p => p.has_active_leak);
    leakingPipes.forEach(pipe => {
      if (pipe.path_coordinates.length > 0) {
        // Calculate midpoint of leaking pipe
        const midIdx = Math.floor(pipe.path_coordinates.length / 2);
        const midPoint = pipe.path_coordinates[midIdx];

        // Pulsing leak incident icon
        const pulsingIcon = L.divIcon({
          className: 'leak-pulsing-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></span>
              <span class="relative w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px]">
                💧
              </span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const leakMarker = L.marker([midPoint.lat, midPoint.lng], { icon: pulsingIcon });

        leakMarker.bindPopup(`
          <div class="p-2.5 bg-white text-slate-900 rounded-xl shadow-lg text-xs font-sans max-w-[220px]">
            <div class="flex items-center gap-1.5 text-rose-700 font-bold mb-1">
              <ShieldAlert class="w-4 h-4" />
              <span>Active Burst Signature</span>
            </div>
            <div class="text-[11px] text-slate-600 mb-1">
              Segment: <b class="font-mono text-slate-900">${pipe.pipe_id}</b>
            </div>
            <div class="text-[11px] text-slate-600">
              Material: <b>${pipe.material}</b> (Install Year: ${pipe.install_year})
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
              <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-semibold">Severity: High</span>
              <span class="text-blue-600 font-bold">Crew Dispatched</span>
            </div>
          </div>
        `);

        group.addLayer(leakMarker);
      }
    });
  }, [pipes, layers.activeLeaks]);

  // Toggle helper
  const handleToggleLayer = (key: keyof LayerToggleState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset to full city bounds
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([37.778, -122.412], 13);
    setSelectedPipe(null);
    setSelectedZone(null);
  };

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <div
      id="gis-map-container"
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col shadow-sm select-none"
      style={{ minHeight: height }}
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Multi-Layer Overlay Controls */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-1.5 shadow-md flex flex-wrap items-center gap-1.5 pointer-events-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold px-2 py-0.5 border-r border-slate-200 mr-0.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">GIS Layers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-mono font-bold">
              {activeLayerCount}
            </span>
          </div>

          {/* 1. Pipe Material Toggle / Dimension */}
          <button
            id="toggle-layer-material"
            onClick={() => {
              setLayers(prev => ({ ...prev, pipes: true }));
              setPipeColorDimension('material');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              layers.pipes && pipeColorDimension === 'material'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title="Color pipelines by Material type"
          >
            <Pipette className="w-3.5 h-3.5" />
            <span>Pipe Material</span>
          </button>

          {/* 2. Installation Year Toggle / Dimension */}
          <button
            id="toggle-layer-installation-year"
            onClick={() => {
              setLayers(prev => ({ ...prev, pipes: true }));
              setPipeColorDimension('installationYear');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              layers.pipes && pipeColorDimension === 'installationYear'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title="Color pipelines by Installation Year (Age Vintage)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Install Year</span>
          </button>

          {/* 3. Pressure Zones Toggle */}
          <button
            id="toggle-layer-pressure-zones"
            onClick={() => handleToggleLayer('pressureZones')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              layers.pressureZones
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 opacity-80'
            }`}
            title="Toggle DMA Pressure Zones Overlay"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Pressure Zones</span>
            {layers.pressureZones ? <Check className="w-3 h-3 ml-0.5" /> : null}
          </button>

          {/* 4. IoT Sensors Toggle */}
          <button
            id="toggle-layer-sensors"
            onClick={() => handleToggleLayer('sensors')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              layers.sensors
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 opacity-80'
            }`}
            title="Toggle IoT Flow & Pressure Sensor Markers"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden md:inline">IoT Sensors</span>
            <span className="md:hidden">Sensors</span>
            {layers.sensors ? <Check className="w-3 h-3 ml-0.5" /> : null}
          </button>

          {/* 5. Active Leaks & Incident Hotspots */}
          <button
            id="toggle-layer-leaks"
            onClick={() => handleToggleLayer('activeLeaks')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              layers.activeLeaks
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 opacity-80'
            }`}
            title="Toggle Active Burst Incident Hotspots"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Active Leaks</span>
            <span className="md:hidden">Leaks</span>
            {layers.activeLeaks ? <Check className="w-3 h-3 ml-0.5" /> : null}
          </button>
        </div>

        {/* Right Side: Map Actions & Basemap Switcher */}
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-1 shadow-md flex items-center gap-1 pointer-events-auto text-xs">
          <select
            value={activeBasemap}
            onChange={(e) => setActiveBasemap(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 outline-none text-xs font-medium cursor-pointer"
            title="Change Basemap Style"
          >
            <option value="voyager">Voyager (Light)</option>
            <option value="positron">Positron (Clean)</option>
            <option value="satellite">Satellite Imagery</option>
          </select>

          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Reset to City Extents"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className={`p-1.5 rounded-lg transition-colors ${isLegendOpen ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            title="Toggle Layer Legend"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 min-h-[440px]" />

      {/* Dynamic Context Legend Overlay (Bottom-Right) */}
      {isLegendOpen && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs max-w-xs w-72 pointer-events-auto transition-all animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              GIS Layer Legend
            </span>
            <button
              onClick={() => setIsLegendOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {/* Pipe Material Mode Legend */}
            {layers.pipes && pipeColorDimension === 'material' && (
              <div>
                <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Pipe Material Layer</span>
                  <span className="text-[10px] text-slate-400 font-mono">Stroke Color</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                  {Object.entries(MATERIAL_COLORS).map(([mat, cfg]) => (
                    <div key={mat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                        <span>{mat}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pipes.filter(p => p.material === mat).length} seg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installation Year Mode Legend */}
            {layers.pipes && pipeColorDimension === 'installationYear' && (
              <div>
                <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Installation Era Layer</span>
                  <span className="text-[10px] text-slate-400 font-mono">Pipe Age</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-xs bg-red-500"></span>
                      <span>Pre-1980 (&gt;45 yrs)</span>
                    </div>
                    <span className="text-[10px] font-bold text-red-600">Critical Vintage</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-xs bg-orange-500"></span>
                      <span>1980 - 1999 (25-45 yrs)</span>
                    </div>
                    <span className="text-[10px] text-orange-600">Aged</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-xs bg-yellow-500"></span>
                      <span>2000 - 2014 (10-25 yrs)</span>
                    </div>
                    <span className="text-[10px] text-yellow-600">Transitional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1.5 rounded-xs bg-emerald-500"></span>
                      <span>2015+ (&lt;10 yrs)</span>
                    </div>
                    <span className="text-[10px] text-emerald-600">Modern</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pressure Zones Legend */}
            {layers.pressureZones && (
              <div className="pt-2 border-t border-slate-100">
                <div className="font-semibold text-slate-700 mb-1.5">Pressure Zones (DMAs)</div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-sky-500/20 border border-sky-500"></span>
                    <span>High Pressure (&gt;4.0 bar)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500/20 border border-emerald-500"></span>
                    <span>Nominal Balanced (3.2 - 4.0 bar)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-amber-500/20 border border-amber-500"></span>
                    <span>Low / Controlled (&lt;3.2 bar)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sensors Legend */}
            {layers.sensors && (
              <div className="pt-2 border-t border-slate-100">
                <div className="font-semibold text-slate-700 mb-1.5">IoT Telemetry Nodes</div>
                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-white"></span>
                    <span>Flow Sensor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white"></span>
                    <span>Pressure Sensor</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Pipe Inspector Drawer Overlay (Bottom-Left) */}
      {selectedPipe && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-4 shadow-2xl text-xs max-w-sm w-84 pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Pipette className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-mono font-bold text-sm text-slate-900">{selectedPipe.pipe_id}</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  {selectedPipe.material}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPipe(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700 mb-3">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Diameter</span>
              <span className="font-mono font-bold text-slate-900">{selectedPipe.diameter_mm} mm</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Installation Year</span>
              <span className="font-mono font-bold text-slate-900">{selectedPipe.install_year}</span>
              <span className="text-[9px] text-slate-500 block">({new Date().getFullYear() - selectedPipe.install_year} yrs in service)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Nominal Rating</span>
              <span className="font-mono font-bold text-slate-900">{selectedPipe.nominal_pressure_bar} bar</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Structural Health</span>
              <span className="font-mono font-bold text-amber-700">{selectedPipe.condition_score} / 10</span>
            </div>
          </div>

          {selectedPipe.has_active_leak ? (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="text-[11px] font-semibold">
                Active hydraulic pressure drop detected on this pipeline segment.
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
              <span>Historical leak incidents:</span>
              <span className="font-mono font-bold text-slate-900">{selectedPipe.leak_count_historical} records</span>
            </div>
          )}
        </div>
      )}

      {/* Selected Pressure Zone Inspector Drawer Overlay */}
      {selectedZone && !selectedPipe && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-4 shadow-2xl text-xs max-w-sm w-84 pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Gauge className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-900">{selectedZone.name}</span>
                <span className="block text-[10px] text-slate-500 font-mono">{selectedZone.zone_id}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700 mb-2">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Target Pressure</span>
              <span className="font-mono font-bold text-emerald-700">{selectedZone.target_pressure_bar} bar</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Current Flow</span>
              <span className="font-mono font-bold text-slate-900">{selectedZone.current_flow_m3_h || selectedZone.base_demand_m3_h} m³/h</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">NRW Loss Rate</span>
              <span className="font-mono font-bold text-amber-700">{selectedZone.nrw_rate_pct || 14}%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] block">Served Population</span>
              <span className="font-mono font-bold text-slate-900">{selectedZone.population.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MapComponent;
