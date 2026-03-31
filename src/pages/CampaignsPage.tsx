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
  const [viewCampaign, setViewCampaign] = useState<any>(null);
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
        email_subject: form.email_subject, rep_name: form.rep_name, rep_email: form.rep_email, status: 'Sending', emails_sent: 0,
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

  const getStatusBadge = (status: string) => {
    const s = (status || 'draft').toLowerCase();
    if (s === 'completed' || s === 'sent') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green">
        <CheckCircle className="w-3 h-3" /> Completed
      </span>
    );
    if (s === 'running' || s === 'active' || s === 'sending') return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Running
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        Draft
      </span>
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); toast({ title: 'Campaign deleted' }); },
    onError: (e: any) => { console.error('[Campaigns]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  if (isLoading) return <div className="p-6"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl" style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4" /> Create Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns" description="Create and launch your first email campaign." action={<Button onClick={() => setAddOpen(true)} style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>} />
      ) : (
        <div className="glass-card-purple overflow-hidden rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
           <thead><tr style={{ background: 'rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
              {['Name', 'Target Stage', 'Status', 'Contacts', 'Launched', 'Launched By', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(201,169,110,0.04)]">
                  <td className="px-4 py-3 font-medium text-foreground">{c.campaign_name}</td>
                  <td className="px-4 py-3"><StatusBadge type="stage" value={c.target_stage} /></td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contacts_targeted || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.launched_at ? format(new Date(c.launched_at), 'd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.rep_name || '—'}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-[rgba(201,169,110,0.08)] transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="gap-2 text-xs" onClick={() => setViewCampaign(c)}><Eye className="w-3.5 h-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs text-red-400" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[20px] max-w-4xl max-h-[90vh] overflow-y-auto" style={{ background: '#0d0f2b', border: '1px solid rgba(201,169,110,0.25)' }}>
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
                    <button key={t} type="button" onClick={() => insertToken(t)} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ background: 'rgba(201,169,110,0.10)', color: '#c9a96e' }}>{t}</button>
                  ))}
                </div>
                <textarea ref={textareaRef} value={form.email_body} onChange={e => setForm(p => ({ ...p, email_body: e.target.value }))} required rows={6} className="glass-input w-full resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Name *</Label><input value={form.rep_name} onChange={e => setForm(p => ({ ...p, rep_name: e.target.value }))} required className="glass-input w-full" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Email *</Label><input type="email" value={form.rep_email} onChange={e => setForm(p => ({ ...p, rep_email: e.target.value }))} required className="glass-input w-full" /></div>
              </div>
              <Button type="submit" className="w-full gap-2 font-display rounded-xl h-11" style={{ background: '#c9a96e', color: '#07091e' }} disabled={launchMutation.isPending}>
                <Rocket className="w-4 h-4" /> {launchMutation.isPending ? 'Launching...' : '🚀 Launch Campaign'}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="w-4 h-4" /> Live Email Preview</div>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#10133a', border: '1px solid rgba(201,169,110,0.15)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
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

      {/* View Campaign Dialog */}
      <Dialog open={!!viewCampaign} onOpenChange={(open) => !open && setViewCampaign(null)}>
        <DialogContent className="rounded-[20px] max-w-lg" style={{ background: '#0d0f2b', border: '1px solid rgba(201,169,110,0.25)' }}>
          <DialogHeader><DialogTitle className="font-display">{viewCampaign?.campaign_name}</DialogTitle></DialogHeader>
          {viewCampaign && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">Target Stage</span><p className="text-foreground mt-0.5"><StatusBadge type="stage" value={viewCampaign.target_stage} /></p></div>
                <div><span className="text-muted-foreground text-xs">Status</span><div className="mt-0.5">{getStatusBadge(viewCampaign.status)}</div></div>
                <div><span className="text-muted-foreground text-xs">Contacts Targeted</span><p className="text-foreground mt-0.5">{viewCampaign.contacts_targeted || 0}</p></div>
                <div><span className="text-muted-foreground text-xs">Emails Sent</span><p className="text-foreground mt-0.5">{viewCampaign.emails_sent || 0}</p></div>
                <div><span className="text-muted-foreground text-xs">Launched</span><p className="text-foreground mt-0.5">{viewCampaign.launched_at ? format(new Date(viewCampaign.launched_at), 'd MMM yyyy') : '—'}</p></div>
                <div><span className="text-muted-foreground text-xs">Launched By</span><p className="text-foreground mt-0.5">{viewCampaign.rep_name || '—'}</p></div>
              </div>
              {viewCampaign.email_subject && (
                <div className="rounded-xl p-3" style={{ background: '#10133a', border: '1px solid rgba(201,169,110,0.10)' }}>
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-foreground font-medium">{viewCampaign.email_subject}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}