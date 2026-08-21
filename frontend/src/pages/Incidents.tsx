import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, Eye, CheckCircle2, AlertOctagon, User } from 'lucide-react';
import api from '../api';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  alert_ids: number[];
}

interface IncidentsProps {
  userRole: string;
}

export default function Incidents({ userRole }: IncidentsProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Detail Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      let url = '/incidents?limit=100';
      if (severityFilter) url += `&severity_filter=${severityFilter}`;
      if (statusFilter) url += `&status_filter=${statusFilter}`;
      
      const response = await api.get(url);
      setIncidents(response.data);
    } catch (err) {
      console.error('Failed to query incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await api.patch(`/incidents/${id}`, { status: newStatus });
      setIncidents(incidents.map((inc) => (inc.id === id ? response.data : inc)));
      setSelectedIncident(response.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update incident status');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setAssignLoading(true);

    try {
      const response = await api.patch(`/incidents/${selectedIncident.id}`, {
        assigned_to: assigneeId ? parseInt(assigneeId) : null
      });
      setIncidents(incidents.map((inc) => (inc.id === selectedIncident.id ? response.data : inc)));
      setSelectedIncident(response.data);
      setAssigneeId('');
      alert('Incident ownership assigned successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign incident');
    } finally {
      setAssignLoading(false);
    }
  };

  const isReadOnly = userRole === 'viewer';

  const getIncidentSeverityStyle = (sev: string) => {
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
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Contained">Contained</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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
          onClick={fetchIncidents}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-850 rounded-xl transition-all duration-200"
        >
          Refresh Feed
        </button>
      </div>

      {/* Incidents Table */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">ID</th>
              <th className="py-3.5 px-6">Incident Title</th>
              <th className="py-3.5 px-6">Severity</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Assignee</th>
              <th className="py-3.5 px-6">Trigger Detections</th>
              <th className="py-3.5 px-6">Created At</th>
              <th className="py-3.5 px-6 text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Running database incidents queries...</td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-650">No incidents declared. Active environment posture is fully secure.</td>
              </tr>
            ) : (
              incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-950/40">
                  <td className="py-4 px-6 font-mono text-slate-500">{inc.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-200">{inc.title}</td>
                  <td className="py-4 px-6">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded border uppercase ${getIncidentSeverityStyle(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium text-slate-350 px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-full">
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-400">
                    {inc.assigned_to ? `User #${inc.assigned_to}` : 'Unassigned'}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-400">
                    {inc.alert_ids.length} alerts linked
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-500">
                    {new Date(inc.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setSelectedIncident(inc)}
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

      {/* Detail Inspector Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 px-6 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-400 animate-pulse" />
                Incident Coordinator: Incident ID {selectedIncident.id}
              </span>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-xs font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Incident Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Declared on: {new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>

                <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block border-b border-slate-800 pb-1">Incident Report Scope</span>
                  <p className="text-slate-300 leading-relaxed">{selectedIncident.description}</p>
                </div>

                {/* Severity, Assignee, Resolved At */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Assignee Owner</span>
                    <span className="text-sm font-mono text-slate-300">
                      {selectedIncident.assigned_to ? `User #${selectedIncident.assigned_to}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase">Resolved Timestamp</span>
                    <span className="text-xs font-mono text-slate-300">
                      {selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : 'Active Response'}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900 col-span-2">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase mb-1">Correlated Alert IDs</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.alert_ids.length === 0 ? (
                        <span className="text-xs text-slate-600">No raw alerts linked to this incident.</span>
                      ) : (
                        selectedIncident.alert_ids.map((id) => (
                          <span key={id} className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-500">
                            Alert #{id}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Coordinate State Transition</span>
                  <div className="flex flex-wrap gap-2">
                    {['Open', 'Investigating', 'Contained', 'Resolved', 'Closed'].map((statusOption) => (
                      <button
                        key={statusOption}
                        onClick={() => handleStatusChange(selectedIncident.id, statusOption)}
                        disabled={isReadOnly || selectedIncident.status === statusOption}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all duration-150 ${
                          selectedIncident.status === statusOption
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

              {/* Assignee Escalation */}
              {!isReadOnly && (
                <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Assign Incident Ownership</h4>
                  </div>

                  <form onSubmit={handleAssign} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">User ID of Assignee</label>
                      <input
                        type="number"
                        required
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        placeholder="Enter user numeric ID (e.g. 1)"
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-slate-250 placeholder-slate-650 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={assignLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold py-2.5 rounded-lg shadow uppercase tracking-wider text-[11px]"
                    >
                      {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
