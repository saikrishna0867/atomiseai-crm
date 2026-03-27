import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AISummariesPage() {
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['ai_summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('id, lead_id, contact_name, summary, next_action, sentiment, generated_at')
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-display font-bold text-foreground">AI Summaries</h1>

      {summaries.length === 0 ? (
        <EmptyState icon={Bot} title="No AI summaries yet" description="Generate summaries from the contact detail page." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map((s: any) => (
            <div key={s.id} className="glass-card-purple p-5 space-y-3">
              {/* Header: name + sentiment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {s.contact_name?.charAt(0) || '?'}
                  </div>
                  <span className="font-display font-semibold text-foreground">{s.contact_name || 'Unknown'}</span>
                </div>
                <SentimentBadge value={s.sentiment} />
              </div>

              {/* Summary paragraph */}
              <p className="text-sm text-muted-foreground leading-relaxed">{s.summary || 'No summary available.'}</p>

              {/* Next action — purple box */}
              {s.next_action && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">Next Action</p>
                  <p className="text-sm text-foreground">{s.next_action}</p>
                </div>
              )}

              {/* Timestamp */}
              {s.generated_at && (
                <p className="text-xs text-muted-foreground">
                  Generated {formatDistanceToNow(new Date(s.generated_at), { addSuffix: true })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentBadge({ value }: { value: string | null }) {
  const colors: Record<string, string> = {
    Positive: 'bg-green-500/10 text-green-400 border-green-500/20',
    Neutral: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Needs Attention': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const label = value || 'Neutral';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[label] || colors.Neutral}`}>
      {label}
    </span>
  );
}
