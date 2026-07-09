import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ShieldAlert, 
  Activity, 
  Map, 
  Radio, 
  LayoutDashboard,
  Clock,
  Menu
} from 'lucide-react';
import { useHealthCheck, getHealthCheckQueryKey } from '@workspace/api-client-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({
    query: { refetchInterval: 30000, queryKey: getHealthCheckQueryKey() },
  });

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/hazards', label: 'Hazards', icon: ShieldAlert },
    { href: '/zones', label: 'Zones', icon: Map },
    { href: '/sensors', label: 'Sensors', icon: Radio },
    { href: '/activity', label: 'Activity Log', icon: Clock },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border h-auto md:h-screen sticky top-0 z-20">
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border bg-sidebar-accent/50 shrink-0">
          <Activity className="w-6 h-6 text-sidebar-primary mr-3" />
          <div>
            <h1 className="font-mono font-bold tracking-tight text-sm">ISIS<span className="text-sidebar-primary/80">_SYS</span></h1>
            <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Industrial Safety</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Control Panel
          </div>
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80'}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sidebar-foreground/60">System Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="uppercase text-sidebar-foreground/80">{health?.status || 'connecting'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="md:hidden">
               <Menu className="w-5 h-5 text-muted-foreground" />
             </div>
             <h2 className="text-lg font-semibold tracking-tight">Command Center</h2>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="text-muted-foreground hidden sm:block">
              {new Date().toISOString().split('T')[0]} <span className="text-foreground">{new Date().toISOString().split('T')[1].slice(0, 8)} UTC</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                OP
              </span>
              <span className="font-semibold">Operator_01</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-background p-6">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
