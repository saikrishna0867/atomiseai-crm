import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { LoadingSpinner, EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Columns3, Plus, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function DealCard({ deal, onDelete }: { deal: any; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="glass-card-purple p-3 space-y-2 cursor-grab active:cursor-grabbing hover:purple-glow-sm transition-all duration-200" {...attributes} {...listeners}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-foreground">{deal.contact_name}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive p-0.5">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {deal.company && <p className="text-xs text-muted-foreground">{deal.company}</p>}
      {deal.deal_value && <p className="text-sm font-semibold text-accent-green">£{Number(deal.deal_value).toLocaleString()}</p>}
      {deal.assigned_rep && <p className="text-xs text-muted-foreground">Rep: {deal.assigned_rep}</p>}
    </div>
  );
}

function StageColumn({ stage, deals, onAddDeal, onDeleteDeal }: { stage: string; deals: any[]; onAddDeal: () => void; onDeleteDeal: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-xl border transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/50'}`}
    >
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-foreground">{stage}</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{deals.length}</span>
        </div>
        <p className="text-xs text-accent-green mt-1">£{totalValue.toLocaleString()}</p>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onDelete={() => onDeleteDeal(deal.id)} />
        ))}
      </div>
      <div className="p-2">
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground text-xs" onClick={onAddDeal}>
          <Plus className="w-3 h-3 mr-1" /> Add Deal
        </Button>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState('Lead');
  const [form, setForm] = useState({ contact_name: '', contact_email: '', company: '', deal_value: '', assigned_rep: '', notes: '' });

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
      const { error } = await supabase.from('pipeline_deals').insert({ ...form, stage: addStage, lead_id: crypto.randomUUID() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline_deals'] });
      setAddOpen(false);
      setForm({ contact_name: '', contact_email: '', company: '', deal_value: '', assigned_rep: '', notes: '' });
      toast({ title: 'Deal created ✅' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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

    // Optimistic update
    queryClient.setQueryData(['pipeline_deals'], (old: any[]) =>
      old.map(d => d.id === deal.id ? { ...d, stage: newStage } : d)
    );

    try {
      await supabase.from('pipeline_deals').update({ stage: newStage }).eq('id', deal.id);
      await supabase.from('contacts').update({ pipeline_stage: newStage }).eq('email', deal.contact_email);

      await Promise.allSettled([
        webhooks.stageChange({
          leadId: deal.lead_id, contactEmail: deal.contact_email, contactName: deal.contact_name,
          oldStage, newStage, assignedRep: deal.assigned_rep, assignedRepEmail: '', dealValue: deal.deal_value,
        }),
        supabase.from('activity_log').insert({
          lead_id: deal.lead_id, contact_name: deal.contact_name,
          activity_type: 'Stage Changed', description: `Deal moved from ${oldStage} to ${newStage}`,
          performed_by: deal.assigned_rep,
        }),
      ]);

      toast({ title: `Deal moved to ${newStage} — automation triggered ⚡` });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['pipeline_deals'] });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Pipeline</h1>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
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
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Add Deal — {addStage}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3">
            {[
              { key: 'contact_name', label: 'Contact Name', required: true },
              { key: 'contact_email', label: 'Contact Email', required: true, type: 'email' },
              { key: 'company', label: 'Company' },
              { key: 'deal_value', label: 'Deal Value (£)', type: 'number' },
              { key: 'assigned_rep', label: 'Assigned Rep', required: true },
              { key: 'notes', label: 'Notes' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-foreground text-xs">{f.label}{f.required && ' *'}</Label>
                <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required={f.required} type={f.type || 'text'} className="bg-secondary border-border text-foreground" />
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding...' : 'Add Deal'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
