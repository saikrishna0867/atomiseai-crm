import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bot, Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AISummariesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-ai'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('lead_id, name, email, pipeline_stage, assigned_rep_email');
      return data || [];
    },
  });

  const { data: summaries = [], refetch } = useQuery({
    queryKey: ['ai_summaries'],
    queryFn: async () => {
      const { data } = await supabase.from('ai_summaries').select('*').order('generated_at', { ascending: false });
      return data || [];
    },
  });

  const filteredContacts = contacts.filter((c: any) => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
  const selectedSummary = selectedLead ? summaries.find((s: any) => s.lead_id === selectedLead) : null;
  const selectedContact = selectedLead ? contacts.find((c: any) => c.lead_id === selectedLead) : null;

  const handleGenerate = async (leadId: string) => {
    const contact = contacts.find((c: any) => c.lead_id === leadId);
    if (!contact) return;
    setGenerating(leadId);
    try {
      await webhooks.generateSummary({ leadId, repEmail: contact.assigned_rep_email || '' });
      toast({ title: '🤖 AI is analyzing...' });
      setTimeout(async () => {
        await refetch();
        setGenerating(null);
      }, 8000);
    } catch {
      setGenerating(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-display font-bold text-foreground">AI Summaries</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        {/* Contact List */}
        <div className="glass-card-purple p-4 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9 bg-secondary border-border text-foreground" />
          </div>
          {filteredContacts.map((c: any) => {
            const hasSummary = summaries.some((s: any) => s.lead_id === c.lead_id);
            return (
              <button
                key={c.lead_id}
                onClick={() => setSelectedLead(c.lead_id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedLead === c.lead_id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {hasSummary && <span className="w-2 h-2 rounded-full bg-accent-green" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge type="stage" value={c.pipeline_stage || ''} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary Detail */}
        <div className="lg:col-span-2 glass-card-purple p-6">
          {!selectedLead ? (
            <EmptyState icon={Bot} title="Select a contact" description="Choose a contact from the left to view or generate an AI summary." />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">{selectedContact?.name}</h2>
                  <StatusBadge type="stage" value={selectedContact?.pipeline_stage || ''} />
                </div>
                <Button onClick={() => handleGenerate(selectedLead)} disabled={generating === selectedLead} className="gap-2">
                  {generating === selectedLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Generate Summary
                </Button>
              </div>

              {generating === selectedLead && (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <p className="text-sm text-primary flex items-center gap-2"><Bot className="w-4 h-4" /> AI is analyzing...</p>
                </div>
              )}

              {!generating && selectedSummary && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="glass-card-purple p-4">
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Summary</h3>
                    <p className="text-sm text-foreground leading-relaxed">{selectedSummary.summary}</p>
                  </div>
                  <div className="glass-card-purple p-4">
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Next Action</h3>
                    <p className="text-sm text-foreground">{selectedSummary.next_action}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Sentiment:</span>
                    <StatusBadge type="status" value={selectedSummary.sentiment || 'Neutral'} />
                  </div>
                  {selectedSummary.generated_at && (
                    <p className="text-xs text-muted-foreground">Generated {formatDistanceToNow(new Date(selectedSummary.generated_at), { addSuffix: true })}</p>
                  )}
                </div>
              )}

              {!generating && !selectedSummary && (
                <EmptyState icon={Bot} title="No summary yet" description="Generate an AI summary for this contact." action={<Button onClick={() => handleGenerate(selectedLead)} className="gap-2"><Bot className="w-4 h-4" /> Generate First Summary</Button>} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
