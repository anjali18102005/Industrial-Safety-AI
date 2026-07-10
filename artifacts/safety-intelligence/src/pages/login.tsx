import React, { useState } from 'react';
import { Activity, ShieldCheck, HardHat, UserCog, Lock } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS, ROLE_LABELS, type Role } from '@/lib/auth';

const roleMeta: Record<Role, { icon: React.ComponentType<{ className?: string }>; blurb: string }> = {
  operator: { icon: HardHat, blurb: 'Monitor live feeds and acknowledge hazards on the floor.' },
  safety_manager: { icon: ShieldCheck, blurb: 'Review risk scores and manage hazard response.' },
  administrator: { icon: UserCog, blurb: 'Full system access, zones, sensors, and audit log.' },
};

export default function Login() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('operator');
  const [username, setUsername] = useState(DEMO_CREDENTIALS.find((c) => c.role === 'operator')!.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const roleCred = DEMO_CREDENTIALS.find((c) => c.role === selectedRole)!;

  function selectRole(role: Role) {
    setSelectedRole(role);
    setError('');
    const cred = DEMO_CREDENTIALS.find((c) => c.role === role)!;
    setUsername(cred.username);
    setPassword('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username, password, selectedRole);
    if (!ok) {
      setError('Invalid username or password for the selected role.');
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* subtle grid backdrop */}
      <div className="absolute inset-0 opacity-[0.04] [background:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative w-full max-w-4xl grid md:grid-cols-5 rounded-xl border shadow-xl overflow-hidden bg-card">
        {/* Left brand panel */}
        <div className="md:col-span-2 bg-sidebar text-sidebar-foreground p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-7 h-7 text-sidebar-primary" />
              <div>
                <h1 className="font-mono font-bold tracking-tight">ISIS<span className="text-sidebar-primary/80">_SYS</span></h1>
                <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Industrial Safety</div>
              </div>
            </div>
            <h2 className="text-xl font-bold leading-snug">Industrial Safety<br />Intelligence System</h2>
            <p className="text-sm text-sidebar-foreground/60 mt-3">
              AI-driven hazard detection, live camera feeds, and explainable risk intelligence for plant operations.
            </p>
          </div>
          <div className="text-[10px] font-mono text-sidebar-foreground/40 uppercase tracking-wider">
            Restricted Access &middot; Authorized Personnel Only
          </div>
        </div>

        {/* Right form panel */}
        <div className="md:col-span-3 p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sign in as</h3>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {(Object.keys(roleMeta) as Role[]).map((role) => {
              const Icon = roleMeta[role].icon;
              const active = role === selectedRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
                    active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
                    {ROLE_LABELS[role]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mb-6">{roleMeta[selectedRole].blurb}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In as {ROLE_LABELS[selectedRole]}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-[11px] font-mono text-muted-foreground">
            <p className="mb-1 font-semibold uppercase tracking-wider">Demo credentials</p>
            {DEMO_CREDENTIALS.map((c) => (
              <p key={c.username}>
                {ROLE_LABELS[c.role]}: <span className="text-foreground">{c.username}</span> / <span className="text-foreground">{c.password}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
