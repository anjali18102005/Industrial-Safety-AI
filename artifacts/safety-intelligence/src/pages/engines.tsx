import React, { useState } from 'react';
import {
  useListEngines,
  useGetEngine,
  useGetAiStatus,
  getListEnginesQueryKey,
  getGetEngineQueryKey,
} from '@workspace/api-client-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Plane, Gauge, Cpu, TrendingDown } from 'lucide-react';

const statusVariant: Record<string, string> = {
  nominal: 'low',
  watch: 'medium',
  critical: 'critical',
  retired: 'secondary',
};

export default function Engines() {
  const { data: engines, isLoading } = useListEngines({
    query: { refetchInterval: 5000, queryKey: getListEnginesQueryKey() },
  });
  const { data: aiStatus } = useGetAiStatus();
  const [selected, setSelected] = useState<string | null>(null);

  const rulModel = aiStatus?.models.find((m) => m.kind === 'regressor');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Predictive Maintenance — Engine Fleet</h2>
          <p className="text-muted-foreground text-sm">
            Live Remaining Useful Life (RUL) predictions replayed from real NASA C-MAPSS turbofan degradation trajectories.
          </p>
        </div>
        {rulModel && (
          <div className="bg-card border px-4 py-2.5 rounded-md shadow-sm flex items-center gap-3 text-xs font-mono">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground uppercase tracking-wider">{rulModel.version}</span>
            <span className="text-muted-foreground/40">|</span>
            <span>RMSE <span className="font-bold text-foreground">{rulModel.metrics.rmse?.toFixed(1)}</span> cycles</span>
            <span className="text-muted-foreground/40">|</span>
            <span>MAE <span className="font-bold text-foreground">{rulModel.metrics.mae?.toFixed(1)}</span> cycles</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground font-mono animate-pulse">Loading fleet telemetry...</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 border-b font-mono text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 font-medium">Engine</th>
                    <th className="px-5 py-3 font-medium">Cycle</th>
                    <th className="px-5 py-3 font-medium">Predicted RUL</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {engines?.map((engine) => {
                    const isSelected = selected === engine.id;
                    const pct = Math.max(0, Math.min(100, (engine.predictedRul / 130) * 100));
                    return (
                      <tr
                        key={engine.id}
                        onClick={() => setSelected(engine.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${engine.status === 'critical' ? 'bg-destructive/10 text-destructive' : engine.status === 'watch' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                              <Plane className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold">{engine.name}</div>
                              <div className="text-[10px] font-mono text-muted-foreground uppercase">unit {engine.datasetUnit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{engine.currentCycle} / {engine.totalCycles}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[15px]">{engine.predictedRul.toFixed(0)}</span>
                            <span className="text-xs text-muted-foreground">cycles</span>
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-1">
                              <div
                                className={`h-full ${engine.status === 'critical' ? 'bg-red-500' : engine.status === 'watch' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={statusVariant[engine.status] as any} className="text-[10px] uppercase font-mono">
                            {engine.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selected ? (
            <EngineDetail id={selected} />
          ) : (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Gauge className="w-12 h-12 mb-4 opacity-20" />
              <p>Select an engine to view its RUL history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EngineDetail({ id }: { id: string }) {
  const { data: engine, isLoading } = useGetEngine(id, {
    query: { refetchInterval: 5000, queryKey: getGetEngineQueryKey(id) },
  });

  if (isLoading || !engine) {
    return <div className="p-8 text-center text-muted-foreground font-mono animate-pulse">Loading engine...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b bg-muted/10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-md ${engine.status === 'critical' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">{engine.name}</h3>
            <span className="text-xs font-mono uppercase text-muted-foreground">{engine.id}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Cycle</span>
            <span className="font-medium font-mono">{engine.currentCycle} / {engine.totalCycles}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Status</span>
            <span className="font-medium capitalize">{engine.status}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5" /> Predicted Remaining Useful Life
        </h4>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-bold font-mono tracking-tight">{engine.predictedRul.toFixed(0)}</span>
          <span className="text-lg text-muted-foreground font-mono">cycles left</span>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">RUL Trend</h4>
        <div className="flex-1 min-h-[200px] -ml-2">
          {engine.history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No history yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engine.history}>
                <XAxis dataKey="cycle" tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="hsl(var(--border))" tickLine={{ stroke: 'hsl(var(--border))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis domain={['auto', 'auto']} width={36} tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="hsl(var(--border))" tickLine={{ stroke: 'hsl(var(--border))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <ReferenceLine y={40} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                  labelFormatter={(cycle) => `Cycle ${cycle}`}
                />
                <Line type="monotone" dataKey="predictedRul" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
