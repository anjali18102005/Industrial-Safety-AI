import React from 'react';
import { useListZones } from '@workspace/api-client-react';
import { RiskBadge } from '@/components/ui/badge';
import { ShieldAlert, Users, FileText } from 'lucide-react';

export default function Zones() {
  const { data: zones, isLoading } = useListZones();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plant Zones</h2>
          <p className="text-muted-foreground text-sm">Geospatial risk tracking across the facility.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted/30 animate-pulse rounded-lg border"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.map((zone) => (
            <div key={zone.id} className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
              <div className="p-5 border-b flex justify-between items-start bg-muted/10">
                <div>
                  <h3 className="font-semibold text-lg">{zone.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-1">ID: {zone.id}</p>
                </div>
                <RiskBadge level={zone.riskLevel} />
              </div>
              <div className="p-5 grid grid-cols-3 gap-4 flex-1">
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-md bg-muted/30">
                  <ShieldAlert className={`w-5 h-5 mb-2 ${zone.activeHazardCount > 0 ? 'text-orange-500' : 'text-emerald-500 opacity-50'}`} />
                  <span className="text-xl font-bold font-mono">{zone.activeHazardCount}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Hazards</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-md bg-muted/30">
                  <Users className="w-5 h-5 mb-2 text-primary/70" />
                  <span className="text-xl font-bold font-mono">{zone.workersPresent}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Workers</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-md bg-muted/30">
                  <FileText className="w-5 h-5 mb-2 text-primary/70" />
                  <span className="text-xl font-bold font-mono">{zone.activeWorkPermits}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Permits</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
