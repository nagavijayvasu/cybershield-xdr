import React, { useEffect, useState } from 'react';
import { Laptop, ShieldAlert, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import api from '../api';

interface Host {
  id: number;
  hostname: string;
  ip_address: string;
  operating_system?: string;
  agent_version?: string;
  status: string; // online, offline, isolated
  last_seen: string;
  created_at: string;
}

interface HostsProps {
  userRole: string;
}

export default function Hosts({ userRole }: HostsProps) {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hosts/');
      setHosts(response.data);
    } catch (err) {
      console.error('Failed to query hosts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleIsolateToggle = async (hostId: number, currentStatus: string) => {
    const action = currentStatus === 'isolated' ? 'online' : 'isolated';
    const msg = currentStatus === 'isolated' 
      ? 'Are you sure you want to restore network connectivity and reconnect this host?'
      : 'WARNING: Isolating this host will block network routing and quarantine the device. Proceed?';
      
    if (!window.confirm(msg)) return;

    try {
      const response = await api.patch(`/hosts/${hostId}`, { status: action });
      setHosts(hosts.map((h) => (h.id === hostId ? response.data : h)));
      alert(`Host network status successfully changed to: ${action.toUpperCase()}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle host isolation');
    }
  };

  const isReadOnly = userRole === 'viewer';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Online
          </span>
        );
      case 'isolated':
        return (
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            Isolated
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <Radio className="h-3.5 w-3.5" />
            Offline
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      {/* Top Operations Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Laptop className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-350">Sensor Endpoint Assets</h2>
        </div>
        <button
          onClick={fetchHosts}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Hosts Registry Table */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">ID</th>
              <th className="py-3.5 px-6">Hostname</th>
              <th className="py-3.5 px-6">IP Address</th>
              <th className="py-3.5 px-6">Operating System</th>
              <th className="py-3.5 px-6">Sensor Ver</th>
              <th className="py-3.5 px-6">Endpoint State</th>
              <th className="py-3.5 px-6">Last Active Heartbeat</th>
              <th className="py-3.5 px-6 text-center">Quarantine Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {loading && hosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Running active sensor node discovery...</td>
              </tr>
            ) : hosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-650">No endpoints are currently enrolled in CyberShield XDR. Connect the python agent.</td>
              </tr>
            ) : (
              hosts.map((host) => (
                <tr key={host.id} className="hover:bg-slate-950/40">
                  <td className="py-4 px-6 font-mono text-slate-500">{host.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-200">{host.hostname}</td>
                  <td className="py-4 px-6 font-mono text-slate-400">{host.ip_address}</td>
                  <td className="py-4 px-6 text-slate-350">{host.operating_system || 'Generic System'}</td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">{host.agent_version || '1.0.0'}</td>
                  <td className="py-4 px-6">{getStatusBadge(host.status)}</td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-500">
                    {new Date(host.last_seen).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleIsolateToggle(host.id, host.status)}
                      disabled={isReadOnly}
                      className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
                        host.status === 'isolated'
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25'
                          : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25'
                      } disabled:opacity-30`}
                    >
                      {host.status === 'isolated' ? 'Quarantine Restore' : 'Quarantine Isolate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
