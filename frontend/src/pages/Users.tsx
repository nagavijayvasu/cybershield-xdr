import React, { useEffect, useState } from 'react';
import { Users, Shield, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  created_at: string;
}

interface UsersProps {
  currentUsername: string;
}

export default function UsersPage({ currentUsername }: UsersProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setErrorMessage(err.response?.data?.detail || 'Unauthorized to access user registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, username: string, newRole: 'admin' | 'analyst' | 'viewer') => {
    if (username === currentUsername) {
      alert('Security Protection: You cannot modify your own administrative role.');
      return;
    }

    if (!window.confirm(`Are you sure you want to change user "${username}" role to ${newRole.toUpperCase()}?`)) {
      // Re-fetch to reset select state
      fetchUsers();
      return;
    }

    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      alert(`User role successfully changed to: ${newRole.toUpperCase()}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user role');
      fetchUsers();
    }
  };

  const handleStatusToggle = async (userId: number, username: string, currentActive: boolean) => {
    if (username === currentUsername) {
      alert('Security Protection: You cannot deactivate your own active session.');
      return;
    }

    const nextState = !currentActive;
    const msg = nextState 
      ? `Activate user "${username}"?`
      : `Deactivate user "${username}"? This will lock them out of the portal.`;

    if (!window.confirm(msg)) return;

    try {
      await api.patch(`/users/${userId}/status`, { is_active: nextState });
      alert(`User status changed successfully.`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle user status');
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-350">SOC Identity & Access Directory</h2>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {errorMessage}
        </div>
      )}

      {/* Users Table */}
      <div className="glass rounded-2xl border border-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-950/20 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">ID</th>
              <th className="py-3.5 px-6">Username</th>
              <th className="py-3.5 px-6">Email Address</th>
              <th className="py-3.5 px-6">Assigned Role</th>
              <th className="py-3.5 px-6">Account Status</th>
              <th className="py-3.5 px-6">Enrolled At</th>
              <th className="py-3.5 px-6 text-center">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-emerald-400 tracking-wider font-bold animate-pulse">Running identity discovery query...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-650">No users found in directory.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-950/40">
                  <td className="py-4 px-6 font-mono text-slate-500">{user.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-200 flex items-center gap-2">
                    {user.username}
                    {user.username === currentUsername && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold uppercase px-1.5 py-0.5 rounded">You</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-350">{user.email}</td>
                  <td className="py-4 px-6">
                    <select
                      value={user.role}
                      disabled={user.username === currentUsername}
                      onChange={(e) => handleRoleChange(user.id, user.username, e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg py-1 px-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500/40 disabled:opacity-55"
                    >
                      <option value="viewer">VIEWER</option>
                      <option value="analyst">ANALYST</option>
                      <option value="admin">ADMINISTRATOR</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                        <XCircle className="h-3.5 w-3.5" /> Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-slate-500">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.username, user.is_active)}
                      disabled={user.username === currentUsername}
                      className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
                        user.is_active
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25'
                      } disabled:opacity-30`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
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
