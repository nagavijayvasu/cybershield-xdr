import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Hosts from './pages/Hosts';
import Iocs from './pages/IOCs';
import DetectionRules from './pages/DetectionRules';
import SettingsPage from './pages/Settings';
import UsersPage from './pages/Users';
import AuditLogsPage from './pages/AuditLogs';
import api from './api';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Validate existing token on boot
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        setUsername(response.data.username);
        setRole(response.data.role);
      } catch (err) {
        // Token expired/invalid
        handleLogout();
      } finally {
        setAuthLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleLoginSuccess = (newToken: string, user: string, userRole: string) => {
    setToken(newToken);
    setUsername(user);
    setRole(userRole);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername('');
    setRole('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050811] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-xs font-mono tracking-wider text-emerald-400 uppercase">Validating SOC Session Keys...</span>
        </div>
      </div>
    );
  }

  // Render Login portal if unauthenticated
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render active dashboard section
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'events': return <Events />;
      case 'alerts': return <Alerts userRole={role} />;
      case 'incidents': return <Incidents userRole={role} />;
      case 'hosts': return <Hosts userRole={role} />;
      case 'iocs': return <Iocs userRole={role} />;
      case 'detection-rules': return <DetectionRules />;
      case 'users': return <UsersPage currentUsername={username} />;
      case 'audit-logs': return <AuditLogsPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050811]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userRole={role}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          activeTab={activeTab}
          username={username}
          role={role}
        />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
