import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Rocket, Eye, MoreHorizontal, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const TARGET_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'All'];
const TOKENS = ['{{firstName}}', '{{company}}', '{{repName}}', '{{leadId}}'];

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState({
    campaign_name: '', target_stage: 'Lead', email_subject: '', email_body: '', rep_name: '', rep_email: '',
  });

  useEffect(() => { document.title = 'Campaigns | Atomise CRM'; }, []);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').order('launched_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const launchMutation = useMutation({
    mutationFn: async () => {
      const campaignId = crypto.randomUUID();
      const { error } = await supabase.from('campaigns').insert({
        campaign_id: campaignId, campaign_name: form.campaign_name, target_stage: form.target_stage,
        email_subject: form.email_subject, rep_name: form.rep_name, status: 'Sending', contacts_targeted: 0,
      });
      if (error) throw error;

      await Promise.allSettled([
        webhooks.runCampaign({
          campaignId, campaignName: form.campaign_name, targetStage: form.target_stage,
          emailSubject: form.email_subject, emailBody: form.email_body,
          repName: form.rep_name, repEmail: form.rep_email,
        }),
        supabase.from('activity_log').insert({
          lead_id: campaignId, event_type: 'campaign_launched',
          description: `Campaign "${form.campaign_name}" launched targeting ${form.target_stage}`,
          performed_by: form.rep_name,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setAddOpen(false);
      setForm({ campaign_name: '', target_stage: 'Lead', email_subject: '', email_body: '', rep_name: '', rep_email: '' });
      toast({ title: 'Campaign launched — emails sending now 🚀' });
    },
    onError: (e: any) => { console.error('[Campaigns]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.email_body;
      const newText = text.substring(0, start) + token + text.substring(end);
      setForm(p => ({ ...p, email_body: newText }));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + token.length;
        textarea.focus();
      }, 0);
    } else {
      setForm(p => ({ ...p, email_body: p.email_body + token }));
    }
  };

  const previewBody = form.email_body
    .replace(/\{\{firstName\}\}/g, 'Alex')
    .replace(/\{\{company\}\}/g, 'Acme Corp')
    .replace(/\{\{repName\}\}/g, form.rep_name || 'Your Rep')
    .replace(/\{\{leadId\}\}/g, 'LD-001');

  const getStatusStyle = (status: string) => {
    if (status === 'Active' || status === 'Sending') return 'bg-accent-green/10 text-accent-green';
    if (status === 'Sent') return 'bg-accent-green/10 text-accent-green';
    return 'bg-muted text-muted-foreground';
  };

  if (isLoading) return <div className="p-6"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl"><Plus className="w-4 h-4" /> Create Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns" description="Create and launch your first email campaign." action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>} />
      ) : (
        <div className="glass-card-purple overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead><tr style={{ background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
              {['Name', 'Target Stage', 'Status', 'Contacts', 'Launched', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(124,58,237,0.05)]">
                  <td className="px-4 py-3 font-medium text-foreground">{c.campaign_name}</td>
                  <td className="px-4 py-3"><StatusBadge type="stage" value={c.target_stage} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(c.status)}`}>
                      {(c.status === 'Active' || c.status === 'Sending') && <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />}
                      {c.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contacts_targeted || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.launched_at ? format(new Date(c.launched_at), 'd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.rep_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#141420] border-[rgba(124,58,237,0.3)] rounded-[20px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Create Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={e => { e.preventDefault(); launchMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Campaign Name *</Label><input value={form.campaign_name} onChange={e => setForm(p => ({ ...p, campaign_name: e.target.value }))} required className="glass-input w-full" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target Stage *</Label>
                <Select value={form.target_stage} onValueChange={v => setForm(p => ({ ...p, target_stage: v }))}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{TARGET_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Email Subject *</Label><input value={form.email_subject} onChange={e => setForm(p => ({ ...p, email_subject: e.target.value }))} required className="glass-input w-full" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Body *</Label>
                <div className="flex gap-1 mb-1">
                  {TOKENS.map(t => (
                    <button key={t} type="button" onClick={() => insertToken(t)} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{t}</button>
                  ))}
                </div>
                <textarea ref={textareaRef} value={form.email_body} onChange={e => setForm(p => ({ ...p, email_body: e.target.value }))} required rows={6} className="glass-input w-full resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Name *</Label><input value={form.rep_name} onChange={e => setForm(p => ({ ...p, rep_name: e.target.value }))} required className="glass-input w-full" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Email *</Label><input type="email" value={form.rep_email} onChange={e => setForm(p => ({ ...p, rep_email: e.target.value }))} required className="glass-input w-full" /></div>
              </div>
              <Button type="submit" className="w-full gap-2 font-display rounded-xl h-11" disabled={launchMutation.isPending}>
                <Rocket className="w-4 h-4" /> {launchMutation.isPending ? 'Launching...' : '🚀 Launch Campaign'}
              </Button>
            </form>

            {/* Live Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="w-4 h-4" /> Live Email Preview</div>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1a2a', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'rgba(124,58,237,0.1)' }}>
                  <p className="text-xs text-muted-foreground">From: <span className="text-foreground">{form.rep_name || 'Rep'} &lt;{form.rep_email || 'rep@company.com'}&gt;</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Subject: <span className="text-foreground font-medium">{form.email_subject || 'Your subject line...'}</span></p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{previewBody || 'Your email body will appear here...'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
