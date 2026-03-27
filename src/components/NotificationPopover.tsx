import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Bell, UserPlus, ArrowRightLeft, Calendar, Mail, Sparkles, ClipboardList, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EVENT_ICONS: Record<string, any> = {
  lead_assigned: UserPlus,
  stage_change: ArrowRightLeft,
  appointment_booked: Calendar,
  campaign_launched: Mail,
  summary_generated: Sparkles,
};

const EVENT_COLORS: Record<string, string> = {
  lead_assigned: '#34d399',
  stage_change: '#7c3aed',
  appointment_booked: '#60a5fa',
  campaign_launched: '#fbbf24',
  summary_generated: '#f472b6',
};

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
  taskCount: number;
}

export function NotificationPopover({ open, onClose, taskCount }: NotificationPopoverProps) {
  const [filter, setFilter] = useState<string>('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('id, lead_id, event_type, description, performed_by, timestamp')
        .order('timestamp', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: open,
    refetchInterval: open ? 15000 : false,
  });

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['pending-tasks-notif'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, status')
        .eq('status', 'Pending')
        .order('due_date', { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: open,
  });

  if (!open) return null;

  const eventTypes = ['all', ...new Set(notifications.map((n: any) => n.event_type))];
  const filtered = filter === 'all' ? notifications : notifications.filter((n: any) => n.event_type === filter);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-2 z-50 w-[400px] max-h-[520px] rounded-2xl border overflow-hidden flex flex-col"
        style={{
          background: 'hsl(240 24% 8%)',
          borderColor: 'rgba(124,58,237,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(124,58,237,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(124,58,237,0.12)' }}>
          <div className="flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-primary" />
            <h3 className="font-display font-bold text-foreground text-[15px]">Notifications</h3>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                {notifications.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/30 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Pending Tasks Banner */}
        {taskCount > 0 && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.15)' }}>
            <ClipboardList className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-foreground">
              <strong>{taskCount}</strong> pending task{taskCount > 1 ? 's' : ''} awaiting action
            </span>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto no-scrollbar">
          {eventTypes.map((type: string) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                filter === type
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted/10 text-muted-foreground hover:bg-muted/20'
              }`}
            >
              {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            filtered.map((n: any) => {
              const Icon = EVENT_ICONS[n.event_type] || ClipboardList;
              const color = EVENT_COLORS[n.event_type] || '#a78bfa';
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-muted/8 transition-colors cursor-default group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground leading-snug line-clamp-2">{n.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        {n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : ''}
                      </span>
                      {n.performed_by && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[11px] text-muted-foreground truncate">{n.performed_by}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
