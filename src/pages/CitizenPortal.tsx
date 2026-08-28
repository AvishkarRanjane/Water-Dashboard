/**
 * AquaWatch - Citizen Public Leak Reporting Portal (Professional Polish)
 * Public access portal for reporting observed street leaks, photo uploads,
 * automated spatial DMA assignment, and live repair ticket tracking by Reference ID.
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Droplet,
  Droplets,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  QrCode,
  Search,
  Send,
  Sparkles,
  Upload,
  UserCheck,
  Wrench
} from 'lucide-react';
import { LeakReport, SurfaceFlowSeverity, Zone } from '../types';
import { API } from '../services/api';

interface CitizenPortalProps {
  zones: Zone[];
  onReportSubmitted?: (report: LeakReport) => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({ zones, onReportSubmitted }) => {
  // Form State
  const [address, setAddress] = useState<string>('480 Market St, Financial District');
  const [description, setDescription] = useState<string>('Clean water bubbling through asphalt near the crosswalk. High volume running into storm drain.');
  const [surfaceFlow, setSurfaceFlow] = useState<SurfaceFlowSeverity>('Active Geyser/Rupture');
  const [lat, setLat] = useState<number>(37.7885);
  const [lng, setLng] = useState<number>(-122.404);
  const [zoneId, setZoneId] = useState<string>('zone-central');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<LeakReport | null>(null);

  // Status Lookup State
  const [lookupQuery, setLookupQuery] = useState<string>('REP-8492');
  const [lookupResult, setLookupResult] = useState<LeakReport | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const samplePhotos = [
    {
      label: 'Street Gushing Burst',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
      flow: 'Active Geyser/Rupture' as SurfaceFlowSeverity
    },
    {
      label: 'Curb Seepage',
      url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
      flow: 'Trickle/Slow Stream' as SurfaceFlowSeverity
    },
    {
      label: 'Sidewalk Puddle / Joint Creep',
      url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?w=600&auto=format&fit=crop&q=80',
      flow: 'Puddle/Damp Ground' as SurfaceFlowSeverity
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const report = await API.submitCitizenReport({
        address,
        description,
        estimated_surface_flow: surfaceFlow,
        location: { lat, lng },
        zone_id: zoneId,
        photo_url: photoUrl
      });
      setSubmissionSuccess(report);
      if (onReportSubmitted) onReportSubmitted(report);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await API.getCitizenReportById(lookupQuery.trim().toUpperCase());
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(`No record found for tracking ID "${lookupQuery}". Try "REP-8492" or "REP-5102".`);
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Public Community Water Stewardship</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Report a Water Leak in Your Neighborhood
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Help municipal engineers conserve clean treated water. Every report is matched with real-time pressure & acoustic sensors for rapid emergency dispatch.
        </p>
      </div>

      {/* Main 2-Column: Form (Left) & Lookup (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Leak Report Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Submit New Public Observation</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">No Login Required</span>
          </div>

          {submissionSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Thank You! Report Received</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your report has been logged and assigned to DMA sector <b>{submissionSuccess.zone_id}</b>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono space-y-1">
                <span className="text-xs text-slate-500">Tracking Reference Code:</span>
                <div className="text-xl font-extrabold text-blue-700 tracking-wider">
                  {submissionSuccess.report_id}
                </div>
              </div>

              {submissionSuccess.cross_referenced_with_sensor && (
                <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-900 text-left flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <b>Sensor Correlation Confirmed!</b> Acoustic flow telemetry in this zone already flagged anomalous demand. Dispatch priority increased by +10 pts.
                  </span>
                </div>
              )}

              <button
                onClick={() => setSubmissionSuccess(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Location Address */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Street Address or Landmark:</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 480 Market St, near 1st Ave"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Distribution Zone Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City District / Zone:</label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-blue-500"
                  >
                    {zones.map(z => (
                      <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Visual Flow Intensity:</label>
                  <select
                    value={surfaceFlow}
                    onChange={(e) => setSurfaceFlow(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-amber-800 outline-none font-semibold focus:border-blue-500"
                  >
                    <option value="Active Geyser/Rupture">🚨 Active Geyser / Street Rupture</option>
                    <option value="Street Flooding / River">🌊 Street Flooding / Rapid Runoff</option>
                    <option value="Trickle/Slow Stream">💧 Trickle / Constant Stream</option>
                    <option value="Puddle/Damp Ground">🌧️ Puddle / Continuous Damp Ground</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Observation Details:</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe where the water is coming from (curb, manhole, asphalt crack)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {/* Photo Upload / Preset Select */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Attach Photo Proof (Click Preset or Upload):</span>
                  </span>
                </label>

                {/* Preset thumbnail pickers */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {samplePhotos.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setPhotoUrl(p.url);
                        setSurfaceFlow(p.flow);
                      }}
                      className={`relative rounded-lg overflow-hidden border p-1 text-left transition-all ${
                        photoUrl === p.url ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50' : 'border-slate-200 bg-slate-50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-14 object-cover rounded" referrerPolicy="no-referrer" />
                      <div className="text-[10px] text-slate-700 font-semibold mt-1 truncate">{p.label}</div>
                    </button>
                  ))}
                </div>

                {/* Custom URL Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-mono text-[11px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  id="btn-submit-citizen-report"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting to Utility...' : 'Transmit Leak Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right 5 Cols: Track Status by Tracking ID */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Track Existing Report Status</h2>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enter your tracking reference ID to check real-time technician dispatch, verification status, and estimated repair resolution.
            </p>

            <form onSubmit={handleLookup} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. REP-8492"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-700 font-mono font-bold uppercase outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {lookupLoading ? 'Searching...' : 'Lookup'}
                </button>
              </div>

              {/* Preset quick buttons */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>Try sample:</span>
                <button
                  type="button"
                  onClick={() => setLookupQuery('REP-8492')}
                  className="text-blue-600 font-mono underline hover:text-blue-700"
                >
                  REP-8492
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setLookupQuery('REP-5102')}
                  className="text-blue-600 font-mono underline hover:text-blue-700"
                >
                  REP-5102
                </button>
              </div>
            </form>

            {lookupError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {lookupError}
              </div>
            )}

            {/* Display Lookup Results */}
            {lookupResult && (
              <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-mono font-bold text-blue-700">{lookupResult.report_id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {lookupResult.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <div><span className="text-slate-500 font-medium">Address:</span> {lookupResult.address}</div>
                  <div><span className="text-slate-500 font-medium">Intensity:</span> <span className="text-amber-700 font-semibold">{lookupResult.estimated_surface_flow}</span></div>
                  <div><span className="text-slate-500 font-medium">Reported At:</span> {new Date(lookupResult.created_at).toLocaleString()}</div>
                </div>

                {lookupResult.cross_referenced_with_sensor && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>Cross-Verified with Sensor Telemetry!</b> Correlated with anomaly in {lookupResult.zone_id}.</span>
                  </div>
                )}

                {lookupResult.linked_ticket_id && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Assigned Work Order:</span>
                    <span className="font-mono font-bold text-blue-700">{lookupResult.linked_ticket_id}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Emergency hotline: (800) 555-LEAK • 24/7 Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

