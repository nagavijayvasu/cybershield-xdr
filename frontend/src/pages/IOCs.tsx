import React, { useEffect, useState } from 'react';
import { Radio, Plus, Trash2, Search, Skull } from 'lucide-react';
import api from '../api';

interface Ioc {
  id: number;
  type: string;
  value: string;
  description?: string;
  severity: string;
  created_at: string;
}

interface IocsProps {
  userRole: string;
}

export default function Iocs({ userRole }: IocsProps) {
  const [iocs, setIocs] = useState<Ioc[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // New IOC state
  const [newType, setNewType] = useState<'IP' | 'DOMAIN' | 'URL' | 'HASH' | 'EMAIL'>('IP');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [addLoading, setAddLoading] = useState(false);

  const fetchIocs = async () => {
    setLoading(true);
    try {
      let url = '/iocs?limit=100';
      if (typeFilter) url += `&type_filter=${typeFilter}`;
      const response = await api.get(url);
      setIocs(response.data);
    } catch (err) {
      console.error('Failed to query IOCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, [typeFilter]);

  const handleAddIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;
    setAddLoading(true);

    try {
      const response = await api.post('/iocs/', {
        type: newType,
        value: newValue.trim(),
        description: newDesc.trim(),
        severity: newSeverity
      });
      setIocs([response.data, ...iocs]);
      setNewValue('');
      setNewDesc('');
      alert('Indicator of Compromise added to threat database successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add indicator');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteIoc = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this Threat Intel indicator?')) return;

    try {
      await api.delete(`/iocs/${id}`);
      setIocs(iocs.filter((ioc) => ioc.id !== id));
      alert('Indicator successfully deleted!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete indicator');
    }
  };

  const isReadOnly = userRole === 'viewer';

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'LOW': return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      default: return 'text-slate-450 bg-slate-500/10 border border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* List Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filtering */}
        <div className="glass p-5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skull className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">Threat Intelligence Indicators</h3>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-350 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Indicators</option>
              <option value="IP">IP Address</option>
              <option value="DOMAIN">Domain Name</option>
              <option value="URL">URL Link</option>
              <option value="HASH">MD5 / SHA File Hash</option>
              <option value="EMAIL">Email Address</option>
            </select>
          </div>
        </div>

        {/* IOC Table */}
        <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Value</th>
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Registered</th>
                {!isReadOnly && <th className="py-3.5 px-6 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading && iocs.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Running threat intelligence query...</td>
                </tr>
              ) : iocs.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="py-12 text-center text-xs text-slate-650">No Threat Intel feeds populated. Register bad IPs or Hashes.</td>
                </tr>
              ) : (
                iocs.map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-slate-950/40">
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                        {ioc.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-200 select-all">{ioc.value}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold px-2 py-0.5 uppercase rounded border ${getSeverityStyle(ioc.severity)}`}>
                        {ioc.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs truncate max-w-[140px]" title={ioc.description}>{ioc.description || 'No context'}</td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-500">
                      {new Date(ioc.created_at).toLocaleDateString()}
                    </td>
                    {!isReadOnly && (
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteIoc(ioc.id)}
                          className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-red-400 rounded-lg transition-all duration-150"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Area */}
      <div className="glass p-6 rounded-2xl border border-slate-900 flex flex-col space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <Plus className="h-5 w-5 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 font-mono">Register Threat Indicator</h3>
        </div>

        {isReadOnly ? (
          <p className="text-xs text-slate-500">Read-only account. Threat intelligence creations require an Analyst profile.</p>
        ) : (
          <form onSubmit={handleAddIoc} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Indicator Type</label>
              <select
                value={newType}
                onChange={(e: any) => setNewType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-slate-250 focus:outline-none"
              >
                <option value="IP">IP Address</option>
                <option value="DOMAIN">Domain Name</option>
                <option value="URL">URL Link</option>
                <option value="HASH">MD5 / SHA File Hash</option>
                <option value="EMAIL">Email Address</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Threat Value</label>
              <input
                type="text"
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 185.220.101.5 or badshell.php hash"
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-slate-250 placeholder-slate-650 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Feeds / Intelligence Notes</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Detail C2 campaigns, attribution, and threat groups..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-slate-250 placeholder-slate-650 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Priority Severity</label>
              <select
                value={newSeverity}
                onChange={(e: any) => setNewSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-slate-250 focus:outline-none"
              >
                <option value="INFO">INFO</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-3 rounded-lg shadow uppercase tracking-wider text-[11px] font-mono"
            >
              {addLoading ? 'Deploying...' : 'Register Indicator'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
