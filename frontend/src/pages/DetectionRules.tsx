import React from 'react';
import { Lock, ShieldCheck, Flame, ShieldAlert, Cpu, Network } from 'lucide-react';

export default function DetectionRules() {
  const rules = [
    {
      name: 'Brute Force Attack Detection',
      description: 'Triggered when multiple consecutive authentication failures occur from the same source IP.',
      threshold: '5+ failed logins',
      window: '5 minutes',
      severity: 'HIGH',
      tactic: 'Credential Access',
      technique: 'T1110 (Brute Force)',
      icon: Cpu
    },
    {
      name: 'Network Service Scanning (Port Scan)',
      description: 'Detects reconnaissance scanning when an IP attempts connections across multiple distinct destination ports.',
      threshold: '10+ distinct ports',
      window: '2 minutes',
      severity: 'MEDIUM',
      tactic: 'Discovery',
      technique: 'T1046 (Network Service Scanning)',
      icon: Network
    },
    {
      name: 'Suspicious Success (Brute Force Success)',
      description: 'Identifies high-priority logins where repeated authentication failures are followed by a successful credentials validation.',
      threshold: '3+ failures then success',
      window: '5 minutes',
      severity: 'HIGH',
      tactic: 'Credential Access',
      technique: 'T1110 (Brute Force)',
      icon: ShieldAlert
    },
    {
      name: 'Suspicious Process Spawns',
      description: 'Flags executions of dual-use pentest tooling or evasion scripts (e.g. mimikatz, net, whoami, powershell bypass commands).',
      threshold: 'Immediate detection (1)',
      window: 'Instant',
      severity: 'HIGH',
      tactic: 'Execution',
      technique: 'T1059 (Command and Scripting Interpreter)',
      icon: Flame
    },
    {
      name: 'Excessive Host Failures',
      description: 'Detects a high volume of global authentication failures across multiple usernames on a single target asset.',
      threshold: '20+ failed logins',
      window: '10 minutes',
      severity: 'HIGH',
      tactic: 'Credential Access',
      technique: 'T1110 (Brute Force)',
      icon: ShieldCheck
    }
  ];

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  return (
    <div className="flex-1 bg-[#050811] p-8 overflow-y-auto space-y-6">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-emerald-400 animate-pulse" />
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-350">Active Correlation Policies</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <div key={rule.name} className="glass p-6 rounded-2xl border border-slate-900 flex gap-4 relative overflow-hidden">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{rule.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{rule.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-900 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Severity Level</span>
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded border mt-0.5 ${getSeverityStyle(rule.severity)}`}>
                      {rule.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">MITRE Ref</span>
                    <span className="font-mono text-xs font-bold text-red-400 block mt-0.5">{rule.technique}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Condition Threshold</span>
                    <span className="font-semibold text-slate-300 block mt-0.5">{rule.threshold}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Sliding Time Window</span>
                    <span className="font-semibold text-slate-300 block mt-0.5">{rule.window}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
