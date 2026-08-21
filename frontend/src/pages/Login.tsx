import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Mail, ShieldAlert } from 'lucide-react';
import api from '../api';

interface LoginProps {
  onLoginSuccess: (token: string, username: string, role: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await api.post('/auth/register', {
          username,
          email,
          password
        });
        setSuccessMsg('Account registered successfully! Please log in.');
        setIsRegister(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login flow
        const response = await api.post('/auth/login', {
          username,
          password
        });
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        
        // Fetch current user details
        const meResponse = await api.get('/auth/me');
        const user = meResponse.data;
        
        onLoginSuccess(access_token, user.username, user.role);
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          // Format FastAPI validation error details array
          const messages = detail.map((e: any) => {
            const field = e.loc[e.loc.length - 1];
            return `${field}: ${e.msg}`;
          }).join(' | ');
          setError(messages);
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError('An error occurred. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Neon Glow Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        {/* Portal Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-slate-100">CYBERSHIELD XDR</h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            {isRegister ? 'Sensor Enrollment Gate' : 'SOC Analyst Gateway'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2.5 items-start">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex gap-2.5 items-start">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="e.g. analyst_john"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
              />
            </div>
          </div>

          {/* Email Field (Registration Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="analyst@cybershield.com"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Security Key (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Registration Only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200"
                />
              </div>
            </div>
          )}



          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold uppercase tracking-wider py-3.5 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 mt-8"
          >
            {loading ? 'Processing Cryptography...' : isRegister ? 'Enroll Agent' : 'Authorize Session'}
          </button>
        </form>

        {/* Tab Toggle footer */}
        <div className="mt-6 text-center text-xs">
          <span className="text-slate-500">
            {isRegister ? 'Already registered?' : 'Need to enroll a new user?'}
          </span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccessMsg('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-emerald-400 hover:text-emerald-300 font-semibold tracking-wider transition-colors ml-1"
          >
            {isRegister ? 'Acknowledge Login Portal' : 'Create Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
}
