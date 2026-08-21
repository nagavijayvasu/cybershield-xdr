import React from 'react';
import { User, Shield, CheckCircle } from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  username: string;
  role: string;
}

export default function Topbar({ activeTab, username, role }: TopbarProps) {
  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Security Operations Center (SOC) Overview';
      case 'events': return 'Raw Event Ingestion Logs';
      case 'alerts': return 'Incident Investigation Board';
      case 'incidents': return 'Incident Management Response';
      case 'hosts': return 'Active Enrolled Host Registry';
      case 'iocs': return 'Indicators of Compromise (Threat Intel)';
      case 'detection-rules': return 'Detection Policy Rules';
      case 'settings': return 'System Configurations';
      default: return 'CyberShield Portal';
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'analyst': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <header className="h-16 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Title */}
      <h1 className="text-lg font-semibold tracking-wide text-slate-100">
        {getPageTitle(activeTab)}
      </h1>

      {/* User Status / Info */}
      <div className="flex items-center gap-6">
        {/* System Health Indicators */}
        <div className="flex items-center gap-2 text-xs text-slate-400 border-r border-slate-950 pr-6">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          XDR Sensor Node: Active
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-200">{username}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded-full mt-0.5 ${getRoleColor(role)}`}>
              {role}
            </span>
          </div>
          <div className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
