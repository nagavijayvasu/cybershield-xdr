import { 
  LayoutDashboard, 
  Terminal, 
  AlertTriangle, 
  ShieldAlert, 
  Laptop, 
  Radio, 
  Lock, 
  Settings, 
  LogOut, 
  Activity,
  Users,
  History
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userRole: string;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'events', label: 'Security Events', icon: Terminal, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'alerts', label: 'Alerts Board', icon: AlertTriangle, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'incidents', label: 'Incidents Board', icon: ShieldAlert, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'hosts', label: 'Monitored Hosts', icon: Laptop, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'iocs', label: 'Threat Intel Feeds', icon: Radio, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'detection-rules', label: 'Rules Policy', icon: Lock, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'users', label: 'User Directory', icon: Users, roles: ['admin'] },
    { id: 'audit-logs', label: 'Audit Logs', icon: History, roles: ['admin'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['admin', 'analyst', 'viewer'] },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1">
        {/* Header Branding */}
        <div className="h-16 flex items-center px-6 border-b border-slate-900 gap-3">
          <Activity className="h-6 w-6 text-emerald-500 animate-pulse" />
          <span className="text-lg font-bold tracking-wider text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            CYBERSHIELD XDR
          </span>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer / User Details */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all duration-200"
        >
          <LogOut className="mr-3 h-4 w-4 text-red-400" />
          Terminate Session
        </button>
      </div>
    </div>
  );
}
