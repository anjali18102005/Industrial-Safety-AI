import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ShieldAlert, 
  Activity, 
  Map, 
  Radio, 
  LayoutDashboard,
  Clock,
  Menu,
  PanelLeftClose,
  LogOut,
  Plane
} from 'lucide-react';
import { useHealthCheck, getHealthCheckQueryKey } from '@workspace/api-client-react';
import { useAuth, ROLE_LABELS } from '@/lib/auth';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: health } = useHealthCheck({
    query: { refetchInterval: 30000, queryKey: getHealthCheckQueryKey() },
  });

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/hazards', label: 'Hazards', icon: ShieldAlert },
    { href: '/zones', label: 'Zones', icon: Map },
    { href: '/sensors', label: 'Sensors', icon: Radio },
    { href: '/engines', label: 'Engine Fleet', icon: Plane },
    { href: '/activity', label: 'Activity Log', icon: Clock },
  ];

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slides in/out as an overlay drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border h-screen shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar-accent/50 shrink-0">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-sidebar-primary mr-3" />
            <div>
              <h1 className="font-mono font-bold tracking-tight text-sm">ISIS<span className="text-sidebar-primary/80">_SYS</span></h1>
              <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Industrial Safety</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            title="Collapse sidebar"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
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
                <Link key={item.href} href={item.href} onClick={closeOnMobile} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80'}`}>
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
      <main
        className={`flex-1 flex flex-col min-w-0 overflow-hidden h-screen transition-[margin] duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
             <button
               onClick={() => setSidebarOpen((o) => !o)}
               title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
               className="text-muted-foreground hover:text-foreground transition-colors"
             >
               <Menu className="w-5 h-5" />
             </button>
             <h2 className="text-lg font-semibold tracking-tight">Command Center</h2>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="text-muted-foreground hidden sm:block">
              {new Date().toISOString().split('T')[0]} <span className="text-foreground">{new Date().toISOString().split('T')[1].slice(0, 8)} UTC</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {user?.initials ?? '--'}
              </span>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-semibold">{user?.name ?? 'Unknown'}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {user ? ROLE_LABELS[user.role] : ''}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
