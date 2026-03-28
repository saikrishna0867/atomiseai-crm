import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  glowColor: string;
  iconColor: string;
  trend?: string;
  delay?: number;
}

export function KpiCard({ title, value, icon: Icon, glowColor, iconColor, trend, delay = 0 }: KpiCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border animate-fade-up hover:translate-y-[-2px] transition-transform duration-200"
      style={{
        background: 'linear-gradient(135deg, #10133a 0%, #141852 100%)',
        borderColor: 'rgba(201,169,110,0.15)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-30"
        style={{ background: glowColor, filter: 'blur(20px)' }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.08em]">{title}</p>
          <p className="text-4xl font-body font-bold text-foreground mt-3">{value}</p>
          {trend && (
            <p className="text-xs text-accent-green mt-2 flex items-center gap-1">
              <span>▲</span> {trend}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${glowColor}15` }}>
          <Icon className="w-5 h-5" style={{ color: '#c9a96e' }} />
        </div>
      </div>
    </div>
  );
}