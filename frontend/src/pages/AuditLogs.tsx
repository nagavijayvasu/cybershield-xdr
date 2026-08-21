import React, { useEffect, useState } from 'react';
import { History, RefreshCw, FileText } from 'lucide-react';
import api from '../api';

interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const url = actionFilter ? `/audit-logs/?action_filter=${actionFilter}` : '/audit-logs/';
      const response = await api.get(url);
      setLogs(response.data);
    } catch (err: any) {
      console.error('Failed to query audit logs:', err);
      setErrorMessage(err.response?.data?.detail || 'Unauthorized to view audit registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_CREATION':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            USER_CREATION
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            ROLE_CHANGE
          </span>
        );
      case 'DETECTION_RULE_CHANGE':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            RULE_CHANGE
          </span>
        );
      case 'ACCOUNT_ACTIVATION':
      case 'ACCOUNT_DEACTIVATION':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
            STATUS_CHANGE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      {/* Header operations */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-350">Platform Security Audit Log</h2>
        </div>
        
        <div className="flex items-center gap-3.5">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl py-2 px-4 text-xs font-bold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value="">ALL ACTIONS</option>
            <option value="USER_CREATION">USER CREATION</option>
            <option value="ROLE_CHANGE">ROLE CHANGE</option>
            <option value="ACCOUNT_ACTIVATION">ACCOUNT ACTIVATION</option>
            <option value="ACCOUNT_DEACTIVATION">ACCOUNT DEACTIVATION</option>
            <option value="ADMIN_ACTION">ADMIN SEEDING</option>
            <option value="DETECTION_RULE_CHANGE">DETECTION RULE CHANGE</option>
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {errorMessage}
        </div>
      )}

      {/* Logs Table */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">ID</th>
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Category</th>
              <th className="py-3.5 px-6">Actor</th>
              <th className="py-3.5 px-6">IP Origin</th>
              <th className="py-3.5 px-6">Audit Log Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Running audit log database query...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-650">No security audit logs match the specified query filters.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/40 align-top">
                  <td className="py-4 px-6 font-mono text-slate-500 text-xs">{log.id}</td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">{getActionBadge(log.action)}</td>
                  <td className="py-4 px-6 font-semibold text-slate-300 whitespace-nowrap">
                    {log.username || 'System Agent'}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {log.ip_address || '127.0.0.1 (Local)'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-200 leading-relaxed font-sans font-medium">
                    <div className="flex gap-2 items-start max-w-xl">
                      <FileText className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
                      <span>{log.details}</span>
                    </div>
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
