import React, { useEffect, useState } from 'react';
import { Terminal, Search, ChevronLeft, ChevronRight, Eye, Code } from 'lucide-react';
import api from '../api';

interface SecurityEvent {
  id: number;
  host_id: number;
  timestamp: string;
  event_type: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  username?: string;
  process_name?: string;
  command_line?: string;
  event_data: any;
  severity: string;
  created_at: string;
}

export default function Events() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [hostId, setHostId] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [limit] = useState(50);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);

  // Inspector Modal state
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = `/events?limit=${limit}&skip=${skip}`;
      if (hostId) url += `&host_id=${hostId}`;
      if (eventType) url += `&event_type=${eventType}`;
      if (severity) url += `&severity=${severity}`;

      const response = await api.get(url);
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to query events feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [skip]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0); // reset page
    fetchEvents();
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'LOW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      {/* Search / Filter Card */}
      <form onSubmit={handleSearch} className="glass p-5 rounded-2xl border border-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter Host ID</label>
          <input
            type="number"
            value={hostId}
            onChange={(e) => setHostId(e.target.value)}
            placeholder="e.g. 1"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Telemetry</option>
            <option value="failed_login">failed_login</option>
            <option value="successful_login">successful_login</option>
            <option value="process_creation">process_creation</option>
            <option value="network_connection">network_connection</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Severity Level</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Searching...' : 'Apply Filters'}
        </button>
      </form>

      {/* Events logs panel */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Host ID</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-6">Source IP</th>
                <th className="py-3.5 px-6">Process Name</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-emerald-400 font-bold uppercase text-xs tracking-widest animate-pulse">Running telemetry queries...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-600">No events matched the filter queries. Ensure sensors are connected.</td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-950/40">
                    <td className="py-4 px-6 font-mono text-slate-500">{ev.id}</td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-300">Host #{ev.host_id}</td>
                    <td className="py-4 px-6 font-mono text-slate-300">{ev.event_type}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityStyle(ev.severity)}`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">{ev.source_ip || '-'}</td>
                    <td className="py-4 px-6 font-mono text-slate-400 truncate max-w-[120px]" title={ev.process_name}>{ev.process_name || '-'}</td>
                    <td className="py-4 px-6 text-xs font-mono text-slate-500">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedEvent(ev)}
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

        {/* Paging */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950/30 border-t border-slate-900 text-xs">
          <span className="text-slate-500">
            Displaying logs {skip + 1} - {skip + events.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0 || loading}
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all duration-150 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSkip(skip + limit)}
              disabled={events.length < limit || loading}
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all duration-150 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="h-14 border-b border-slate-900 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-350">
                  Telemetry Payload (ID: {selectedEvent.id})
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition-all duration-150"
              >
                Close
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Event attributes */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Ingestion Source</span>
                  <span className="font-mono text-slate-250">Host ID {selectedEvent.host_id}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Severity Level</span>
                  <span className="font-mono text-slate-250">{selectedEvent.severity}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Telemetry Type</span>
                  <span className="font-mono text-slate-250">{selectedEvent.event_type}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-550 block">Host UTC Timestamp</span>
                  <span className="font-mono text-slate-250">{new Date(selectedEvent.timestamp).toISOString()}</span>
                </div>
              </div>

              {selectedEvent.command_line && (
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Process Execution Parameter</span>
                  <code className="text-xs text-orange-400 select-all block break-all">{selectedEvent.command_line}</code>
                </div>
              )}

              {/* JSON code block */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Extended Event Metadata</span>
                <pre className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-xs text-emerald-400 overflow-x-auto select-all max-h-[30vh]">
                  {JSON.stringify(selectedEvent.event_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
