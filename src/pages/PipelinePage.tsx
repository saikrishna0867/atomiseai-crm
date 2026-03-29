import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/EmptyState';
import { Columns3, Plus, Trash2, MoreHorizontal, Building2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_COLORS: Record<string, string> = {
  'Lead': '#60a5fa', 'Qualified': '#fbbf24', 'Proposal': '#fb923c',
  'Negotiation': '#f87171', 'Closed Won': '#34d399', 'Closed Lost': '#9ca3af',
};

function DealCard({ deal, onDelete }: { deal: any; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id, data: { deal } });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)${isDragging ? ' rotate(2deg) scale(1.02)' : ''}` : undefined,
    opacity: isDragging ? 0.85 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    ...(isDragging ? { boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 2px rgba(201,169,110,0.5)', zIndex: 50 } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'rgba(16,19,58,0.90)',
        borderColor: 'rgba(201,169,110,0.12)',
        borderLeft: '3px solid #c9a96e',
      }}
      className="relative rounded-xl p-4 mb-2.5 border transition-all duration-200 hover:border-[rgba(201,169,110,0.35)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(201,169,110,0.15)] hover:translate-y-[-2px]"
      {...attributes}
      {...listeners}
    >
      <div className="pl-2">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-foreground">{deal.contact_name}</span>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive p-0.5 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {deal.company && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> {deal.company}</p>
        )}
        {deal.deal_value && (
          <p className="text-base font-display font-bold mt-2" style={{ color: '#c9a96e' }}>£{Number(deal.deal_value).toLocaleString()}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {deal.assigned_rep && (
              <>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: '#10133a', border: '1px solid #c9a96e', color: '#c9a96e' }}>
                  {deal.assigned_rep.charAt(0)}
                </div>
                <span className="text-xs text-muted-foreground">{deal.assigned_rep}</span>
              </>
            )}
          </div>
          {deal.created_at && <span className="text-[11px] text-muted-foreground/60">{format(new Date(deal.created_at), 'd MMM')}</span>}
        </div>
      </div>
    </div>
  );
}

function StageColumn({ stage, deals, onAddDeal, onDeleteDeal }: { stage: string; deals: any[]; onAddDeal: () => void; onDeleteDeal: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-[85vw] sm:w-[240px] md:w-[280px] shrink-0 rounded-2xl border transition-colors snap-center"
      style={{
        background: isOver ? 'rgba(201,169,110,0.06)' : 'rgba(13,15,43,0.6)',
        borderColor: isOver ? 'rgba(201,169,110,0.35)' : 'rgba(201,169,110,0.12)',
        maxHeight: 'calc(100vh - 180px)',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold" style={{ color: STAGE_COLORS[stage] }}>{stage}</h3>
          <span className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold" style={{ background: '#c9a96e', color: '#07091e' }}>{deals.length}</span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#c9a96e' }}>£{totalValue.toLocaleString()}</p>
      </div>
      <div className="flex-1 p-3 space-y-0 overflow-y-auto">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onDelete={() => onDeleteDeal(deal.id)} />
        ))}
      </div>
      <div className="p-3">
        <button
          onClick={onAddDeal}
          className="w-full rounded-[10px] py-2.5 text-[13px] border border-dashed transition-all duration-200 hover:border-[rgba(201,169,110,0.4)]"
          style={{ borderColor: 'rgba(201,169,110,0.25)', background: 'rgba(201,169,110,0.06)', color: '#c9a96e' }}
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Deal
        </button>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState('Lead');
  const [form, setForm] = useState({ contact_name: '', contact_email: '', company: '', deal_value: '', assigned_rep: '', assigned_rep_email: '', notes: '' });

  useEffect(() => { document.title = 'Pipeline | Atomise CRM'; }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['pipeline_deals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pipeline_deals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { assigned_rep_email, ...rest } = form;
      const payload = {
        contact_name: rest.contact_name,
        contact_email: rest.contact_email,
        company: rest.company,
        deal_value: Number(rest.deal_value) || 0,
        stage: addStage,
        assigned_rep: rest.assigned_rep,
        notes: rest.notes,
        lead_id: `LEAD-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from('pipeline_deals').insert([payload]).select().single();
      if (error) throw error;
      // Fire webhook with rep email for automation
      try {
        await webhooks.stageChange({
          leadId: data.lead_id, contactEmail: data.contact_email, contactName: data.contact_name,
          oldStage: 'New', newStage: addStage, assignedRep: data.assigned_rep || 'Admin',
          assignedRepEmail: assigned_rep_email || 'admin@atomise.ai', dealValue: data.deal_value,
        });
      } catch (_) { /* webhook failure is non-blocking */ }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_deals'] });
      setAddOpen(false);
      setForm({ contact_name: '', contact_email: '', company: '', deal_value: '', assigned_rep: '', assigned_rep_email: '', notes: '' });
      toast({ title: 'Deal created ✅' });
    },
    onError: (e: any) => { console.error('[Pipeline]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pipeline_deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_deals'] });
      toast({ title: 'Deal deleted' });
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const deal = active.data.current.deal;
    const newStage = over.id as string;
    if (!STAGES.includes(newStage) || deal.stage === newStage) return;

    const oldStage = deal.stage;

    queryClient.setQueryData(['pipeline_deals'], (old: any[]) =>
      old.map(d => d.id === deal.id ? { ...d, stage: newStage } : d)
    );

    try {
      await supabase.from('pipeline_deals').update({ stage: newStage }).eq('id', deal.id);
      await supabase.from('contacts').update({ pipeline_stage: newStage }).eq('lead_id', deal.lead_id);

      await Promise.allSettled([
        webhooks.stageChange({
          leadId: deal.lead_id, contactEmail: deal.contact_email, contactName: deal.contact_name,
          oldStage, newStage, assignedRep: deal.assigned_rep || 'Admin', assignedRepEmail: deal.assigned_rep_email || 'admin@atomise.ai', dealValue: deal.deal_value,
        }),
        supabase.from('activity_log').insert({
          lead_id: deal.lead_id, event_type: 'stage_change',
          description: `Deal moved from ${oldStage} to ${newStage}`,
          performed_by: deal.assigned_rep, timestamp: new Date().toISOString(),
        }),
      ]);

      toast({ title: `Deal moved to ${newStage} — automation triggered ⚡` });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['pipeline_deals'] });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex gap-4 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-shimmer w-[280px] h-96 rounded-2xl shrink-0" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scroll-smooth px-[7.5vw] sm:px-0 -mx-[7.5vw] sm:mx-0" style={{ minHeight: 'calc(100vh - 160px)', WebkitOverflowScrolling: 'touch' }}>
          {STAGES.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              deals={deals.filter((d: any) => d.stage === stage)}
              onAddDeal={() => { setAddStage(stage); setAddOpen(true); }}
              onDeleteDeal={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      </DndContext>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[20px]" style={{ background: '#0d0f2b', border: '1px solid rgba(201,169,110,0.25)' }}>
          <DialogHeader><DialogTitle className="font-display">Add Deal — {addStage}</DialogTitle></DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            const val = Number(form.deal_value);
            if (!val || val <= 0) {
              toast({ title: 'Validation Error', description: 'Deal Value (£) is required and must be greater than 0.', variant: 'destructive' });
              return;
            }
            addMutation.mutate();
          }} className="space-y-3">
            {[
              { key: 'contact_name', label: 'Contact Name', required: true },
              { key: 'contact_email', label: 'Contact Email', required: true, type: 'email' },
              { key: 'company', label: 'Company' },
              { key: 'deal_value', label: 'Deal Value (£)', type: 'number', required: true },
              { key: 'assigned_rep', label: 'Assigned Rep', required: true },
              { key: 'assigned_rep_email', label: 'Rep Email', type: 'email' },
              { key: 'notes', label: 'Notes' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium">{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                  type={f.type || 'text'}
                  min={f.key === 'deal_value' ? '1' : undefined}
                  step={f.key === 'deal_value' ? 'any' : undefined}
                  className="glass-input w-full"
                />
              </div>
            ))}
            <Button type="submit" className="w-full font-display rounded-xl h-11" style={{ background: '#c9a96e', color: '#07091e' }} disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Deal'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}