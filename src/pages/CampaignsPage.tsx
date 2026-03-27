import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Rocket, Eye } from 'lucide-react';
import { format } from 'date-fns';

const TARGET_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'All'];
const TOKENS = ['{{firstName}}', '{{company}}', '{{repName}}'];

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    campaign_name: '', target_stage: 'Lead', email_subject: '', email_body: '', rep_name: '', rep_email: '',
  });

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
          lead_id: campaignId,
          event_type: 'campaign_launched',
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
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const insertToken = (token: string) => {
    setForm(p => ({ ...p, email_body: p.email_body + token }));
  };

  const previewBody = form.email_body
    .replace(/\{\{firstName\}\}/g, 'Alex')
    .replace(/\{\{company\}\}/g, 'Acme Corp')
    .replace(/\{\{repName\}\}/g, form.rep_name || 'Your Rep');

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Campaigns</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns" description="Create and launch your first email campaign." action={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>} />
      ) : (
        <div className="glass-card-purple overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50">
              {['Name', 'Target Stage', 'Status', 'Contacts', 'Launched', 'Rep'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{c.campaign_name}</td>
                  <td className="px-4 py-3"><StatusBadge type="stage" value={c.target_stage} /></td>
                  <td className="px-4 py-3"><StatusBadge type="status" value={c.status || 'Draft'} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contacts_targeted || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.launched_at ? format(new Date(c.launched_at), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.rep_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Create Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={e => { e.preventDefault(); launchMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><Label className="text-foreground text-xs">Campaign Name *</Label><Input value={form.campaign_name} onChange={e => setForm(p => ({ ...p, campaign_name: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-1">
                <Label className="text-foreground text-xs">Target Stage *</Label>
                <Select value={form.target_stage} onValueChange={v => setForm(p => ({ ...p, target_stage: v }))}>
                  <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{TARGET_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-foreground text-xs">Email Subject *</Label><Input value={form.email_subject} onChange={e => setForm(p => ({ ...p, email_subject: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
              <div className="space-y-1">
                <Label className="text-foreground text-xs">Email Body *</Label>
                <div className="flex gap-1 mb-1">
                  {TOKENS.map(t => (
                    <button key={t} type="button" onClick={() => insertToken(t)} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">{t}</button>
                  ))}
                </div>
                <Textarea value={form.email_body} onChange={e => setForm(p => ({ ...p, email_body: e.target.value }))} required rows={6} className="bg-secondary border-border text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-foreground text-xs">Rep Name *</Label><Input value={form.rep_name} onChange={e => setForm(p => ({ ...p, rep_name: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
                <div className="space-y-1"><Label className="text-foreground text-xs">Rep Email *</Label><Input type="email" value={form.rep_email} onChange={e => setForm(p => ({ ...p, rep_email: e.target.value }))} required className="bg-secondary border-border text-foreground" /></div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={launchMutation.isPending}>
                <Rocket className="w-4 h-4" /> {launchMutation.isPending ? 'Launching...' : '🚀 Launch Campaign'}
              </Button>
            </form>

            {/* Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="w-4 h-4" /> Email Preview</div>
              <div className="glass-card-purple p-5 space-y-3">
                <div className="border-b border-border/50 pb-2">
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="text-sm text-foreground font-medium">{form.email_subject || 'Your subject line...'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Body</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{previewBody || 'Your email body...'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
