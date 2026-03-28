import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Trash2, Eye, Edit, MoreHorizontal, Loader2, Droplets, Phone } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const SOURCES = ['Website Form', 'Referral', 'Cold Outreach', 'Social Media', 'Event', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const STAGE_STYLES: Record<string, string> = {
  'Lead': 'bg-[#1e3a5f] text-[#60a5fa] border-[#2563eb22]',
  'Qualified': 'bg-[#3f2d00] text-[#fbbf24] border-[#d9770022]',
  'Proposal': 'bg-[#3d1e00] text-[#fb923c] border-[#ea580022]',
  'Negotiation': 'bg-[#3d0a0a] text-[#f87171] border-[#dc262622]',
  'Closed Won': 'bg-[#0d3320] text-[#34d399] border-[#05966922]',
  'Closed Lost': 'bg-[#1f1f1f] text-[#9ca3af] border-[#37415122]'
};

const PRIORITY_DOT: Record<string, string> = {
  'High': '#f87171',
  'Medium': '#fbbf24',
  'Low': '#34d399'
};

export default function ContactsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {document.title = 'Contacts | Atomise CRM';}, []);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', source: 'Website Form',
    pipeline_stage: 'Lead', assigned_rep: '', assigned_rep_email: '', notes: '', tags: '', priority: 'Medium'
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
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
          pipelineStage: form.pipeline_stage, notes: form.notes
        }),
        webhooks.startDrip({
          leadId, contactName: form.name, contactEmail: form.email,
          assignedRep: form.assigned_rep, assignedRepEmail: form.assigned_rep_email,
          source: form.source, company: form.company
        }),
        supabase.from('activity_log').insert({
          lead_id: leadId, event_type: 'lead_assigned',
          description: 'Contact added to CRM', performed_by: 'System (n8n)'
        })
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setAddOpen(false);
      setForm({ name: '', email: '', phone: '', company: '', source: 'Website Form', pipeline_stage: 'Lead', assigned_rep: '', assigned_rep_email: '', notes: '', tags: '', priority: 'Medium' });
      toast({ title: '✅ Contact added! Automation triggered — drip sequence started.' });
    },
    onError: (e: any) => {console.error('[Contacts]', e);toast({ title: 'Error', description: e.message, variant: 'destructive' });}
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
    }
  });

  const filtered = contacts.filter((c: any) => {
    const matchSearch = !search || [c.name, c.email, c.company].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStage = stageFilter === 'all' || c.pipeline_stage === stageFilter;
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter;
    const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchSearch && matchStage && matchSource && matchPriority;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton-shimmer h-10 w-48 rounded-xl" />
        <div className="skeleton-shimmer h-12 rounded-xl" />
        <div className="skeleton-shimmer h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="glass-input w-full pr-3 text-sm rounded-[10px]" style={{ paddingLeft: '2.5rem' }} />
        </div>
        {[
          { value: stageFilter, onChange: setStageFilter, options: STAGES, label: 'Stage', width: 'w-40' },
          { value: sourceFilter, onChange: setSourceFilter, options: SOURCES, label: 'Source', width: 'w-36' },
          { value: priorityFilter, onChange: setPriorityFilter, options: PRIORITIES, label: 'Priority', width: 'w-32' },
        ].map((f) =>
          <Select key={f.label} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className={`${f.width} glass-input text-sm`}><SelectValue placeholder={f.label} /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All {f.label === 'Priority' ? 'Priorities' : `${f.label}s`}</SelectItem>
              {f.options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex-1" />
        <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl px-5 transition-all duration-200" style={{ background: '#c9a96e', color: '#07091e', boxShadow: '0 4px 20px rgba(201,169,110,0.4)' }}>
          <Plus className="w-4 h-4" /> Add Contact
        </Button>
      </div>

      {filtered.length === 0 ?
        <EmptyState icon={Users} title="No contacts yet" description="Add your first contact to get started." action={<Button onClick={() => setAddOpen(true)} className="gap-2" style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4" /> Add Contact</Button>} /> :

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(201,169,110,0.15)', background: '#10133a' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <th className="w-10 px-4 py-3"><Checkbox className="border-muted-foreground/40 pointer-events-none" checked={false} /></th>
                  {['Name', 'Phone', 'Company', 'Stage', 'Priority', 'Rep', 'Source', 'Created', 'Actions'].map((h) =>
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) =>
                  <tr key={c.id} className="h-[60px] border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(201,169,110,0.04)] transition-[background] duration-150">
                    <td className="px-4 py-3"><Checkbox className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary" /></td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: '#10133a', border: '1px solid #c9a96e', color: '#c9a96e' }}>
                          {c.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-xs">{c.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STAGE_STYLES[c.pipeline_stage] || STAGE_STYLES['Lead']}`}>
                        {c.pipeline_stage || 'Lead'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_DOT[c.priority] || PRIORITY_DOT['Medium'] }} />
                        <span className="text-xs text-muted-foreground">{c.priority || 'Medium'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.assigned_rep || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.source || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.created_at ? format(new Date(c.created_at), 'd MMM yyyy') : ''}</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-card border-border">
                          <DropdownMenuItem onClick={() => navigate(`/contacts/${c.lead_id || c.id}`)} className="gap-2"><Eye className="w-3.5 h-3.5" /> View Contact</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/contacts/${c.lead_id || c.id}?edit=true`)} className="gap-2"><Edit className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: 'Drip started ✅' })} className="gap-2"><Droplets className="w-3.5 h-3.5" /> Start Drip</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="gap-2 text-destructive"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      }

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-[560px]">
          <div
            className="rounded-[20px] overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{
              background: '#0d0f2b',
              border: '1px solid rgba(201,169,110,0.25)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,169,110,0.10)'
            }}>
            
            <div className="p-6 border-b" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-foreground">Add New Contact</DialogTitle>
              </DialogHeader>
              <p className="text-[13px] text-muted-foreground mt-1">Fill in the details below — automation will trigger automatically</p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const existing = contacts.find((c: any) => c.email?.toLowerCase() === form.email.toLowerCase());
              if (existing && !pendingSubmit) {
                setEmailWarning(true);
                return;
              }
              setPendingSubmit(false);
              addMutation.mutate();
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Full Name <span className="text-destructive">*</span></Label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="glass-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Email Address <span className="text-destructive">*</span></Label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="glass-input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Phone</Label>
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="glass-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Company</Label>
                  <input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} className="glass-input w-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Lead Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Pipeline Stage</Label>
                  <Select value={form.pipeline_stage} onValueChange={(v) => setForm((p) => ({ ...p, pipeline_stage: v }))}>
                    <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">Assigned Rep <span className="text-destructive">*</span></Label>
                  <input value={form.assigned_rep} onChange={(e) => setForm((p) => ({ ...p, assigned_rep: e.target.value }))} required className="glass-input w-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Assigned Rep Email <span className="text-destructive">*</span></Label>
                <input type="email" value={form.assigned_rep_email} onChange={(e) => setForm((p) => ({ ...p, assigned_rep_email: e.target.value }))} required className="glass-input w-full" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Tags (comma-separated)</Label>
                <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="glass-input w-full" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">Notes</Label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="glass-input w-full resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="text-muted-foreground">Cancel</Button>
                <Button
                  type="submit"
                  className="flex-1 font-display text-[15px] rounded-xl h-12 transition-all duration-200"
                  style={{ background: '#c9a96e', color: '#07091e', boxShadow: '0 4px 20px rgba(201,169,110,0.4)' }}
                  disabled={addMutation.isPending}>
                  {addMutation.isPending ?
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving & triggering automation...</> :
                    'Add Contact + Trigger Automation ⚡'
                  }
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Contact?"
        description="This action cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending} />

      <ConfirmDialog
        open={emailWarning}
        onOpenChange={(open) => {setEmailWarning(open);if (!open) setPendingSubmit(false);}}
        title="Duplicate Email Detected"
        description="A contact with this email already exists. Are you sure you want to add another?"
        confirmLabel="Continue"
        confirmVariant="default"
        onConfirm={() => {
          setEmailWarning(false);
          setPendingSubmit(true);
          setTimeout(() => addMutation.mutate(), 0);
        }} />
    </div>
  );
}