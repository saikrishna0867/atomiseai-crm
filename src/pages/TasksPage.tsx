import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, AlertCircle, LayoutList, Columns3 } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const PRIORITY_BORDER: Record<string, string> = {
  High: '#f87171', Medium: '#fbbf24', Low: '#34d399',
};

export default function TasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', contact_name: '', assigned_to: '', due_date: '', priority: 'Medium', status: 'Pending', lead_id: '' });

  useEffect(() => { document.title = 'Tasks | Atomise CRM'; }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tasks').insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setAddOpen(false);
      setForm({ title: '', description: '', contact_name: '', assigned_to: '', due_date: '', priority: 'Medium', status: 'Pending', lead_id: '' });
      toast({ title: 'Task created ✅' });
    },
    onError: (e: any) => { console.error('[Tasks]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task updated' });
    },
  });

  const filtered = tasks.filter((t: any) => {
    return (statusFilter === 'all' || t.status === statusFilter) && (priorityFilter === 'all' || t.priority === priorityFilter);
  });

  const getDateStatus = (t: any) => {
    if (!t.due_date || t.status === 'Completed') return { isOverdue: false, isDueToday: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return {
      isOverdue: dueDate < today,
      isDueToday: dueDate.toDateString() === today.toDateString(),
    };
  };

  if (isLoading) {
    return <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-shimmer h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')} className="gap-1 border-border rounded-lg"><LayoutList className="w-4 h-4" /> List</Button>
          <Button variant={view === 'board' ? 'default' : 'outline'} size="sm" onClick={() => setView('board')} className="gap-1 border-border rounded-lg"><Columns3 className="w-4 h-4" /> Board</Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl"><Plus className="w-4 h-4" /> Add Task</Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 glass-input text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 glass-input text-sm"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks" description="Create a task to get started." action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Task</Button>} />
      ) : view === 'board' ? (
        <div className="grid grid-cols-3 gap-4">
          {STATUSES.map(status => (
            <div key={status} className="glass-card-purple rounded-2xl overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
                <h3 className="font-display font-semibold text-sm text-foreground">{status}</h3>
                <span className="text-xs text-muted-foreground">{filtered.filter((t: any) => t.status === status).length} tasks</span>
              </div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {filtered.filter((t: any) => t.status === status).map((t: any) => {
                  const { isOverdue, isDueToday } = getDateStatus(t);
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-3.5 border mb-2"
                      style={{
                        background: 'hsl(240 24% 10%)',
                        borderColor: 'rgba(124,58,237,0.15)',
                        borderLeft: `3px solid ${PRIORITY_BORDER[t.priority] || '#fbbf24'}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {isOverdue && <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium">⚠️ Overdue</span>}
                        {isDueToday && <span className="text-xs bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">📅 Due Today</span>}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1">{t.title}</p>
                      {t.contact_name && <p className="text-xs text-purple-bright mt-1">{t.contact_name}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                          {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">{t.assigned_to}</span>
                      </div>
                      <Select value={t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="h-7 text-xs mt-2 glass-input"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-purple overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
              {['Title', 'Contact', 'Priority', 'Due Date', 'Assigned To', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((t: any) => {
                const { isOverdue, isDueToday } = getDateStatus(t);
                return (
                <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(124,58,237,0.05)] transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      {isDueToday && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {t.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-purple-bright text-xs">{t.contact_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_BORDER[t.priority] || '#fbbf24' }} />
                      <span className="text-xs text-muted-foreground">{t.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      {t.due_date ? format(parseISO(t.due_date), 'MMM d, yyyy') : '—'}
                    </span>
                    {isOverdue && <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded ml-2">Overdue</span>}
                    {isDueToday && <span className="text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded ml-2">Due Today</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{t.assigned_to}</td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className="w-32 h-7 text-xs glass-input"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#141420] border-[rgba(124,58,237,0.3)] rounded-[20px]">
          <DialogHeader><DialogTitle className="font-display">Add Task</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Title *</Label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="glass-input w-full" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Description</Label><input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="glass-input w-full" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Contact Name</Label><input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} className="glass-input w-full" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Assigned To *</Label><input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} required className="glass-input w-full" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Due Date *</Label><input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className="glass-input w-full" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full font-display rounded-xl h-11" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Task'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
