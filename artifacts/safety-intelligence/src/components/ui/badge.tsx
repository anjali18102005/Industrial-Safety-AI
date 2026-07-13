import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Cpu } from 'lucide-react';

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        critical: "border-transparent bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]",
        high: "border-transparent bg-orange-500 text-white",
        medium: "border-transparent bg-amber-400 text-amber-950",
        low: "border-transparent bg-emerald-600 text-white",
        active: "border-transparent bg-blue-600 text-white",
        resolved: "border-transparent bg-slate-200 text-slate-800",
        monitoring: "border-transparent bg-purple-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

export function RiskBadge({ level, className }: { level: string, className?: string }) {
  const v = level === 'critical' ? 'critical' : level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low';
  return (
    <Badge variant={v as any} className={`uppercase tracking-wider font-mono text-[10px] ${className}`}>
      {level}
    </Badge>
  );
}

export function AiDetectedBadge({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] uppercase font-bold tracking-wider ${className ?? ''}`}>
      <Cpu className="w-3 h-3" /> AI Detected
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  let v = 'secondary';
  if (status === 'active' || status === 'warning') v = 'high';
  if (status === 'critical') v = 'critical';
  if (status === 'resolved' || status === 'normal') v = 'low';
  if (status === 'monitoring') v = 'monitoring';
  
  return (
    <Badge variant={v as any} className={`uppercase tracking-wider font-mono text-[10px] ${className}`}>
      {status}
    </Badge>
  );
}
