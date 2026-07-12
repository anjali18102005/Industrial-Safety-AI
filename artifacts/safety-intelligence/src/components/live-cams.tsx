import React, { useEffect, useState } from 'react';
import { useListZones } from '@workspace/api-client-react';
import { Video, VideoOff } from 'lucide-react';

const riskGlow: Record<string, string> = {
  critical: 'ring-2 ring-red-500/70',
  high: 'ring-2 ring-orange-500/60',
  medium: 'ring-1 ring-amber-400/50',
  low: 'ring-1 ring-border',
};

// Sample looping footage per zone id, generated as placeholder CCTV-style clips.
const footageByZone: Record<string, string> = {
  'zone-a': '/cams/zone-a.mp4',
  'zone-b': '/cams/zone-b.mp4',
  'zone-c': '/cams/zone-c.mp4',
  'zone-d': '/cams/zone-d.mp4',
  'zone-e': '/cams/zone-e.mp4',
};

// Extra fixed camera used to fill any empty slots in the grid once all zone
// feeds are shown (e.g. a perimeter/gate view rather than a per-zone one).
const EXTRA_CAMERA = { id: 'perimeter', name: 'Site Perimeter', src: '/cams/perimeter.mp4', riskLevel: 'low' as const };

function CameraTile({
  name,
  riskLevel,
  src,
  now,
}: {
  name: string;
  riskLevel: string;
  src?: string;
  now: Date;
}) {
  const timestamp = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div
      className={`relative w-full aspect-video rounded-md overflow-hidden bg-black ${riskGlow[riskLevel] ?? riskGlow.low}`}
    >
      {src ? (
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          src={src}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <VideoOff className="w-5 h-5" />
        </div>
      )}

      {/* simulated scanline + grain overlay to sell the CCTV look */}
      <div className="absolute inset-0 opacity-15 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_3px)]" />
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

const GRID_SLOTS = 6;

export function LiveCams() {
  const { data: zones, isLoading, error } = useListZones();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const zoneCams = (zones ?? []).slice(0, GRID_SLOTS).map((zone) => ({
    id: zone.id,
    name: zone.name,
    riskLevel: zone.riskLevel,
    src: footageByZone[zone.id],
  }));
  // Fill any remaining slots with the fixed perimeter camera rather than
  // stretching the zone feeds to an unnaturally large size.
  const cams = [...zoneCams];
  while (cams.length < GRID_SLOTS && zoneCams.length > 0) {
    cams.push({ ...EXTRA_CAMERA });
  }

  return (
    <div className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live Cams
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{cams.length} FEEDS</span>
      </div>

      <div className="p-3">
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
        {cams.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {cams.map((cam, i) => (
              <CameraTile key={`${cam.id}-${i}`} name={cam.name} riskLevel={cam.riskLevel} src={cam.src} now={now} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
