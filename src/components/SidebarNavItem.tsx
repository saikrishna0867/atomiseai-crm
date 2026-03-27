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
        'flex items-center gap-3 h-11 px-4 mx-3 text-sm font-medium transition-all duration-[180ms] ease-out my-0.5',
        isActive
          ? 'bg-[rgba(124,58,237,0.18)] text-foreground border-l-[3px] border-primary rounded-r-[8px] rounded-l-none shadow-[inset_0_0_20px_rgba(124,58,237,0.1)]'
          : 'text-muted-foreground hover:text-[#e0e0ff] hover:bg-[rgba(124,58,237,0.08)] border-l-[3px] border-transparent rounded-[10px]'
      )}
    >
      <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors duration-[180ms]', isActive ? 'text-purple-bright' : 'group-hover:text-purple-bright')} />
      <span>{label}</span>
    </RouterNavLink>
  );
}
