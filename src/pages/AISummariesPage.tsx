import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const HEALTH_CONFIG: Record<string, { emoji: string; label: string; bg: string; text: string; border: string; dot: string }> = {
  Hot: { emoji: '🔥', label: 'Hot', bg: 'rgba(52,211,153,0.15)', text: '#34d399', border: 'rgba(52,211,153,0.3)', dot: '#34d399' },
  Warm: { emoji: '😊', label: 'Warm', bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)', dot: '#fbbf24' },
  Cold: { emoji: '❄️', label: 'Cold', bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', border: 'rgba(96,165,250,0.3)', dot: '#60a5fa' },
  Unknown: { emoji: '⚪', label: 'Unknown', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)', dot: '#94a3b8' },
};

export default function AISummariesPage() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => { document.title = 'AI Summaries | Atomise CRM'; }, []);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-ai'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('name, email, lead_id, pipeline_stage');
      return data || [];
    },
  });

  const { data: allSummaries = [] } = useQuery({
    queryKey: ['ai_summaries_index'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_summaries').select('lead_id, deal_health, sentiment, generated_at, contact_name').order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const summaryMap = new Map<string, { deal_health: string; generated_at: string; contact_name: string }>();
  allSummaries.forEach((s: any) => {
    if (!summaryMap.has(s.lead_id)) summaryMap.set(s.lead_id, s);
  });

  const fetchSummary = async (leadId: string) => {
    setLoadingSummary(true);
    setSummary(null);
    try {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('lead_id', leadId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setSummary(data);
    } catch (e: any) {
      console.error('[AI Summary fetch]', e);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSelectContact = (leadId: string) => {
    setSelectedLeadId(leadId);
    fetchSummary(leadId);
  };

  const handleGenerate = async (leadId: string) => {
    setGenerating(true);
    try {
      const repEmail = user?.email || session?.user?.email || 'admin@atomise.ai';
      await webhooks.generateSummary({ leadId, repEmail });
      toast({ title: '🤖 AI is analyzing contact history...' });
      await new Promise(r => setTimeout(r, 8000));
      await queryClient.invalidateQueries({ queryKey: ['ai_summaries_index'] });
      await fetchSummary(leadId);
      setSelectedLeadId(leadId);
      toast({ title: 'AI Summary generated ✅' });
    } catch (e: any) {
      console.error('[AI Generate]', e);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromDropdown = (leadId: string) => {
    setSelectedLeadId(leadId);
    handleGenerate(leadId);
  };

  const contactsWithMeta = contacts.map((c: any) => ({
    ...c,
    hasSummary: summaryMap.has(c.lead_id),
    deal_health: summaryMap.get(c.lead_id)?.deal_health,
    generatedAt: summaryMap.get(c.lead_id)?.generated_at,
  }));

  const sorted = [...contactsWithMeta].sort((a, b) => {
    if (a.hasSummary && !b.hasSummary) return -1;
    if (!a.hasSummary && b.hasSummary) return 1;
    return 0;
  });

  const filtered = sorted.filter(c => !searchQ || c.name?.toLowerCase().includes(searchQ.toLowerCase()));

  const selectedContact = contacts.find((c: any) => c.lead_id === selectedLeadId);
  const healthValue = summary?.deal_health || (summary?.sentiment === 'Positive' ? 'Hot' : summary?.sentiment === 'Neutral' ? 'Warm' : summary?.sentiment === 'Needs Attention' ? 'Cold' : 'Unknown');
  const sent = summary ? (HEALTH_CONFIG[healthValue] || HEALTH_CONFIG.Unknown) : null;

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="w-full md:w-80 shrink-0 flex flex-col glass-card-purple overflow-hidden max-h-[50vh] md:max-h-none">
        <div className="p-4 border-b" style={{ borderColor: 'rgba(201,169,110,0.15)' }}>
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Generate New Summary</h3>
          <Select onValueChange={handleGenerateFromDropdown}>
            <SelectTrigger className="glass-input text-sm" disabled={generating}>
              <SelectValue placeholder="Select contact..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-48">
              {contacts.map((c: any) => <SelectItem key={c.lead_id} value={c.lead_id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {generating && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#c9a96e' }}>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>🤖 AI is analyzing contact history...</span>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#c9a96e', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#c9a96e', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#c9a96e', animationDelay: '300ms' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">This takes about 8 seconds...</p>
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search contacts..." className="glass-input w-full !pl-8 text-sm rounded-[10px]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No contacts found</p>
          ) : filtered.map((c: any) => {
            const isActive = selectedLeadId === c.lead_id;
            const sentDot = c.deal_health ? HEALTH_CONFIG[c.deal_health]?.dot : undefined;
            return (
              <button
                key={c.lead_id}
                onClick={() => handleSelectContact(c.lead_id)}
                className={`w-full text-left p-3 rounded-xl mb-1 transition-all duration-150 border ${isActive ? 'border-[rgba(201,169,110,0.30)]' : 'border-transparent hover:bg-[rgba(201,169,110,0.04)]'}`}
                style={isActive ? { background: 'rgba(201,169,110,0.10)' } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {sentDot && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sentDot }} />}
                  {!c.hasSummary && <span className="text-[10px] text-muted-foreground/50 ml-auto">No summary</span>}
                </div>
                {c.generatedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(c.generatedAt), { addSuffix: true })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0">
        {!selectedLeadId ? (
          <EmptyState icon={Sparkles} title="Select a contact" description="Choose a contact from the left panel or generate a new summary." />
        ) : loadingSummary ? (
          <div className="space-y-4 p-7">
            <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
            <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
            <div className="skeleton-shimmer h-40 rounded-xl mt-6" />
            <div className="skeleton-shimmer h-24 rounded-xl" />
          </div>
        ) : !summary ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Sparkles className="w-12 h-12" style={{ color: 'rgba(201,169,110,0.4)' }} />
            <h3 className="font-display text-lg font-semibold text-foreground">No summary for {selectedContact?.name || 'this contact'}</h3>
            <p className="text-sm text-muted-foreground">Generate an AI-powered summary to get insights and next actions.</p>
            <button
              onClick={() => handleGenerate(selectedLeadId)}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-display font-semibold disabled:opacity-50 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #a8823c)', color: '#07091e', boxShadow: '0 4px 20px rgba(201,169,110,0.35)' }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'AI is analyzing...' : '🤖 Generate AI Summary'}
            </button>
          </div>
        ) : (
          <div
            className="rounded-[20px] p-7 h-full overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.04) 0%, rgba(16,19,58,0.95) 100%)',
              border: '1px solid rgba(201,169,110,0.20)',
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-[22px] font-bold text-foreground">{summary.contact_name}</h2>
                  {selectedContact?.pipeline_stage && <StatusBadge type="stage" value={selectedContact.pipeline_stage} />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated {summary.generated_at ? formatDistanceToNow(new Date(summary.generated_at), { addSuffix: true }) : ''}
                </p>
              </div>
              {sent && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ background: sent.bg, color: sent.text, borderColor: sent.border }}
                >
                  {sent.emoji} {sent.label}
                </span>
              )}
            </div>

            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-3">AI Summary</p>
              <div className="border-l-[3px] pl-4 py-2 rounded-r-lg" style={{ borderColor: '#c9a96e', background: 'rgba(201,169,110,0.04)' }}>
                <p className="text-[15px] leading-[1.7]" style={{ color: '#d4b483' }}>{summary.summary_text || summary.summary}</p>
              </div>
            </div>

            {summary.next_action && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.1em] mb-3" style={{ color: '#e8c98a' }}>Recommended Next Action</p>
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(232,201,138,0.06)',
                    border: '1px solid rgba(232,201,138,0.20)',
                    borderLeft: '3px solid #e8c98a',
                    color: '#e8c98a',
                  }}
                >
                  {summary.next_action}
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={() => handleGenerate(summary.lead_id)}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-display font-semibold disabled:opacity-50 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #c9a96e, #a8823c)', color: '#07091e', boxShadow: '0 4px 20px rgba(201,169,110,0.35)' }}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'AI is analyzing...' : '🤖 Generate AI Summary'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}