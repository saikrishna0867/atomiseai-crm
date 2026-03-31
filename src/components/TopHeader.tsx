import { useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationPopover } from '@/components/NotificationPopover';

interface TopHeaderProps {
  title: string;
  subtitle: string;
  userInitial: string;
  onMenuClick?: () => void;
}

export function TopHeader({ title, subtitle, userInitial, onMenuClick }: TopHeaderProps) {
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifCount = 0 } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const { count } = await supabase.from('activity_log').select('*', { count: 'exact', head: true });
      return count || 0;
    },
    refetchInterval: 30000,
  });

  return (
    <header
      className="h-14 md:h-16 flex items-center gap-3 md:gap-4 px-4 md:px-6 sticky top-0 z-40 shrink-0 border-b"
      style={{
        background: 'rgba(7,9,30,0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(201,169,110,0.10)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[rgba(201,169,110,0.08)] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg md:text-[22px] font-display font-bold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] md:text-[13px] text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative w-[280px] hidden md:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="glass-input w-full !pl-10 pr-3 text-sm rounded-[10px]"
        />
      </div>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-[rgba(201,169,110,0.08)] transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {taskCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {taskCount}
            </span>
          )}
        </button>
        <NotificationPopover open={notifOpen} onClose={() => setNotifOpen(false)} taskCount={taskCount} />
      </div>

      {/* User Avatar */}
      <div
        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: '#10133a', border: '1px solid #c9a96e', color: '#c9a96e' }}
      >
        {userInitial}
      </div>
    </header>
  );
}
