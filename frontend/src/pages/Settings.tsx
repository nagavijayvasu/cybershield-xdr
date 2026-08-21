import React from 'react';
import { Settings, Shield, Server, Key, Info } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-emerald-400 animate-pulse" />
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-350">System Configurations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Sensor Configurations */}
        <div className="glass p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
            <Server className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Endpoint Sensor Deployment Metadata</h3>
          </div>

          <div className="space-y-4 text-xs">
            <p className="text-slate-400 leading-relaxed">
              Use these configuration settings to deploy new Python security sensors on your local machines or in your lab environments:
            </p>

            <div className="space-y-3 bg-slate-900 p-4 rounded-xl font-mono text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">XDR Ingestion URL (SERVER_URL)</span>
                <span className="text-emerald-400 font-semibold">http://127.0.0.1:8000/api</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Agent Auth Key (API_KEY)</span>
                <span className="text-emerald-400 font-semibold">cybershield_agent_token_secret_12345</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Recommended Cycle Ingestion (INTERVAL)</span>
                <span className="text-slate-200">30 seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="glass p-6 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
            <Info className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Platform Specifications</h3>
          </div>

          <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
            <p>
              **CyberShield XDR** version 1.0.0 is an enterprise-grade cybersecurity monitoring and threat detection platform built as a portfolio and demonstration project.
            </p>

            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span>Core Framework:</span>
                <span className="font-semibold text-slate-250">FastAPI, Python 3.13</span>
              </div>
              <div className="flex justify-between">
                <span>Relational ORM:</span>
                <span className="font-semibold text-slate-250">SQLAlchemy 2.0 & Alembic</span>
              </div>
              <div className="flex justify-between">
                <span>UI Stack:</span>
                <span className="font-semibold text-slate-250">React, TypeScript, Vite, Tailwind CSS</span>
              </div>
              <div className="flex justify-between">
                <span>Ingestion Queue:</span>
                <span className="font-semibold text-slate-250">Threadpool Direct Pipe</span>
              </div>
              <div className="flex justify-between">
                <span>MITRE Integration:</span>
                <span className="font-semibold text-slate-250">ATT&CK v13 Mapping</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
