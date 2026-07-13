import React, { useState } from 'react';
import { useListSensors, useGetSensorHistory } from '@workspace/api-client-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Activity, Thermometer, Wind, Zap, Gauge, Camera, Filter, Cpu } from 'lucide-react';
import { format } from 'date-fns';

const iconMap: Record<string, any> = {
  gas: Wind,
  temperature: Thermometer,
  vibration: Activity,
  pressure: Gauge,
  proximity: Zap,
  camera: Camera,
  control: Cpu
};

export default function Sensors() {
  const [filterType, setFilterType] = useState<string>('');
  const { data: sensors, isLoading } = useListSensors(
    filterType ? { sensorType: filterType as any } : undefined,
  );
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sensor Array</h2>
          <p className="text-muted-foreground text-sm">Live telemetry across the facility.</p>
        </div>
        
        <select 
          className="h-9 px-3 border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Sensor Types</option>
          <option value="gas">Gas</option>
          <option value="temperature">Temperature</option>
          <option value="vibration">Vibration</option>
          <option value="pressure">Pressure</option>
          <option value="proximity">Proximity</option>
          <option value="camera">Camera</option>
          <option value="control">Control (AI)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Sensor List */}
        <div className="lg:col-span-2 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground font-mono animate-pulse">Loading telemetry...</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 border-b font-mono text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 font-medium">Sensor</th>
                    <th className="px-5 py-3 font-medium">Zone</th>
                    <th className="px-5 py-3 font-medium">Reading</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sensors?.map((sensor) => {
                    const Icon = iconMap[sensor.sensorType] || Activity;
                    const isSelected = selectedSensor === sensor.id;
                    return (
                      <tr 
                        key={sensor.id} 
                        onClick={() => setSelectedSensor(sensor.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${sensor.status === 'critical' ? 'bg-destructive/10 text-destructive' : sensor.status === 'warning' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold">{sensor.name}</div>
                              <div className="text-[10px] font-mono text-muted-foreground uppercase">{sensor.sensorType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{sensor.zoneName}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono font-bold text-[15px]">{sensor.latestValue.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-1">{sensor.unit}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={sensor.status === 'critical' ? 'destructive' : sensor.status === 'warning' ? 'high' : 'secondary'} className="text-[10px] uppercase font-mono">
                            {sensor.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground font-mono">
                          {format(new Date(sensor.updatedAt), 'HH:mm:ss')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sensor Detail Panel */}
        <div className="lg:col-span-1 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedSensor ? (
            <SensorDetail id={selectedSensor} sensors={sensors || []} />
          ) : (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a sensor to view historical data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function SensorDetail({ id, sensors }: { id: string, sensors: any[] }) {
  const { data: history, isLoading } = useGetSensorHistory(id);
  const sensor = sensors.find(s => s.id === id);

  if (!sensor) return null;
  const Icon = iconMap[sensor.sensorType] || Activity;

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b bg-muted/10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-md ${sensor.status === 'critical' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">{sensor.name}</h3>
            <span className="text-xs font-mono uppercase text-muted-foreground">{sensor.id}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Type</span>
            <span className="font-medium">{sensor.sensorType}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs uppercase tracking-wider">Zone</span>
            <span className="font-medium font-mono">{sensor.zoneName}</span>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Latest Readout</h4>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl font-bold font-mono tracking-tight">{sensor.latestValue.toFixed(2)}</span>
          <span className="text-lg text-muted-foreground font-mono">{sensor.unit}</span>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Signal History</h4>
        <div className="flex-1 min-h-[200px] -ml-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">Loading signal...</div>
          ) : history?.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No historical data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history?.slice().reverse()}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => format(new Date(ts), 'HH:mm:ss')}
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  stroke="hsl(var(--border))"
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  minTickGap={30}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  width={40}
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  stroke="hsl(var(--border))"
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}
                  labelFormatter={(lbl) => format(new Date(lbl as string), 'HH:mm:ss')}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
