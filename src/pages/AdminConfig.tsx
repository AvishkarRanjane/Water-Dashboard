/**
 * AquaWatch - Admin & Configuration Portal (Professional Polish)
 * Sensor/Zone registry management, per-zone anomaly threshold sensitivity sliders,
 * and user role permissions.
 */

import React, { useState } from 'react';
import {
  Check,
  Cpu,
  Edit,
  Layers,
  Plus,
  Radio,
  Save,
  Settings,
  Shield,
  Sliders,
  UserCheck,
  Users,
  Wrench
} from 'lucide-react';
import { PipeSegment, Sensor, User, Zone, ZoneSensitivityConfig } from '../types';
import { API } from '../services/api';

interface AdminConfigProps {
  zones: Zone[];
  pipes: PipeSegment[];
  sensors: Sensor[];
  users: User[];
  currentUser: User;
  onRefreshData: () => void;
}

export const AdminConfig: React.FC<AdminConfigProps> = ({
  zones,
  pipes,
  sensors,
  users,
  currentUser,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'thresholds' | 'sensors' | 'pipes' | 'users'>('thresholds');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-central');

  // Zone threshold state
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.3);
  const [windowMinutes, setWindowMinutes] = useState<number>(30);
  const [minDeviationPct, setMinDeviationPct] = useState<number>(12);
  const [nightMultiplier, setNightMultiplier] = useState<number>(1.3);
  const [autoTicketScore, setAutoTicketScore] = useState<number>(70);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // New Sensor form state
  const [showAddSensor, setShowAddSensor] = useState<boolean>(false);
  const [sensorType, setSensorType] = useState<'flow' | 'pressure'>('flow');
  const [sensorZone, setSensorZone] = useState<string>('zone-central');
  const [sensorLat, setSensorLat] = useState<number>(37.785);
  const [sensorLng, setSensorLng] = useState<number>(-122.41);

  // New User form state
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<'admin' | 'utility_staff' | 'viewer'>('utility_staff');
  const [userDept, setUserDept] = useState<string>('Field Operations');

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const cfg = zones.find(z => z.zone_id === zoneId)?.sensitivity_config as ZoneSensitivityConfig | undefined;
    if (cfg) {
      setZScoreThreshold(cfg.z_score_threshold || 2.5);
      setWindowMinutes(cfg.rolling_window_minutes || 30);
      setMinDeviationPct(cfg.min_flow_deviation_pct || 15);
      setNightMultiplier(cfg.night_flow_multiplier || 1.25);
      setAutoTicketScore(cfg.auto_ticket_threshold || 75);
    }
    setIsSaved(false);
  };

  const handleSaveThresholds = async () => {
    try {
      await API.updateZoneSensitivity(selectedZoneId, {
        z_score_threshold: zScoreThreshold,
        rolling_window_minutes: windowMinutes,
        min_flow_deviation_pct: minDeviationPct,
        night_flow_multiplier: nightMultiplier,
        auto_ticket_threshold: autoTicketScore
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      onRefreshData();
    } catch (err) {
      console.error('Failed to save thresholds:', err);
    }
  };

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.createSensor({
        type: sensorType,
        zone_id: sensorZone,
        location: { lat: sensorLat, lng: sensorLng }
      });
      setShowAddSensor(false);
      onRefreshData();
    } catch (err) {
      console.error('Failed to add sensor:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.createUser({
        name: userName,
        email: userEmail,
        role: userRole,
        department: userDept,
        zone_access: ['ALL']
      });
      setShowAddUser(false);
      setUserName('');
      setUserEmail('');
      onRefreshData();
    } catch (err) {
      console.error('Failed to add user:', err);
    }
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Admin, Registry & Sensitivity Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statistical detection sensitivity, IoT sensor inventory, and role-based permissions
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveSubTab('thresholds')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'thresholds' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sensitivity Thresholds
          </button>
          <button
            onClick={() => setActiveSubTab('sensors')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'sensors' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sensors ({sensors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('pipes')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'pipes' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pipe Segments ({pipes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'users' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users & Roles ({users.length})
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>You are logged in as <b>{currentUser.role.toUpperCase()}</b>. Admin privileges are required to save changes. Use the role switcher in the header to switch to Admin if testing configuration writes.</span>
        </div>
      )}

      {/* 1. Threshold Configuration */}
      {activeSubTab === 'thresholds' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Zone Statistical Anomaly Threshold Tuning</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calibrate rolling Z-score parameters and auto-dispatch sensitivity per District Metered Area
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedZoneId}
                onChange={(e) => handleZoneSelect(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none font-semibold focus:border-blue-500"
              >
                {zones.map(z => (
                  <option key={z.zone_id} value={z.zone_id}>{z.name}</option>
                ))}
              </select>

              <button
                id="btn-save-thresholds"
                onClick={handleSaveThresholds}
                disabled={!isAdmin}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Saved!' : 'Save Config'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Z-Score Threshold */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between font-mono">
                <span className="text-slate-800 font-semibold">Z-Score Trigger Threshold (σ):</span>
                <span className="text-blue-700 font-bold text-sm">+{zScoreThreshold} σ</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={zScoreThreshold}
                onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Number of standard deviations from the 30-min rolling mean required to trigger a leak flag.
              </p>
            </div>

            {/* Min Flow Deviation % */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between font-mono">
                <span className="text-slate-800 font-semibold">Minimum Flow Deviation (%):</span>
                <span className="text-amber-700 font-bold text-sm">+{minDeviationPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={minDeviationPct}
                onChange={(e) => setMinDeviationPct(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Minimum percentage excess above diurnal baseline to filter out minor residential spikes.
              </p>
            </div>

            {/* Night Flow Multiplier */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between font-mono">
                <span className="text-slate-800 font-semibold">Night Window Sensitivity Boost:</span>
                <span className="text-purple-700 font-bold text-sm">{nightMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={nightMultiplier}
                onChange={(e) => setNightMultiplier(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Lowers threshold during 02:00-05:00 AM (Night Minimum Flow) to detect subtle underground leaks early.
              </p>
            </div>

            {/* Auto Ticket Generation Threshold */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between font-mono">
                <span className="text-slate-800 font-semibold">Auto-Dispatch Priority Cutoff:</span>
                <span className="text-rose-700 font-bold text-sm">{autoTicketScore} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={autoTicketScore}
                onChange={(e) => setAutoTicketScore(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Tickets are automatically provisioned in dispatch queue when calculated priority exceeds this score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sensor Registry */}
      {activeSubTab === 'sensors' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>IoT Sensor Telemetry Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Installed electromagnetic flow meters, acoustic hydrophones, and piezo pressure transducers
              </p>
            </div>
            <button
              onClick={() => setShowAddSensor(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Sensor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 font-mono border-b border-slate-200 uppercase bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3">Sensor ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Reading</th>
                  <th className="py-2.5 px-3 text-right">Battery</th>
                  <th className="py-2.5 px-3 text-right">Sampling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {sensors.map(s => (
                  <tr key={s.sensor_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-blue-700">{s.sensor_id}</td>
                    <td className="py-3 px-3 capitalize font-sans">{s.type} meter</td>
                    <td className="py-3 px-3 font-sans text-slate-800">{s.zone_id}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {s.current_reading} {s.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 font-semibold">{s.battery_pct}%</td>
                    <td className="py-3 px-3 text-right text-slate-500">{s.sampling_rate_sec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Pipe Segments Registry */}
      {activeSubTab === 'pipes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Water Transmission & Sub-Main Pipeline Asset Registry</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical pipeline infrastructure attributes and structural health scores
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 font-mono border-b border-slate-200 uppercase bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3">Pipe ID</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3 text-right">Diameter</th>
                  <th className="py-2.5 px-3 text-right">Installed</th>
                  <th className="py-2.5 px-3 text-right">Condition</th>
                  <th className="py-2.5 px-3 text-right">Historic Leaks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {pipes.map(p => (
                  <tr key={p.pipe_id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-blue-700">{p.pipe_id}</td>
                    <td className="py-3 px-3 font-sans">{p.zone_id}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{p.material}</td>
                    <td className="py-3 px-3 text-right">{p.diameter_mm} mm</td>
                    <td className="py-3 px-3 text-right">{p.install_year}</td>
                    <td className="py-3 px-3 text-right font-bold text-amber-700">{p.condition_score}/10</td>
                    <td className="py-3 px-3 text-right">{p.leak_count_historical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. User and Role Management */}
      {activeSubTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>User Roles & Authorization Control</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-based access: Admin (Full control), Utility Staff (Dispatch & repairs), Viewer (Auditing)
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.map(u => (
              <div key={u.user_id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{u.department}</div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Role:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    u.role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-200' : u.role === 'utility_staff' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {showAddSensor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Register New IoT Telemetry Sensor</h3>
            <form onSubmit={handleAddSensor} className="space-y-3.5">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Sensor Type:</label>
                <select
                  value={sensorType}
                  onChange={(e) => setSensorType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="flow">Electromagnetic Flow Meter (m³/h)</option>
                  <option value="pressure">Piezoresistive Pressure Transducer (bar)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Zone:</label>
                <select
                  value={sensorZone}
                  onChange={(e) => setSensorZone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorLat}
                    onChange={(e) => setSensorLat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={sensorLng}
                    onChange={(e) => setSensorLng(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddSensor(false)} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs">Add Sensor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Add Utility Staff Member</h3>
            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Jason Blake"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="j.blake@metrowater.gov"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Role:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="utility_staff">Utility Staff (Field Dispatch)</option>
                  <option value="viewer">Viewer (Auditor / Read-Only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

