import React, { useState } from 'react';
import { useListHazards, getListHazardsQueryKey } from '@workspace/api-client-react';
import { RiskBadge, StatusBadge, AiDetectedBadge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Filter, Search, Clock, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Hazards() {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');

  const params = {
    status: filterStatus ? (filterStatus as any) : undefined,
    riskLevel: filterRisk ? (filterRisk as any) : undefined
  };
  const { data: hazards, isLoading } = useListHazards(params, {
    query: { refetchInterval: 10000, queryKey: getListHazardsQueryKey(params) },
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hazard Scenarios</h2>
          <p className="text-muted-foreground text-sm">AI-detected safety scenarios requiring review.</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            className="h-9 px-3 border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
          >
            <option value="">All Risks</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select 
            className="h-9 px-3 border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground font-mono animate-pulse">Loading scenarios...</div>
        ) : hazards?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No hazard scenarios found.</p>
            <p className="text-sm mt-1">Adjust your filters to see more results.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 border-b font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Scenario</th>
                  <th className="px-6 py-3 font-medium">Risk / Confidence</th>
                  <th className="px-6 py-3 font-medium">Zone</th>
                  <th className="px-6 py-3 font-medium">Detected</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hazards?.map((hazard) => (
                  <tr key={hazard.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{hazard.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                        <span className="font-mono">{hazard.scenarioType}</span>
                        {hazard.scenarioType === 'ai_detected_failure_risk' && <AiDetectedBadge />}
                        {hazard.workersNearby > 0 && (
                          <span className="flex items-center gap-1 text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 rounded-sm">
                            <Users className="w-3 h-3" /> {hazard.workersNearby} nearby
                          </span>
                        )}
                        {hazard.activeWorkPermit && (
                          <span className="px-1.5 rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 text-[10px] uppercase font-bold tracking-wider">Permit Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <RiskBadge level={hazard.riskLevel} />
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Conf: {(hazard.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {hazard.zoneName}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(hazard.detectedAt), 'MMM dd, HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={hazard.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/hazards/${hazard.id}`} className="inline-flex items-center justify-center p-2 rounded-md hover:bg-accent text-accent-foreground opacity-0 group-hover:opacity-100 transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
