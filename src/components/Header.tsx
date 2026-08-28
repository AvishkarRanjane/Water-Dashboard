/**
 * AquaWatch - Header Navigation & Operations Bar (Professional Polish)
 */

import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Droplets,
  Flame,
  Globe,
  Menu,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench
} from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'analytics' | 'maintenance' | 'admin' | 'citizen';
  onSelectTab: (tab: 'dashboard' | 'analytics' | 'maintenance' | 'admin' | 'citizen') => void;
  currentUser: User;
  availableUsers: User[];
  onSwitchUser: (userId: string) => void;
  isWsConnected: boolean;
  onOpenSimulator: () => void;
  activeAnomaliesCount: number;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  availableUsers,
  onSwitchUser,
  isWsConnected,
  onOpenSimulator,
  activeAnomaliesCount,
  onToggleMobileMenu
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'District Operations Command';
      case 'analytics': return 'GIS Infrastructure & Hydraulic Analytics';
      case 'maintenance': return 'Priority Maintenance & Work Orders';
      case 'admin': return 'System Calibration & Asset Registry';
      case 'citizen': return 'Citizen Public Leak Portal';
      default: return 'Water Loss Intelligence';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 text-slate-900 shrink-0 sticky top-0 z-40 shadow-xs">
      {/* Left: Mobile Menu & Operation Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
            {getTabTitle()}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
          </span>
        </div>
      </div>

      {/* Right Tools: Telemetry Status, Role Switcher & Simulator Button */}
      <div className="flex items-center gap-3">
        {/* Telemetry Stream Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-600 font-medium">
            {isWsConnected ? 'Live Sensor Sync' : 'Reconnecting...'}
          </span>
        </div>

        {/* Quick Simulator Trigger */}
        <button
          id="btn-open-simulator"
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          title="Inject simulated leak scenario for live evaluation"
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Simulate Leak</span>
        </button>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 shrink-0">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          <select
            value={currentUser.user_id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="bg-transparent text-slate-700 text-xs font-medium outline-none cursor-pointer pr-1"
            title="Switch user role for access testing"
          >
            {availableUsers.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.role.toUpperCase()}: {u.name.split(' (')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

