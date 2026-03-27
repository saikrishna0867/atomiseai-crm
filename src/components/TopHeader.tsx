import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationPopover } from '@/components/NotificationPopover';

interface TopHeaderProps {
  title: string;
  subtitle: string;
  userInitial: string;
}

export function TopHeader({ title, subtitle, userInitial }: TopHeaderProps) {
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: taskCount = 0 } = useQuery({
    queryKey: ['unread-tasks-count'],
    queryFn: async () => {
      const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      return count || 0;
    },
    refetchInterval: 30000,
  });

  return (
    <header
      className="h-16 flex items-center gap-4 px-6 sticky top-0 z-40 shrink-0 border-b"
      style={{
        background: 'rgba(10,10,24,0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(124,58,237,0.1)',
      }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-[22px] font-display font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground truncate">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative w-[280px] hidden md:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="glass-input w-full !pl-10 pr-3 py-2 text-sm rounded-[10px]"
        />
      </div>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-[rgba(124,58,237,0.08)] transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {taskCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {taskCount > 99 ? '99+' : taskCount}
            </span>
          )}
        </button>
        <NotificationPopover open={notifOpen} onClose={() => setNotifOpen(false)} taskCount={taskCount} />
      </div>

      {/* User Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
      >
        {userInitial}
      </div>
    </header>
  );
}
