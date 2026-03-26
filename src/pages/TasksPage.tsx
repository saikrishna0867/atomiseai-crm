import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, AlertCircle } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function TasksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', contact_name: '', assigned_to: '', due_date: '', priority: 'Medium', status: 'Pending', lead_id: '' });

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
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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

  const isOverdue = (t: any) => t.due_date && t.status !== 'Completed' && isPast(parseISO(t.due_date));

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Tasks</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-secondary border-border text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 bg-secondary border-border text-foreground"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks" description="Create a task to get started." action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Task</Button>} />
      ) : (
        <div className="glass-card-purple overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50">
              {['Title', 'Contact', 'Priority', 'Due Date', 'Assigned To', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {isOverdue(t) && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      {t.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.contact_name}</td>
                  <td className="px-4 py-3"><StatusBadge type="priority" value={t.priority} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${isOverdue(t) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {t.due_date ? format(parseISO(t.due_date), 'MMM d, yyyy') : '—'}
                    </span>
                    {isOverdue(t) && <StatusBadge type="status" value="Pending" className="ml-2" />}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.assigned_to}</td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className="w-32 h-7 text-xs bg-transparent border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Add Task</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3">
            <div className="space-y-1"><Label className="text-foreground text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-1"><Label className="text-foreground text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-1"><Label className="text-foreground text-xs">Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-1"><Label className="text-foreground text-xs">Assigned To *</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-1"><Label className="text-foreground text-xs">Due Date *</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-foreground text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-foreground text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Task'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
