import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Bell, UserPlus, ArrowRightLeft, Calendar, Mail, Sparkles, ClipboardList, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
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
  const chipsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
        className="absolute right-0 top-full mt-2 z-50 w-[420px] max-h-[540px] rounded-2xl border overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, hsl(240 24% 9%), hsl(240 24% 7%))',
          borderColor: 'rgba(124,58,237,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(124,58,237,0.08)',
        }}
      >
        {/* Header — consistent 20px horizontal padding, 16px vertical */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(124,58,237,0.1)' }}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-[18px] h-[18px] text-primary" />
            <h3 className="font-display font-bold text-foreground text-sm tracking-tight">Notifications</h3>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold leading-none">
                {notifications.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Pending Tasks Banner — same px-5, consistent inner padding */}
        {taskCount > 0 && (
          <div
            className="mx-5 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5 my-[13px] mb-0"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)' }}
          >
            <ClipboardList className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[12px] text-muted-foreground leading-none">
              <span className="text-foreground font-semibold">{taskCount}</span> pending task{taskCount > 1 ? 's' : ''} awaiting action
            </span>
          </div>
        )}

        {/* Filter Chips with arrows */}
        <div className="relative border-b my-[2px] mb-[12px]" style={{ borderColor: 'rgba(124,58,237,0.08)' }}>
          <div
            ref={chipsRef}
            className="flex items-center gap-2 overflow-x-auto py-[24px] px-3 scrollbar-hide"
          >
            {eventTypes.map((type: string) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  filter === type
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-muted/15'
                }`}
                style={filter !== type ? { background: 'rgba(255,255,255,0.03)' } : undefined}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List with scroll arrows */}
        <div className="relative flex-1 min-h-0">
          <ScrollArea className="h-full">
          <div className="px-3 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-7 h-7 text-muted-foreground/25 mb-2" />
                <p className="text-[13px] text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((n: any) => {
                  const Icon = EVENT_ICONS[n.event_type] || ClipboardList;
                  const color = EVENT_COLORS[n.event_type] || '#a78bfa';
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-default"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}12` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[13px] text-foreground leading-[1.4] line-clamp-2">{n.description}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-muted-foreground leading-none">
                            {n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : ''}
                          </span>
                          {n.performed_by && (
                            <>
                              <span className="text-muted-foreground/25 text-[11px]">·</span>
                              <span className="text-[11px] text-muted-foreground/70 truncate max-w-[140px]">{n.performed_by}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
