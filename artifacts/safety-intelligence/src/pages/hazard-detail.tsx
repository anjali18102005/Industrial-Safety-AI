import React, { useRef } from 'react';
import { useGetHazard, useUpdateHazardStatus, useGetHazardTimeline, getGetHazardQueryKey } from '@workspace/api-client-react';
import { useLocation, useParams } from 'wouter';
import { RiskBadge, StatusBadge, Badge, AiDetectedBadge } from '@/components/ui/badge';
import { ArrowLeft, BrainCircuit, Activity, Clock, ShieldCheck, AlertTriangle, MessageSquareWarning } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function HazardDetail() {
  const params = useParams();
  const id = params.id!;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hazard, isLoading } = useGetHazard(id, {
    query: { refetchInterval: 10000, queryKey: getGetHazardQueryKey(id) },
  });
  const { data: timeline } = useGetHazardTimeline(id);
  const updateStatus = useUpdateHazardStatus();
  
  const handleStatusUpdate = (status: 'acknowledged' | 'resolved' | 'monitoring') => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: (updated) => {
        toast({ title: 'Status Updated', description: `Hazard marked as ${status}.` });
        // Instead of invalidate, we can let the hook invalidate if configured, but let's do manually to be safe
        queryClient.invalidateQueries({ queryKey: ['/api/hazards'] });
        queryClient.invalidateQueries({ queryKey: [`/api/hazards/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/hazards/${id}/timeline`] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] });
      },
      onError: () => {
        toast({ title: 'Update Failed', variant: 'destructive' });
      }
    });
  };

  if (isLoading) return <div className="p-8 font-mono animate-pulse">Loading AI Explanation...</div>;
  if (!hazard) return <div className="p-8 text-destructive">Hazard not found.</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => setLocation('/hazards')} className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{hazard.scenarioType}</span>
            {hazard.scenarioType === 'ai_detected_failure_risk' && <AiDetectedBadge />}
            <span className="text-muted-foreground/30">•</span>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{hazard.id}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{hazard.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={hazard.status} className="px-3 py-1 text-xs" />
          <RiskBadge level={hazard.riskLevel} className="px-3 py-1 text-xs" />
        </div>
      </div>

      <p className="text-lg text-foreground/80 leading-relaxed border-l-4 border-primary/50 pl-4 py-1 bg-muted/20">
        {hazard.description}
      </p>

      {/* Action Bar */}
      <div className="bg-card border rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex items-center gap-6 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Detected: {format(new Date(hazard.detectedAt), 'MMM dd HH:mm:ss')}
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zone: {hazard.zoneName}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hazard.status === 'active' && (
            <button onClick={() => handleStatusUpdate('acknowledged')} disabled={updateStatus.isPending} className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              Acknowledge Hazard
            </button>
          )}
          {(hazard.status === 'acknowledged' || hazard.status === 'active') && (
            <button onClick={() => handleStatusUpdate('monitoring')} disabled={updateStatus.isPending} className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-md hover:bg-purple-700 transition-colors shadow-sm">
              Monitor Condition
            </button>
          )}
          {hazard.status !== 'resolved' && (
            <button onClick={() => handleStatusUpdate('resolved')} disabled={updateStatus.isPending} className="px-4 py-2 bg-slate-200 text-slate-900 font-semibold text-sm rounded-md hover:bg-slate-300 transition-colors shadow-sm">
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Explainability */}
        <div className="lg:col-span-2 space-y-6">
          
          <section className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary/5 border-b border-primary/10 px-5 py-4 flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <h3 className="font-semibold tracking-wide">AI Reasoning Trace</h3>
              <div className="ml-auto text-xs font-mono font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                CONFIDENCE: {(hazard.confidenceScore * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-5 space-y-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase text-muted-foreground font-semibold">Risk Rationale</h4>
                <p className="leading-relaxed">{hazard.explainability.riskRationale}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase text-muted-foreground font-semibold">Priority Rationale</h4>
                <p className="leading-relaxed">{hazard.explainability.priorityRationale}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase text-muted-foreground font-semibold">Confidence Factors</h4>
                <p className="leading-relaxed">{hazard.explainability.confidenceRationale}</p>
              </div>
              
              <div className="pt-4 border-t border-dashed space-y-3">
                <h4 className="font-mono text-xs uppercase text-muted-foreground font-semibold">Detection Chain</h4>
                <ol className="relative border-l border-muted ml-3 space-y-4">
                  {hazard.explainability.reasoningSteps.map((step, idx) => (
                    <li key={idx} className="ml-5">
                      <span className="absolute flex items-center justify-center w-5 h-5 rounded-full bg-card border ring-4 ring-card -left-2.5">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      </span>
                      <p className="text-sm">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {hazard.recommendedActions.map(action => (
                <div key={action.id} className="bg-card border rounded-lg p-4 flex gap-4 shadow-sm border-l-4" style={{ borderLeftColor: action.priority === 'immediate' ? 'var(--color-destructive)' : action.priority === 'high' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge variant={action.priority === 'immediate' ? 'destructive' : action.priority === 'high' ? 'high' : 'secondary'} className="text-[10px]">
                        {action.priority}
                      </Badge>
                      <span className="font-semibold">{action.action}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{action.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Factors & Timeline */}
        <div className="space-y-6">
          <section className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/10">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Contributing Factors</h3>
            </div>
            <div className="p-5 space-y-5">
              {hazard.contributingFactors.map(factor => (
                <div key={factor.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{factor.label}</span>
                    <span className="font-mono text-muted-foreground">{(factor.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-primary" style={{ width: `${factor.weight * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/10 flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Incident Timeline
              </h3>
            </div>
            <div className="p-5">
              {timeline ? (
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3 text-sm">
                      <div className="w-16 shrink-0 text-xs font-mono text-muted-foreground pt-0.5 text-right">
                        {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </div>
                      <div className="relative flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary/40 ring-4 ring-card mt-1 z-10" />
                        {idx !== timeline.length - 1 && <div className="w-px h-full bg-border absolute top-3" />}
                      </div>
                      <div className="pb-4">
                        <span className="font-medium inline-block mb-0.5">{event.eventType.replace('_', ' ')}</span>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">Loading timeline...</div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
