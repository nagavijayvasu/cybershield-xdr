import React, { useEffect, useState } from 'react';
import { AlertTriangle, Search, Eye, ShieldAlert, CheckCircle, HelpCircle, UserCheck } from 'lucide-react';
import api from '../api';

interface Alert {
  id: number;
  event_id?: number;
  rule_id?: number;
  host_id: number;
  incident_id?: number;
  ioc_id?: number;
  title: string;
  description: string;
  severity: string;
  source_ip?: string;
  status: string;
  confidence: number;
  mitre_tactic?: string;
  mitre_technique?: string;
  created_at: string;
  updated_at: string;
}

interface AlertsProps {
  userRole: string;
}

export default function Alerts({ userRole }: AlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Detail Modal
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Escalate state
  const [escalateTitle, setEscalateTitle] = useState('');
  const [escalateDesc, setEscalateDesc] = useState('');
  const [escalateSeverity, setEscalateSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [escalateLoading, setEscalateLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = '/alerts?limit=100';
      if (severityFilter) url += `&severity_filter=${severityFilter}`;
      if (statusFilter) url += `&status_filter=${statusFilter}`;
      
      const response = await api.get(url);
      setAlerts(response.data);
    } catch (err) {
      console.error('Failed to query alerts feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await api.patch(`/alerts/${id}`, { status: newStatus });
      // Update local state
      setAlerts(alerts.map((a) => (a.id === id ? response.data : a)));
      setSelectedAlert(response.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update alert status');
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setEscalateLoading(true);

    try {
      // 1. Create Incident linking this alert
      const response = await api.post('/incidents/', {
        title: escalateTitle || `Incident: ${selectedAlert.title}`,
        description: escalateDesc || selectedAlert.description,
        severity: escalateSeverity,
        alert_ids: [selectedAlert.id]
      });

      // 2. Fetch updated alert
      const alertResponse = await api.get(`/alerts/${selectedAlert.id}`);
      setAlerts(alerts.map((a) => (a.id === selectedAlert.id ? alertResponse.data : a)));
      setSelectedAlert(alertResponse.data);
      
      // Clear forms
      setEscalateTitle('');
      setEscalateDesc('');
      alert(`Alert successfully escalated to Incident #${response.data.id}!`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to escalate alert');
    } finally {
      setEscalateLoading(false);
    }
  };

  const isReadOnly = userRole === 'viewer';

  const getAlertSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      {/* Filtering Header */}
      <div className="glass p-5 rounded-2xl border border-slate-900 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
            </select>
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-850 rounded-xl transition-all duration-200"
        >
          Refresh Feed
        </button>
      </div>

      {/* Alerts Grid Table */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">ID</th>
              <th className="py-3.5 px-6">Title</th>
              <th className="py-3.5 px-6">Severity</th>
              <th className="py-3.5 px-6">Source IP</th>
              <th className="py-3.5 px-6">MITRE Technique</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Escalated</th>
              <th className="py-3.5 px-6 text-center">Triage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Polling active sensors for alerts...</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-650">No active alerts recorded. Host posture is fully secure.</td>
              </tr>
            ) : (
              alerts.map((al) => (
                <tr key={al.id} className="hover:bg-slate-950/40">
                  <td className="py-4 px-6 font-mono text-slate-500">{al.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-200">{al.title}</td>
                  <td className="py-4 px-6">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase ${getAlertSeverityBadge(al.severity)}`}>
                      {al.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-400">{al.source_ip || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs font-bold text-red-400">{al.mitre_technique || '-'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium text-slate-350 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
                      {al.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-450">
                    {al.incident_id ? (
                      <span className="text-emerald-400 font-bold">Incident #{al.incident_id}</span>
                    ) : (
                      <span className="text-slate-600">No</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setSelectedAlert(al)}
                      className="p-1.5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-emerald-400 rounded-lg transition-all duration-150"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Triage Detail Slideout/Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 px-6 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                Alert Analyst Investigation: ID {selectedAlert.id}
              </span>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-xs font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Alert Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{selectedAlert.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Ingested on host: ID {selectedAlert.host_id}</p>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block border-b border-slate-800 pb-1">Telemetry Summary</span>
                  <p className="text-slate-300 leading-relaxed">{selectedAlert.description}</p>
                </div>

                {/* Severity, Confidence, MITRE Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Confidence</span>
                    <span className="text-sm font-bold text-slate-300">{selectedAlert.confidence}%</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Attacker IP</span>
                    <span className="text-sm font-mono text-slate-300">{selectedAlert.source_ip || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">MITRE Tactic</span>
                    <span className="text-xs font-semibold text-slate-300">{selectedAlert.mitre_tactic || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">MITRE Technique</span>
                    <span className="text-xs font-mono font-bold text-red-400">{selectedAlert.mitre_technique || 'N/A'}</span>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Update Alert Status</span>
                  <div className="flex flex-wrap gap-2">
                    {['NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => handleStatusChange(selectedAlert.id, statusOption)}
                        disabled={isReadOnly || selectedAlert.status === statusOption}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all duration-150 ${
                          selectedAlert.status === statusOption
                            ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        } disabled:opacity-50`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Escalation Area */}
              <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <ShieldAlert className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Escalate to Security Incident</h4>
                </div>

                {selectedAlert.incident_id ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-bold block">Incident Created</span>
                      This threat is currently active under Incident #{selectedAlert.incident_id}. Use the Incidents tab to coordinate response procedures.
                    </div>
                  </div>
                ) : isReadOnly ? (
                  <p className="text-xs text-slate-500">Read-only account. Escalations require an Analyst profile.</p>
                ) : (
                  <form onSubmit={handleEscalate} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Incident Title</label>
                      <input
                        type="text"
                        required
                        value={escalateTitle}
                        onChange={(e) => setEscalateTitle(e.target.value)}
                        placeholder={`Escalated: ${selectedAlert.title}`}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-slate-250 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Description & Impact</label>
                      <textarea
                        required
                        value={escalateDesc}
                        onChange={(e) => setEscalateDesc(e.target.value)}
                        placeholder="Detail the analyst findings, blast radius, and recovery recommendations..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-slate-250 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Priority Severity</label>
                      <select
                        value={escalateSeverity}
                        onChange={(e: any) => setEscalateSeverity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-slate-250 focus:outline-none"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={escalateLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-2.5 rounded-lg shadow uppercase tracking-wider text-[11px]"
                    >
                      {escalateLoading ? 'Escalating...' : 'Declare Incident'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
