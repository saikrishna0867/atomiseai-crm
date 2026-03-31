import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Bell, UserPlus, ArrowRightLeft, Calendar, Mail, Sparkles, ClipboardList, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const EVENT_ICONS: Record<string, any> = {
  lead_assigned: UserPlus,
  stage_change: ArrowRightLeft,
  appointment_booked: Calendar,
  campaign_launched: Mail,
  summary_generated: Sparkles,
};

const EVENT_COLORS: Record<string, string> = {
  lead_assigned: '#c9a96e',
  stage_change: '#c9a96e',
  appointment_booked: '#c9a96e',
  campaign_launched: '#c9a96e',
  summary_generated: '#c9a96e',
};

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
  taskCount: number;
}

export function NotificationPopover({ open, onClose, taskCount }: NotificationPopoverProps) {
  const [filter, setFilter] = useState<string>('all');
  const chipsRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activity_log').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Notification removed' });
    },
  });
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
        .order('due_date', { ascending: true })
        .limit(20);
      return (data || []).filter(t => (t.status || '').toLowerCase() === 'pending').slice(0, 10);
    },
    enabled: open,
  });

  if (!open) return null;

  const eventTypes = ['all', ...new Set(notifications.map((n: any) => n.event_type))];
  const filtered = filter === 'all' ? notifications : notifications.filter((n: any) => n.event_type === filter);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[400px] max-h-[80vh] sm:max-h-[540px] rounded-2xl border overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0d0f2b, #07091e)',
          borderColor: 'rgba(201,169,110,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(201,169,110,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b"
          style={{ borderColor: 'rgba(201,169,110,0.10)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: '#c9a96e' }} />
            <h3 className="font-display font-bold text-foreground text-[13px] sm:text-sm tracking-tight">Notifications</h3>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
                {notifications.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Pending tasks banner */}
        {taskCount > 0 && (
          <div
            className="mx-3 sm:mx-4 mt-2.5 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.12)' }}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" style={{ color: '#c9a96e' }} />
            <span className="text-[11px] sm:text-[12px] text-muted-foreground leading-snug">
              <span className="text-foreground font-semibold">{taskCount}</span> pending task{taskCount > 1 ? 's' : ''} awaiting action
            </span>
          </div>
        )}

        {/* Filter chips */}
        <div className="border-b mt-2 mb-1" style={{ borderColor: 'rgba(201,169,110,0.08)' }}>
          <div ref={chipsRef} className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 px-3 scrollbar-hide">
            {eventTypes.map((type: string) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-all ${
                  filter === type
                    ? 'text-[#c9a96e]'
                    : 'text-muted-foreground hover:bg-muted/15'
                }`}
                style={filter === type ? { background: 'rgba(201,169,110,0.20)' } : { background: 'rgba(255,255,255,0.03)' }}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:max-h-[50vh] sm:[&>[data-radix-scroll-area-viewport]]:max-h-[380px]">
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-[rgba(201,169,110,0.3)] border-t-[#c9a96e] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-6 h-6 text-muted-foreground/25 mb-2" />
                <p className="text-[12px] sm:text-[13px] text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-px">
                {filtered.map((n: any) => {
                  const Icon = EVENT_ICONS[n.event_type] || ClipboardList;
                  const color = EVENT_COLORS[n.event_type] || '#c9a96e';
                  return (
                    <div key={n.id} className="group flex items-start gap-2.5 px-2 py-2 sm:py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-default">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0 pt-px">
                        <p className="text-[12px] sm:text-[13px] text-foreground leading-[1.4] line-clamp-2">{n.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground leading-none">
                            {n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : ''}
                          </span>
                          {n.performed_by && (
                            <>
                              <span className="text-muted-foreground/25 text-[10px]">·</span>
                              <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 truncate max-w-[100px] sm:max-w-[140px]">{n.performed_by}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNotification.mutate(n.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all shrink-0"
                        title="Remove notification"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}