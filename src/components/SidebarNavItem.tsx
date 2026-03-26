import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

export function SidebarNavItem({ to, icon: Icon, label }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <RouterNavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary border-l-2 border-primary ml-0 purple-glow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </RouterNavLink>
  );
}
