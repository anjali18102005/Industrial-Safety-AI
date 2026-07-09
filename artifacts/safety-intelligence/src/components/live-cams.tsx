import React, { useEffect, useState } from 'react';
import { useListZones } from '@workspace/api-client-react';
import { Video, VideoOff } from 'lucide-react';

const riskGlow: Record<string, string> = {
  critical: 'ring-2 ring-red-500/70',
  high: 'ring-2 ring-orange-500/60',
  medium: 'ring-1 ring-amber-400/50',
  low: 'ring-1 ring-border',
};

// Deterministic per-zone gradient "signal" so each tile reads as a distinct feed.
const patterns = [
  'from-slate-800 via-slate-900 to-black',
  'from-zinc-800 via-neutral-900 to-black',
  'from-stone-800 via-neutral-900 to-black',
  'from-slate-900 via-zinc-900 to-black',
  'from-neutral-800 via-slate-900 to-black',
];

function CameraTile({
  name,
  riskLevel,
  index,
  now,
}: {
  name: string;
  riskLevel: string;
  index: number;
  now: Date;
}) {
  const pattern = patterns[index % patterns.length];
  const timestamp = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div
      className={`relative aspect-video rounded-md overflow-hidden bg-gradient-to-br ${pattern} ${riskGlow[riskLevel] ?? riskGlow.low}`}
    >
      {/* simulated scanline sweep */}
      <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_3px)]" />
      <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-white/10 to-transparent animate-[scan_4s_linear_infinite]" />

      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
        <span className="text-[9px] font-mono font-bold tracking-wider text-red-400">LIVE</span>
      </div>

      <div className="absolute top-1.5 right-1.5 bg-black/50 rounded px-1.5 py-0.5">
        <span className="text-[9px] font-mono text-white/70">{timestamp}</span>
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
        <p className="text-[10px] font-mono font-semibold text-white/90 truncate uppercase tracking-wide">
          {name}
        </p>
      </div>
    </div>
  );
}

export function LiveCams() {
  const { data: zones, isLoading, error } = useListZones();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live Cams
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{zones?.length ?? 0} FEEDS</span>
      </div>

      <div className="p-3 space-y-3">
        {isLoading && (
          <div className="text-xs font-mono text-muted-foreground p-4 text-center animate-pulse">
            Connecting to feeds...
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2 text-xs font-mono text-muted-foreground p-4 text-center">
            <VideoOff className="w-5 h-5" />
            Feed unavailable
          </div>
        )}
        {zones?.map((zone, i) => (
          <CameraTile key={zone.id} name={zone.name} riskLevel={zone.riskLevel} index={i} now={now} />
        ))}
      </div>
    </div>
  );
}
