import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bot, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ContactDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', leadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').eq('lead_id', leadId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', leadId],
    queryFn: async () => {
      const { data } = await supabase.from('activity_log').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
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
      await webhooks.generateSummary({ leadId, repEmail: contact?.assigned_rep_email || '' });
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

  if (isLoading) return <LoadingSpinner />;
  if (!contact) return <div className="p-6 text-muted-foreground">Contact not found</div>;

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/contacts')} className="gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Contacts
      </Button>

      {/* Header */}
      <div className="glass-card-purple p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary font-display">
          {contact.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-foreground">{contact.name}</h1>
            <StatusBadge type="stage" value={contact.pipeline_stage || ''} />
          </div>
          <p className="text-sm text-muted-foreground">{contact.email} • {contact.phone} • {contact.company}</p>
          <p className="text-xs text-muted-foreground mt-1">Rep: {contact.assigned_rep}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activity</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tasks</TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Appointments</TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="glass-card-purple p-5 space-y-3">
          {['name', 'email', 'phone', 'company', 'source', 'pipeline_stage', 'priority', 'assigned_rep', 'notes'].map(field => (
            <div key={field} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground uppercase w-28">{field.replace('_', ' ')}</span>
              <span className="text-sm text-foreground">{(contact as any)[field] || '—'}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="glass-card-purple p-5 space-y-3">
          {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet</p> : activities.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-foreground">{a.description}</p>
                <p className="text-xs text-muted-foreground">{a.activity_type} • {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ''}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="glass-card-purple p-5 space-y-3">
          {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks</p> : tasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <StatusBadge type="status" value={t.status} />
              <span className="text-sm text-foreground flex-1">{t.title}</span>
              <StatusBadge type="priority" value={t.priority} />
              {t.due_date && <span className="text-xs text-muted-foreground">{format(new Date(t.due_date), 'MMM d')}</span>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="glass-card-purple p-5 space-y-3">
          {appointments.length === 0 ? <p className="text-sm text-muted-foreground">No appointments</p> : appointments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <StatusBadge type="status" value={a.status || 'Scheduled'} />
              <span className="text-sm text-foreground flex-1">{a.appointment_type}</span>
              <span className="text-xs text-muted-foreground">{a.appointment_date} at {a.appointment_time}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="ai" className="glass-card-purple p-5 space-y-4">
          <Button onClick={generateSummary} disabled={aiLoading} className="gap-2">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            Generate AI Summary
          </Button>
          {aiLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          )}
          {!aiLoading && aiSummary && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">{aiSummary.summary}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Next Action:</span>
                <span className="text-sm text-foreground">{aiSummary.next_action}</span>
              </div>
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
