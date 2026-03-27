import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Trash2, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website Form', 'Referral', 'Cold Outreach', 'Social Media', 'Event', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

export default function ContactsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', source: 'Website Form',
    pipeline_stage: 'Lead', assigned_rep: '', assigned_rep_email: '', notes: '', tags: '', priority: 'Medium',
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const leadId = crypto.randomUUID();
      const { tags, ...rest } = form;
      const record = { ...rest, lead_id: leadId };
      const { error } = await supabase.from('contacts').insert(record);
      if (error) throw error;

      await Promise.allSettled([
        webhooks.newLead({
          name: form.name, email: form.email, phone: form.phone, company: form.company,
          source: form.source, assignedRep: form.assigned_rep, assignedRepEmail: form.assigned_rep_email,
          pipelineStage: form.pipeline_stage, notes: form.notes,
        }),
        webhooks.startDrip({
          leadId, contactName: form.name, contactEmail: form.email,
          assignedRep: form.assigned_rep, assignedRepEmail: form.assigned_rep_email,
          source: form.source, company: form.company,
        }),
        supabase.from('activity_log').insert({
          lead_id: leadId,
          event_type: 'lead_assigned',
          description: 'New contact added to CRM',
          performed_by: 'System',
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setAddOpen(false);
      setForm({ name: '', email: '', phone: '', company: '', source: 'Website Form', pipeline_stage: 'Lead', assigned_rep: '', assigned_rep_email: '', notes: '', tags: '', priority: 'Medium' });
      toast({ title: 'Contact added & automation triggered ✅' });
    },
    onError: (e: any) => { console.error('[Contacts]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setDeleteId(null);
      toast({ title: 'Contact deleted' });
    },
  });

  const filtered = contacts.filter((c: any) => {
    const matchSearch = !search || [c.name, c.email, c.company].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStage = stageFilter === 'all' || c.pipeline_stage === stageFilter;
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter;
    return matchSearch && matchStage && matchSource;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Contacts</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 bg-secondary border-border text-foreground" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border text-foreground"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border text-foreground"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" description="Add your first contact to get started." action={<Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>} />
      ) : (
        <div className="glass-card-purple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {['Name', 'Email', 'Phone', 'Company', 'Stage', 'Source', 'Priority', 'Rep', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{c.name?.charAt(0)}</div>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.company}</td>
                    <td className="px-4 py-3"><StatusBadge type="stage" value={c.pipeline_stage || ''} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.source}</td>
                    <td className="px-4 py-3"><StatusBadge type="priority" value={c.priority || 'Medium'} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.assigned_rep}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button title="View" onClick={() => navigate(`/contacts/${c.lead_id || c.id}`)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                        <button title="Edit" onClick={() => navigate(`/contacts/${c.lead_id || c.id}?edit=true`)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button title="Delete" onClick={() => setDeleteId(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Add Contact</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3">
            {[
              { key: 'name', label: 'Name', required: true },
              { key: 'email', label: 'Email', required: true, type: 'email' },
              { key: 'phone', label: 'Phone' },
              { key: 'company', label: 'Company' },
              { key: 'assigned_rep', label: 'Assigned Rep', required: true },
              { key: 'assigned_rep_email', label: 'Rep Email', required: true, type: 'email' },
              { key: 'notes', label: 'Notes' },
              { key: 'tags', label: 'Tags (comma-separated)' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-foreground text-xs">{f.label}{f.required && ' *'}</Label>
                <Input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  required={f.required}
                  type={f.type || 'text'}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-foreground text-xs">Source</Label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-foreground text-xs">Stage</Label>
                <Select value={form.pipeline_stage} onValueChange={v => setForm(p => ({ ...p, pipeline_stage: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Contact?"
        description="This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
