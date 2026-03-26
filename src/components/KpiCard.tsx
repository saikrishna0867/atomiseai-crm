import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'purple' | 'green' | 'cyan' | 'orange' | 'red' | 'blue';
  trend?: string;
}

const colorMap = {
  purple: 'text-primary bg-primary/10',
  green: 'text-accent-green bg-accent-green/10',
  cyan: 'text-accent-cyan bg-accent-cyan/10',
  orange: 'text-accent-orange bg-accent-orange/10',
  red: 'text-accent-red bg-accent-red/10',
  blue: 'text-blue-400 bg-blue-400/10',
};

export function KpiCard({ title, value, icon: Icon, color, trend }: KpiCardProps) {
  return (
    <div className="glass-card-purple p-5 hover:purple-glow transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-accent-green mt-1">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
