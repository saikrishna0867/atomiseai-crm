import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SENTIMENT_CONFIG: Record<string, { emoji: string; label: string; cls: string }> = {
  Positive: { emoji: '😊', label: 'Positive', cls: 'bg-[#34d39926] text-[#34d399] border-[#34d39930]' },
  Neutral: { emoji: '😐', label: 'Neutral', cls: 'bg-[#fbbf2426] text-[#fbbf24] border-[#fbbf2430]' },
  'Needs Attention': { emoji: '⚠️', label: 'Needs Attention', cls: 'bg-[#f8717126] text-[#f87171] border-[#f8717130]' },
};

export default function AISummariesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => { document.title = 'AI Summaries | Atomise CRM'; }, []);

  const { data: summaries = [], refetch: refetchSummaries } = useQuery({
    queryKey: ['ai_summaries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_summaries').select('*').order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-ai'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('name, email, lead_id, pipeline_stage');
      return data || [];
    },
  });

  const selectedSummary = summaries.find((s: any) => s.lead_id === selectedLeadId);
  const filteredSummaries = summaries.filter((s: any) => !searchQ || s.contact_name?.toLowerCase().includes(searchQ.toLowerCase()));

  const handleGenerate = async (leadId: string) => {
    setGenerating(true);
    try {
      await webhooks.generateSummary({ leadId, repEmail: user?.email || '' });
      toast({ title: '🤖 AI is analyzing contact history...' });
      await new Promise(r => setTimeout(r, 8000));
      await refetchSummaries();
      setSelectedLeadId(leadId);
      toast({ title: 'AI Summary generated ✅' });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const sent = SENTIMENT_CONFIG[selectedSummary?.sentiment] || SENTIMENT_CONFIG.Neutral;

  return (
    <div className="p-6 flex gap-6 h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div className="w-80 shrink-0 flex flex-col glass-card-purple overflow-hidden">
        {/* Generate Section */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Generate New Summary</h3>
          <Select onValueChange={(v) => handleGenerate(v)}>
            <SelectTrigger className="glass-input text-sm" disabled={generating}>
              <SelectValue placeholder="Select contact..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-48">
              {contacts.map((c: any) => <SelectItem key={c.lead_id} value={c.lead_id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {generating && (
            <div className="mt-3 flex items-center gap-2 text-sm text-purple-bright">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." className="glass-input w-full pl-8 py-1.5 text-xs rounded-lg" />
          </div>
        </div>

        {/* Summary List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredSummaries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No summaries yet</p>
          ) : filteredSummaries.map((s: any) => {
            const sc = SENTIMENT_CONFIG[s.sentiment] || SENTIMENT_CONFIG.Neutral;
            const isActive = selectedLeadId === s.lead_id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedLeadId(s.lead_id)}
                className={`w-full text-left p-3 rounded-xl mb-1 transition-all duration-150 ${isActive ? 'bg-[rgba(124,58,237,0.18)] border border-primary/30' : 'hover:bg-[rgba(124,58,237,0.06)] border border-transparent'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{s.contact_name}</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: sc.cls.includes('#34d399') ? '#34d399' : sc.cls.includes('#fbbf24') ? '#fbbf24' : '#f87171' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.generated_at ? formatDistanceToNow(new Date(s.generated_at), { addSuffix: true }) : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel — Summary Display */}
      <div className="flex-1 min-w-0">
        {!selectedSummary ? (
          <EmptyState icon={Sparkles} title="Select a contact" description="Choose a contact from the left panel or generate a new summary." />
        ) : (
          <div
            className="rounded-[20px] p-7 h-full overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(20,20,40,0.9) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-[22px] font-bold text-foreground">{selectedSummary.contact_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated {selectedSummary.generated_at ? formatDistanceToNow(new Date(selectedSummary.generated_at), { addSuffix: true }) : ''}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${sent.cls}`}>
                {sent.emoji} {sent.label}
              </span>
            </div>

            {/* AI Summary */}
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-3">AI Summary</p>
              <div className="border-l-[3px] border-primary pl-4 py-2 rounded-r-lg" style={{ background: 'rgba(124,58,237,0.04)' }}>
                <p className="text-[15px] text-muted-foreground leading-[1.7]">{selectedSummary.summary}</p>
              </div>
            </div>

            {/* Next Action */}
            {selectedSummary.next_action && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-accent-amber mb-3">Recommended Next Action</p>
                <div
                  className="rounded-lg p-4 border-l-[3px]"
                  style={{
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderLeft: '3px solid #fbbf24',
                    color: '#fbbf24',
                  }}
                >
                  {selectedSummary.next_action}
                </div>
              </div>
            )}

            {/* Generate New */}
            <div className="mt-8">
              <button
                onClick={() => handleGenerate(selectedSummary.lead_id)}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-display font-semibold text-white disabled:opacity-50 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                }}
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
