import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, AlertCircle, LayoutList, Columns3, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const PRIORITY_BORDER: Record<string, string> = {
  High: '#f87171', Medium: '#fbbf24', Low: '#34d399',
};

export default function TasksPage() {
  const { toast } = useToast();
  const { search: globalSearch = '' } = (useOutletContext<{ search?: string }>() || {});
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', contact_name: '', assigned_to: '', due_date: '', priority: 'Medium', status: 'Pending', lead_id: '' });

  useEffect(() => { document.title = 'Tasks | Atomise AI CRM'; }, []);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pending-tasks-notif'] });
      setDeleteTarget(null);
      toast({ title: 'Task deleted 🗑️' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const q = globalSearch.trim().toLowerCase();
  const filtered = tasks.filter((t: any) => {
    const tStatus = (t.status || '').toLowerCase();
    const tPriority = (t.priority || '').toLowerCase();
    const matchSearch = !q || [t.title, t.description, t.contact_name, t.assigned_to].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    return matchSearch && (statusFilter === 'all' || tStatus === statusFilter.toLowerCase()) && (priorityFilter === 'all' || tPriority === priorityFilter.toLowerCase());
  });

  const getDateStatus = (t: any) => {
    if (!t.due_date || (t.status || '').toLowerCase() === 'completed') return { isOverdue: false, isDueToday: false };
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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div />
        <div className="flex flex-wrap gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')} className="gap-1 rounded-lg"><LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">List</span></Button>
          <Button variant={view === 'board' ? 'default' : 'outline'} size="sm" onClick={() => setView('board')} className="gap-1 rounded-lg"><Columns3 className="w-4 h-4" /> <span className="hidden sm:inline">Board</span></Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl" style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Task</span></Button>
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
        <EmptyState icon={CheckSquare} title="No tasks" description="Create a task to get started." action={<Button onClick={() => setAddOpen(true)} style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4 mr-2" /> Add Task</Button>} />
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {STATUSES.map(status => (
            <div key={status} className="glass-card-purple rounded-2xl overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
                <h3 className="font-display font-semibold text-sm text-foreground">{status}</h3>
                <span className="text-xs text-muted-foreground">{filtered.filter((t: any) => (t.status || '').toLowerCase() === status.toLowerCase()).length} tasks</span>
              </div>
              <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                {filtered.filter((t: any) => (t.status || '').toLowerCase() === status.toLowerCase()).map((t: any) => {
                  const { isOverdue, isDueToday } = getDateStatus(t);
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-3.5 border mb-2"
                      style={{
                        background: '#10133a',
                        borderColor: 'rgba(201,169,110,0.15)',
                        borderLeft: `3px solid ${PRIORITY_BORDER[t.priority] || '#fbbf24'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOverdue && <span className="text-xs bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium">⚠️ Overdue</span>}
                          {isDueToday && <span className="text-xs bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-medium">📅 Due Today</span>}
                        </div>
                        <button onClick={() => setDeleteTarget(t.id)} className="p-1 rounded-md hover:bg-destructive/20 transition-colors shrink-0" title="Delete task">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1">{t.title}</p>
                      {t.contact_name && <p className="text-xs mt-1" style={{ color: '#c9a96e' }}>{t.contact_name}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                          {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">{t.assigned_to}</span>
                      </div>
                      <Select value={STATUSES.find(s => s.toLowerCase() === (t.status || '').toLowerCase()) || t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
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
            <thead><tr style={{ background: 'rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
              {['Title', 'Contact', 'Priority', 'Due Date', 'Assigned To', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((t: any) => {
                const { isOverdue, isDueToday } = getDateStatus(t);
                return (
                <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(201,169,110,0.04)] transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      {isDueToday && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {t.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#c9a96e' }}>{t.contact_name}</td>
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
                    <div className="flex items-center gap-2">
                      <Select value={STATUSES.find(s => s.toLowerCase() === (t.status || '').toLowerCase()) || t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="w-32 h-7 text-xs glass-input"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-border">{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <button onClick={() => setDeleteTarget(t.id)} className="p-1 rounded-md hover:bg-destructive/20 transition-colors" title="Delete task">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[20px]" style={{ background: '#0d0f2b', border: '1px solid rgba(201,169,110,0.25)' }}>
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
            <Button type="submit" className="w-full font-display rounded-xl h-11" style={{ background: '#c9a96e', color: '#07091e' }} disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Task'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
        confirmLabel="Delete"
      />
    </div>
  );
}