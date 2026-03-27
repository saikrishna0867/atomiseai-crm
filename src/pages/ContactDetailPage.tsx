import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Sparkles, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const EVENT_COLORS: Record<string, string> = {
  lead_assigned: '#22d3ee', stage_change: '#fbbf24', campaign_email_sent: '#7c3aed',
  campaign_launched: '#7c3aed', appointment_booked: '#34d399', drip_email_sent: '#60a5fa',
  ai_summary_generated: '#f472b6',
};

export default function ContactDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').eq('lead_id', leadId).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (contact?.name) document.title = `${contact.name} | Atomise CRM`;
  }, [contact]);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', leadId],
    queryFn: async () => {
      const { data } = await supabase.from('activity_log').select('*').eq('lead_id', leadId).order('timestamp', { ascending: false });
      return data || [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['contact-tasks', leadId],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['contact-appointments', leadId],
    queryFn: async () => {
      const { data } = await supabase.from('appointments').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: aiSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['ai-summary', leadId],
    queryFn: async () => {
      const { data } = await supabase.from('ai_summaries').select('*').eq('lead_id', leadId).order('generated_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const generateSummary = async () => {
    setAiLoading(true);
    try {
      await webhooks.generateSummary({ leadId, repEmail: user?.email || 'admin@atomise.ai' });
      toast({ title: '🤖 AI is analyzing...' });
      setTimeout(async () => {
        await refetchSummary();
        setAiLoading(false);
        toast({ title: 'AI Summary generated ✅' });
      }, 8000);
    } catch {
      setAiLoading(false);
    }
  };

  if (isLoading) return <div className="p-6 space-y-4"><div className="skeleton-shimmer h-32 rounded-2xl" /><div className="skeleton-shimmer h-64 rounded-2xl" /></div>;
  if (!contact) return <div className="p-6 text-muted-foreground">Contact not found</div>;

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/contacts')} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Contacts
      </Button>

      {/* Hero Header */}
      <div
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(20,20,40,0.9) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div
          className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl font-bold text-white font-display shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
        >
          {contact.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-foreground">{contact.name}</h1>
            <StatusBadge type="stage" value={contact.pipeline_stage || ''} />
            <StatusBadge type="priority" value={contact.priority || 'Medium'} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {contact.email}</span>
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {contact.phone}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {contact.company}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Rep: {contact.assigned_rep}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary border border-border rounded-xl">
          {['overview', 'activity', 'tasks', 'appointments', 'ai'].map(t => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg capitalize">{t === 'ai' ? 'AI Summary' : t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="glass-card-purple p-6 space-y-3">
          {['name', 'email', 'phone', 'company', 'source', 'pipeline_stage', 'priority', 'assigned_rep', 'notes'].map(field => (
            <div key={field} className="flex items-center gap-4 py-1">
              <span className="text-xs text-muted-foreground uppercase w-32 tracking-wider">{field.replace(/_/g, ' ')}</span>
              <span className="text-sm text-foreground">{(contact as any)[field] || '—'}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="glass-card-purple p-6 space-y-1">
          {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet</p> : activities.map((a: any, i: number) => (
            <div key={a.id} className={`flex items-start gap-3 py-3 px-3 rounded-lg ${i % 2 === 0 ? 'bg-[rgba(124,58,237,0.03)]' : ''}`}>
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: EVENT_COLORS[a.event_type] || '#7c3aed' }} />
              <div className="flex-1">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border mb-1"
                  style={{
                    background: `${EVENT_COLORS[a.event_type] || '#7c3aed'}15`,
                    color: EVENT_COLORS[a.event_type] || '#7c3aed',
                    borderColor: `${EVENT_COLORS[a.event_type] || '#7c3aed'}30`,
                  }}
                >
                  {a.event_type?.replace(/_/g, ' ')}
                </span>
                <p className="text-sm text-foreground">{a.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.performed_by} • {a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : ''}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="glass-card-purple p-6 space-y-3">
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks</p> : tasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <StatusBadge type="status" value={t.status} />
              <span className="text-sm text-foreground flex-1">{t.title}</span>
              <StatusBadge type="priority" value={t.priority} />
              {t.due_date && <span className="text-xs text-muted-foreground">{format(new Date(t.due_date), 'MMM d')}</span>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="glass-card-purple p-6 space-y-3">
          {appointments.length === 0 ? <p className="text-sm text-muted-foreground">No appointments</p> : appointments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <StatusBadge type="status" value={a.status || 'Scheduled'} />
              <span className="text-sm text-foreground flex-1">{a.appointment_type}</span>
              <span className="text-xs text-muted-foreground">{a.appointment_date} at {a.appointment_time}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="ai" className="glass-card-purple p-6 space-y-4">
          <button
            onClick={generateSummary}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-display font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? '🤖 AI is analyzing...' : '🤖 Generate AI Summary'}
          </button>
          {aiLoading && (
            <div className="space-y-3">
              <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              <div className="skeleton-shimmer h-4 w-1/2 rounded" />
              <div className="skeleton-shimmer h-4 w-2/3 rounded" />
              <p className="text-xs text-muted-foreground">This takes about 8 seconds...</p>
            </div>
          )}
          {!aiLoading && aiSummary && (
            <div className="space-y-4">
              <div className="border-l-[3px] border-primary pl-4 py-2 rounded-r-lg" style={{ background: 'rgba(124,58,237,0.04)' }}>
                <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary.summary}</p>
              </div>
              {aiSummary.next_action && (
                <div className="rounded-lg p-3 border-l-[3px]" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderLeft: '3px solid #fbbf24', color: '#fbbf24' }}>
                  <p className="text-[11px] uppercase tracking-wider mb-1 opacity-70">Next Action</p>
                  {aiSummary.next_action}
                </div>
              )}
              <StatusBadge type="status" value={aiSummary.sentiment || 'Neutral'} />
              {aiSummary.generated_at && <p className="text-xs text-muted-foreground">Generated {formatDistanceToNow(new Date(aiSummary.generated_at), { addSuffix: true })}</p>}
            </div>
          )}
          {!aiLoading && !aiSummary && <p className="text-sm text-muted-foreground">No AI summary yet. Generate one to get insights.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
