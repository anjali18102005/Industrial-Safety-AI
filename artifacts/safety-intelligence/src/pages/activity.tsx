import React from 'react';
import { useListActivity } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Activity as ActivityIcon, AlertTriangle, ShieldCheck, CheckCircle2, Siren, ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';

export default function ActivityLog() {
  const { data: events, isLoading } = useListActivity({ limit: 100 });

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'sensor_anomaly': return <ActivityIcon className="w-4 h-4 text-orange-500" />;
      case 'scenario_detected': return <Siren className="w-4 h-4 text-destructive" />;
      case 'risk_escalated': return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      case 'priority_changed': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'recommendation_issued': return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'status_changed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <ActivityIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col pb-8">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">Digital Safety Log</h2>
        <p className="text-muted-foreground text-sm">Chronological system activity and compliance record.</p>
      </div>

      <div className="bg-card border rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground font-mono animate-pulse">Synchronizing log...</div>
        ) : events?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No recent activity.</div>
        ) : (
          <div className="overflow-auto p-6">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
              {events?.map((event) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Marker */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    {getEventIcon(event.eventType)}
                  </div>
                  
                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {event.eventType.replace('_', ' ')}
                      </span>
                      <time className="text-xs text-muted-foreground font-mono">{format(new Date(event.timestamp), 'HH:mm:ss')}</time>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm font-medium leading-snug">{event.description}</p>
                    </div>
                    {event.hazardId && (
                      <Link href={`/hazards/${event.hazardId}`} className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-1">
                        View Scenario: {event.hazardTitle}
                      </Link>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
