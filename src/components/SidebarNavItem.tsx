import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export function SidebarNavItem({ to, icon: Icon, label, collapsed }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <RouterNavLink
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center h-11 text-sm font-medium transition-all duration-[180ms] ease-out my-0.5',
        collapsed ? 'justify-center mx-2 px-0 rounded-[10px]' : 'gap-3 px-4 mx-3',
        isActive
          ? 'bg-[rgba(201,169,110,0.10)] text-[#e8c98a] border-l-[3px] border-[#c9a96e] rounded-r-[10px] rounded-l-none shadow-[inset_0_0_20px_rgba(201,169,110,0.06)]'
          : 'text-[#7a80b0] hover:text-[#d4b483] hover:bg-[rgba(201,169,110,0.06)] border-l-[3px] border-transparent rounded-[10px]',
        collapsed && isActive && 'border-l-0 rounded-[10px] mx-2'
      )}
    >
      <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors duration-[180ms]', isActive ? 'text-[#c9a96e]' : '')} />
      {!collapsed && <span>{label}</span>}
    </RouterNavLink>
  );
}