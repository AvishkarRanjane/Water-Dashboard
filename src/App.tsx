/**
 * AquaWatch - Main Application Entry Point
 * Orchestrates live telemetry streaming, role permissions, GIS mapping,
 * analytics band charts, maintenance priority queue, and the citizen reporting portal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Maintenance } from './pages/Maintenance';
import { AdminConfig } from './pages/AdminConfig';
import { CitizenPortal } from './pages/CitizenPortal';
import { SimulatorModal } from './components/SimulatorModal';
import { useWebSocket } from './hooks/useWebSocket';
import { API } from './services/api';
import {
  AnomalyEvent,
  CitySummaryStats,
  LeakReport,
  MaintenanceTicket,
  PipeSegment,
  Sensor,
  User,
  Zone
} from './types';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Flame,
  Globe,
  Layers,
  Menu,
  Radio,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  Wrench,
  X
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'analytics' | 'maintenance' | 'admin' | 'citizen'>('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ title: string; message: string; type: 'alert' | 'success' } | null>(null);

  // Application Data State
  const [summary, setSummary] = useState<CitySummaryStats>({
    total_daily_inflow_m3: 63200,
    total_billed_consumption_m3: 49422,
    total_unmetered_loss_m3: 13778,
    nrw_percentage: 21.8,
    nrw_previous_month: 24.2,
    water_saved_to_date_m3: 184500,
    financial_savings_usd: 304425,
    active_anomalies: 2,
    open_tickets: 4,
    total_zones: 5,
    total_sensors: 14,
    system_health_index: 84.5,
    last_updated: new Date().toISOString(),
    total_daily_loss_rate_m3_h: 114.8
  });

  const [zones, setZones] = useState<Zone[]>([]);
  const [pipes, setPipes] = useState<PipeSegment[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [citizenReports, setCitizenReports] = useState<LeakReport[]>([]);
  const [consumptionHistory, setConsumptionHistory] = useState<any[]>([]);

  // User State & Roles
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    user_id: 'usr-sarah',
    name: 'Sarah Chen (Admin)',
    email: 'sarah.chen@aquawatch.city.gov',
    role: 'admin',
    department: 'Hydraulic Systems Operations',
    zone_access: ['ALL'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  });

  // Initial Fetch of Data
  const loadAllData = useCallback(async () => {
    try {
      const [
        summaryRes,
        zonesRes,
        pipesRes,
        sensorsRes,
        anomaliesRes,
        ticketsRes,
        reportsRes,
        usersRes
      ] = await Promise.all([
        API.getCitySummary(),
        API.getZones(),
        API.getPipes(),
        API.getSensors(),
        API.getAnomalies(),
        API.getMaintenanceTickets(),
        API.getCitizenReports(),
        API.getUsers()
      ]);

      setSummary(summaryRes);
      setZones(zonesRes);
      setPipes(pipesRes);
      setSensors(sensorsRes);
      setAnomalies(anomaliesRes);
      setTickets(ticketsRes);
      setCitizenReports(reportsRes);
      setAvailableUsers(usersRes);
      if (usersRes.length > 0 && !currentUser.user_id) {
        setCurrentUser(usersRes[0]);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [currentUser.user_id]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Real-Time WebSocket Telemetry Updates
  const handleWebSocketMessage = useCallback((msg: any) => {
    if (msg.event === 'TELEMETRY_UPDATE') {
      const { summary: newSummary, zones: updatedZones, sensors: updatedSensors } = msg.data;
      if (newSummary) setSummary(newSummary);
      if (updatedZones) setZones(updatedZones);
      if (updatedSensors) setSensors(updatedSensors);
    } else if (msg.event === 'ANOMALY_DETECTED') {
      const newAnomaly: AnomalyEvent = msg.data;
      setAnomalies((prev) => {
        const filtered = prev.filter((a) => a.event_id !== newAnomaly.event_id);
        return [newAnomaly, ...filtered];
      });

      // Show toast alert
      setToastNotification({
        title: `🚨 ${newAnomaly.type} Detected`,
        message: `${newAnomaly.zone_name}: Z-Score +${newAnomaly.z_score}σ, Loss Rate: ${newAnomaly.estimated_loss_rate_m3_h} m³/h`,
        type: 'alert'
      });

      API.getMaintenanceTickets().then(setTickets);
      API.getCitySummary().then(setSummary);
    } else if (msg.event === 'TICKET_UPDATED' || msg.event === 'TICKET_CREATED') {
      const updatedTicket: MaintenanceTicket = msg.data;
      setTickets((prev) => {
        const filtered = prev.filter((t) => t.ticket_id !== updatedTicket.ticket_id);
        return [updatedTicket, ...filtered];
      });
    } else if (msg.event === 'CITIZEN_REPORT_ADDED') {
      const newReport: LeakReport = msg.data;
      setCitizenReports((prev) => [newReport, ...prev]);
      setToastNotification({
        title: '📍 New Public Leak Report',
        message: `${newReport.address} (${newReport.zone_id}) — ${newReport.estimated_surface_flow}`,
        type: 'success'
      });
    }
  }, []);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  const handleSwitchUser = (userId: string) => {
    const found = availableUsers.find((u) => u.user_id === userId);
    if (found) setCurrentUser(found);
  };

  const handleZoneSelectFromMap = (zoneId: string) => {
    setCurrentTab('analytics');
  };

  const handleAnomalySelect = (anomaly: AnomalyEvent) => {
    // Navigate to maintenance or inspect
  };

  const activeAnomaliesCount = anomalies.filter((a) => a.status !== 'resolved').length;

  return (
    <div className="flex h-screen w-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
      {/* 1. Dark Navy Sidebar (Professional Polish Archetype) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-300 md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-base">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none text-white">AquaWatch</h1>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">Urban Water Intelligence</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            id="sidebar-tab-dashboard"
            onClick={() => { setCurrentTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${currentTab === 'dashboard' ? 'bg-white' : 'bg-slate-500'}`} />
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </div>
            {activeAnomaliesCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${currentTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                {activeAnomaliesCount}
              </span>
            )}
          </button>

          <button
            id="sidebar-tab-analytics"
            onClick={() => { setCurrentTab('analytics'); setIsMobileMenuOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
              currentTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${currentTab === 'analytics' ? 'bg-white' : 'bg-slate-500'}`} />
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4" />
              <span>GIS Analytics</span>
            </div>
          </button>

          <button
            id="sidebar-tab-maintenance"
            onClick={() => { setCurrentTab('maintenance'); setIsMobileMenuOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors ${
              currentTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${currentTab === 'maintenance' ? 'bg-white' : 'bg-slate-500'}`} />
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4" />
                <span>Maintenance Queue</span>
              </div>
            </div>
            {tickets.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${currentTab === 'maintenance' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {tickets.length}
              </span>
            )}
          </button>

          <button
            id="sidebar-tab-citizen"
            onClick={() => { setCurrentTab('citizen'); setIsMobileMenuOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
              currentTab === 'citizen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${currentTab === 'citizen' ? 'bg-white' : 'bg-slate-500'}`} />
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4" />
              <span>Citizen Reports</span>
            </div>
          </button>

          <button
            id="sidebar-tab-admin"
            onClick={() => { setCurrentTab('admin'); setIsMobileMenuOpen(false); }}
            className={`w-full px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
              currentTab === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${currentTab === 'admin' ? 'bg-white' : 'bg-slate-500'}`} />
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>System Config</span>
            </div>
          </button>

          {/* Quick Simulation Trigger in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              id="sidebar-btn-simulator"
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Simulate Leak</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1120]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-600">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{currentUser.name.split(' (')[0]}</p>
                <p className="text-[10px] text-slate-400 capitalize truncate">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* User Role Switcher */}
          <select
            value={currentUser.user_id}
            onChange={(e) => handleSwitchUser(e.target.value)}
            className="w-full bg-slate-900 text-slate-300 text-[11px] rounded-md px-2 py-1 border border-slate-700 outline-none cursor-pointer hover:border-slate-500"
            title="Switch user role for access testing"
          >
            {availableUsers.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.role.toUpperCase()}: {u.name.split(' (')[0]}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          availableUsers={availableUsers}
          onSwitchUser={handleSwitchUser}
          isWsConnected={isConnected}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          activeAnomaliesCount={activeAnomaliesCount}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                summary={summary}
                zones={zones}
                sensors={sensors}
                anomalies={anomalies}
                citizenReports={citizenReports}
                onSelectZone={handleZoneSelectFromMap}
                onSelectAnomaly={handleAnomalySelect}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            )}

            {currentTab === 'analytics' && (
              <Analytics
                zones={zones}
                pipes={pipes}
                sensors={sensors}
                anomalies={anomalies}
                consumptionHistory={consumptionHistory}
              />
            )}

            {currentTab === 'maintenance' && (
              <Maintenance
                tickets={tickets}
                citizenReports={citizenReports}
                zones={zones}
                onRefreshData={loadAllData}
              />
            )}

            {currentTab === 'admin' && (
              <AdminConfig
                zones={zones}
                pipes={pipes}
                sensors={sensors}
                users={availableUsers}
                currentUser={currentUser}
                onRefreshData={loadAllData}
              />
            )}

            {currentTab === 'citizen' && (
              <CitizenPortal
                zones={zones}
                onReportSubmitted={(report) => {
                  loadAllData();
                }}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            <span className="font-semibold text-slate-700">AquaWatch</span> — Urban Water Leakage & Loss Detection Intelligence System
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px]">
            <span>ISO 24516-1 Compliant</span>
            <span>•</span>
            <span>EPA WaterSense Water Balance</span>
          </div>
        </footer>
      </div>

      {/* Floating Real-Time Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-[99999] max-w-md bg-white border border-slate-200 rounded-xl p-4 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              toastNotification.type === 'alert'
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            {toastNotification.type === 'alert' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-xs font-bold text-slate-900">{toastNotification.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{toastNotification.message}</p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Leak Simulator Sandbox Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        zones={zones}
        onInjectionSuccess={(scenario) => {
          setIsSimulatorOpen(false);
          setCurrentTab('dashboard');
          loadAllData();
          setToastNotification({
            title: '🚨 Hydraulic Leak Injected & Detected',
            message: 'Real-time Z-score anomaly calculated. Maintenance work order automatically prioritized.',
            type: 'alert'
          });
        }}
      />
    </div>
  );
}

