import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  AlertTriangle, 
  ShieldCheck, 
  Laptop,
  Flame,
  Globe,
  TrendingUp,
  Skull
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import api from '../api';

interface SummaryData {
  total_events: number;
  active_alerts: number;
  open_incidents: number;
  total_hosts: number;
  online_hosts: number;
}

interface EventTimeline {
  date: string;
  count: number;
}

interface SeverityBreakdown {
  severity: string;
  count: number;
}

interface TopIP {
  source_ip: string;
  count: number;
}

interface TopHost {
  hostname: string;
  count: number;
}

interface MitreTechnique {
  technique: string;
  tactic: string;
  count: number;
}

interface RecentAlert {
  id: number;
  title: string;
  severity: string;
  source_ip: string;
  status: string;
  mitre_technique: string;
  created_at: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryData>({
    total_events: 0,
    active_alerts: 0,
    open_incidents: 0,
    total_hosts: 0,
    online_hosts: 0,
  });
  const [timeline, setTimeline] = useState<EventTimeline[]>([]);
  const [severities, setSeverities] = useState<SeverityBreakdown[]>([]);
  const [topIPs, setTopIPs] = useState<TopIP[]>([]);
  const [topHosts, setTopHosts] = useState<TopHost[]>([]);
  const [mitre, setMitre] = useState<MitreTechnique[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [
        sumRes,
        timeRes,
        sevRes,
        ipRes,
        hostRes,
        mitreRes,
        alertsRes
      ] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/events-over-time'),
        api.get('/dashboard/alerts-by-severity'),
        api.get('/dashboard/top-source-ips'),
        api.get('/dashboard/top-attacked-hosts'),
        api.get('/dashboard/mitre-techniques'),
        api.get('/alerts?limit=5')
      ]);

      setSummary(sumRes.data);
      setTimeline(timeRes.data);
      setSeverities(sevRes.data);
      setTopIPs(ipRes.data);
      setTopHosts(hostRes.data);
      setMitre(mitreRes.data);
      setRecentAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Auto refresh metrics every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const SEVERITY_COLORS: { [key: string]: string } = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
    INFO: '#10b981'
  };

  const getAlertSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#050811] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">Aggregating Security Metrics...</span>
        </div>
      </div>
    );
  }

  // Fallback charts content in case data is empty
  const formattedSeverityData = severities.length > 0 ? severities : [
    { severity: 'INFO', count: 0 },
    { severity: 'LOW', count: 0 },
    { severity: 'MEDIUM', count: 0 },
    { severity: 'HIGH', count: 0 },
    { severity: 'CRITICAL', count: 0 },
  ];

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Events */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Telemetry</p>
            <h3 className="text-xl font-bold mt-1 text-slate-200">{summary.total_events}</h3>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Alerts</p>
            <h3 className="text-xl font-bold mt-1 text-slate-200">{summary.active_alerts}</h3>
          </div>
          {summary.active_alerts > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
          )}
        </div>

        {/* Open Incidents */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Open Incidents</p>
            <h3 className="text-xl font-bold mt-1 text-slate-200">{summary.open_incidents}</h3>
          </div>
          {summary.open_incidents > 0 && (
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
          )}
        </div>

        {/* Total Enrolled Hosts */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Monitored Hosts</p>
            <h3 className="text-xl font-bold mt-1 text-slate-200">{summary.total_hosts}</h3>
          </div>
        </div>

        {/* Online Hosts */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Online Agents</p>
            <h3 className="text-xl font-bold mt-1 text-slate-200">
              {summary.online_hosts} <span className="text-xs text-slate-500 font-normal">/ {summary.total_hosts}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingestion volume Timeline */}
        <div className="glass p-6 rounded-2xl lg:col-span-2 border border-slate-900 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-semibold tracking-wider uppercase text-slate-300">Event Ingestion Rate (Timeline)</h4>
          </div>
          <div className="h-72 w-full">
            {timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-600">No events logged yet. Ingest telemetry from endpoint agents.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="count" name="Event Count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity distribution */}
        <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="h-4 w-4 text-red-400" />
            <h4 className="text-sm font-semibold tracking-wider uppercase text-slate-300">Alerts Severity Breakdown</h4>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            {severities.length === 0 ? (
              <div className="text-xs text-slate-600">No active alerts generated.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedSeverityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {formattedSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lists Row: Attacker IPs, MITRE, Attacked Hosts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Top Malicious Source IPs */}
        <div className="glass p-6 rounded-2xl border border-slate-900">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-900 pb-3">
            <Globe className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Top Attacking Source IPs</h4>
          </div>
          <div className="space-y-4">
            {topIPs.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No attacking IP metadata recorded.</div>
            ) : (
              topIPs.map((ip, i) => (
                <div key={ip.source_ip} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-300">{ip.source_ip}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {ip.count} events
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Attacked Hosts */}
        <div className="glass p-6 rounded-2xl border border-slate-900">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-900 pb-3">
            <Laptop className="h-4 w-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Top Targeted Hosts</h4>
          </div>
          <div className="space-y-4">
            {topHosts.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No targeted host alerts recorded.</div>
            ) : (
              topHosts.map((host, i) => (
                <div key={host.hostname} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-300">{host.hostname}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                    {host.count} alerts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MITRE ATT&CK Matrix Techniques */}
        <div className="glass p-6 rounded-2xl border border-slate-900">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-900 pb-3">
            <Skull className="h-4 w-4 text-red-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">MITRE ATT&CK Detections</h4>
          </div>
          <div className="space-y-4">
            {mitre.length === 0 ? (
              <div className="text-xs text-slate-600 text-center py-6">No mapped MITRE techniques detected yet.</div>
            ) : (
              mitre.map((item) => (
                <div key={item.technique} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-300">{item.technique}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">{item.tactic}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {item.count} hits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Recent Alerts Board */}
      <div className="glass p-6 rounded-2xl border border-slate-900">
        <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">Critical Recent Alerts Feed</h4>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">MITRE Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-600">No recent alerts. Active sensor nodes report zero compromises.</td>
                </tr>
              ) : (
                recentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-300">{alert.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getAlertSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{alert.source_ip || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-bold text-red-400">{alert.mitre_technique || 'N/A'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
