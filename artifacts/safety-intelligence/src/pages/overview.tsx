import React from 'react';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { AlertTriangle, Map, Radio, Users, Activity, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { RiskBadge, StatusBadge } from '@/components/ui/badge';

export default function Overview() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) return <div className="p-8 font-mono animate-pulse">Initializing System...</div>;
  if (error || !summary) return <div className="p-8 text-destructive">Failed to load system state.</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plant Overview</h2>
          <p className="text-muted-foreground text-sm">Real-time safety intelligence summary.</p>
        </div>
        <div className="bg-card border px-4 py-2 rounded-md shadow-sm flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-sm font-semibold uppercase tracking-wider">System Active</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Hazards" value={summary.activeHazardCount} icon={AlertTriangle} trend={summary.criticalCount > 0 ? 'critical' : 'normal'} />
        <KpiCard title="Zones Monitored" value={summary.zonesMonitored} icon={Map} />
        <KpiCard title="Sensors Online" value={summary.sensorsOnline} icon={Radio} />
        <KpiCard title="Workers On Site" value={summary.workersOnSite} icon={Users} />
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg shadow-sm p-6 lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Hazard Distribution</h3>
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <DistributionRow label="Critical" count={summary.criticalCount} total={summary.activeHazardCount} color="bg-red-500" />
            <DistributionRow label="High" count={summary.highCount} total={summary.activeHazardCount} color="bg-orange-500" />
            <DistributionRow label="Medium" count={summary.mediumCount} total={summary.activeHazardCount} color="bg-amber-400" />
            <DistributionRow label="Low" count={summary.lowCount} total={summary.activeHazardCount} color="bg-emerald-500" />
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Avg Confidence</span>
            <span className="font-mono font-bold text-primary">{(summary.averageConfidence * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Top Priority Hazards */}
        <div className="bg-card border rounded-lg shadow-sm p-0 lg:col-span-2 flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Priority Action Required</h3>
            <Link href="/hazards" className="text-xs font-semibold text-primary flex items-center hover:underline">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto min-h-[300px]">
            {summary.topHazards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3 opacity-20" />
                <p>No active hazards requiring attention.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {summary.topHazards.map(hazard => (
                  <li key={hazard.id} className="hover:bg-muted/50 transition-colors">
                    <Link href={`/hazards/${hazard.id}`} className="flex items-center p-4 gap-4">
                      <div className="shrink-0">
                        <RiskBadge level={hazard.riskLevel} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{hazard.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                          <span>{hazard.zoneName}</span>
                          <span>•</span>
                          <span>Score: {(hazard.priorityScore * 100).toFixed(0)}</span>
                          {hazard.workersNearby > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {hazard.workersNearby}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-4">
                        <StatusBadge status={hazard.status} />
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend }: { title: string, value: number, icon: any, trend?: string }) {
  return (
    <div className="bg-card border rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <Icon className={`w-5 h-5 ${trend === 'critical' ? 'text-destructive' : 'text-primary opacity-80'}`} />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-mono font-bold tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function DistributionRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs font-mono uppercase text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right font-mono text-sm font-medium">{count}</div>
    </div>
  );
}
