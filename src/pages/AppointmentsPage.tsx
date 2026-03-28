import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { webhooks } from '@/lib/webhooks';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plus, List, Calendar as CalIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

const APPT_TYPES = ['Discovery Call', 'Demo', 'Follow-Up Call', 'Proposal Review', 'Onboarding'];
const DURATIONS = ['15', '30', '45', '60'];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { document.title = 'Appointments | Atomise CRM'; }, []);

  const [form, setForm] = useState({
    contact_name: '', contact_email: '', lead_id: '', appointment_type: 'Discovery Call',
    appointment_date: '', appointment_time: '', meeting_link: '', rep_name: '', rep_email: '', notes: '', duration: '30',
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('name, email, lead_id, phone, company');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const apptId = crypto.randomUUID();
      const contact = contacts.find((c: any) => c.lead_id === form.lead_id);
      const record = {
        appt_id: apptId, lead_id: form.lead_id, contact_name: form.contact_name,
        contact_email: form.contact_email, rep_name: form.rep_name, appointment_date: form.appointment_date,
        appointment_time: form.appointment_time, appointment_type: form.appointment_type,
        meeting_link: form.meeting_link, status: 'Scheduled',
      };
      const { error } = await supabase.from('appointments').insert(record);
      if (error) throw error;

      await Promise.allSettled([
        webhooks.bookAppointment({
          leadId: form.lead_id, contactName: form.contact_name, contactEmail: form.contact_email,
          contactPhone: contact?.phone || '', company: contact?.company || '',
          repName: form.rep_name, repEmail: form.rep_email, appointmentDate: form.appointment_date,
          appointmentTime: form.appointment_time, appointmentType: form.appointment_type,
          duration: form.duration, meetingLink: form.meeting_link, notes: form.notes,
        }),
        supabase.from('activity_log').insert({
          lead_id: form.lead_id, event_type: 'appointment_booked',
          description: `Appointment scheduled for ${form.appointment_date}`,
          performed_by: form.rep_name,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setAddOpen(false);
      toast({ title: '📅 Appointment booked — confirmation emails sent to both parties ✅' });
    },
    onError: (e: any) => { console.error('[Appointments]', e); toast({ title: 'Error', description: e.message, variant: 'destructive' }); },
  });

  const selectContact = (leadId: string) => {
    const c = contacts.find((c: any) => c.lead_id === leadId);
    if (c) setForm(p => ({ ...p, lead_id: leadId, contact_name: c.name, contact_email: c.email }));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay).fill(null).concat(daysInMonth);

  const getApptForDate = (date: Date) => appointments.filter((a: any) => a.appointment_date && isSameDay(new Date(a.appointment_date), date));
  const selectedAppts = selectedDate ? getApptForDate(selectedDate) : [];

  if (isLoading) return <div className="p-6"><div className="skeleton-shimmer h-96 rounded-2xl" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')} className="gap-1 rounded-lg"><CalIcon className="w-4 h-4" /> Calendar</Button>
        <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')} className="gap-1 rounded-lg"><List className="w-4 h-4" /> List</Button>
        <Button onClick={() => setAddOpen(true)} className="gap-2 font-display text-sm rounded-xl" style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4" /> Book Appointment</Button>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card-purple p-5">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-muted-foreground">←</Button>
              <h3 className="font-display font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-muted-foreground">→</Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs text-muted-foreground text-center py-2">{d}</div>
              ))}
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const appts = getApptForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-2 rounded-lg text-sm transition-all relative border ${isSelected ? 'border-[rgba(201,169,110,0.4)] text-[#c9a96e]' : isToday ? 'border-[rgba(201,169,110,0.15)] text-[#c9a96e]' : 'border-[rgba(201,169,110,0.08)] hover:bg-[rgba(201,169,110,0.04)] text-foreground'}`}
                    style={isSelected ? { background: 'rgba(201,169,110,0.10)' } : isToday ? { background: 'rgba(201,169,110,0.05)' } : undefined}
                  >
                    <span className="absolute top-2 left-2">{format(day, 'd')}</span>
                    {appts.length > 0 && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-[10px] truncate block" style={{ color: '#c9a96e' }}>{appts[0]?.appointment_type?.substring(0, 8)}...</span>
                        {appts.length > 1 && <span className="text-[10px] text-muted-foreground">+{appts.length - 1} more</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="glass-card-purple p-5">
            <h3 className="font-display font-semibold text-foreground mb-3">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>
            {selectedAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments</p>
            ) : selectedAppts.map((a: any) => (
              <div key={a.id} className="py-3 border-b last:border-0 space-y-1" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{a.contact_name}</span>
                  <StatusBadge type="status" value={a.status || 'Scheduled'} />
                </div>
                <p className="text-xs text-muted-foreground">{a.appointment_type} • {a.appointment_time}</p>
                <p className="text-xs text-muted-foreground">Rep: {a.rep_name}</p>
                {a.meeting_link && <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: '#c9a96e' }}>Join Meeting</a>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        appointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No appointments" description="Book your first appointment." action={<Button onClick={() => setAddOpen(true)} style={{ background: '#c9a96e', color: '#07091e' }}><Plus className="w-4 h-4 mr-2" /> Book Appointment</Button>} />
        ) : (
          <div className="glass-card-purple overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'rgba(201,169,110,0.08)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                {['Contact', 'Type', 'Date', 'Time', 'Rep', 'Link', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {appointments.map((a: any) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(201,169,110,0.04)]">
                    <td className="px-4 py-3 text-foreground">{a.contact_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.appointment_type}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.appointment_date}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.appointment_time}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.rep_name}</td>
                    <td className="px-4 py-3">{a.meeting_link && <a href={a.meeting_link} target="_blank" className="text-xs hover:underline" style={{ color: '#c9a96e' }}>Join</a>}</td>
                    <td className="px-4 py-3"><StatusBadge type="status" value={a.status || 'Scheduled'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[20px] max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: '#0d0f2b', border: '1px solid rgba(201,169,110,0.25)' }}>
          <DialogHeader><DialogTitle className="font-display">Book Appointment</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Select Contact *</Label>
              <Select value={form.lead_id} onValueChange={selectContact}>
                <SelectTrigger className="glass-input"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                <SelectContent className="bg-card border-border max-h-48">
                  {contacts.map((c: any) => <SelectItem key={c.lead_id} value={c.lead_id}>{c.name} ({c.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Type *</Label>
              <Select value={form.appointment_type} onValueChange={v => setForm(p => ({ ...p, appointment_type: v }))}>
                <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">{APPT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Date *</Label><input type="date" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} required className="glass-input w-full" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Time *</Label><input type="time" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} required className="glass-input w-full" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Select value={form.duration} onValueChange={v => setForm(p => ({ ...p, duration: v }))}>
                <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">{DURATIONS.map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Meeting Link</Label><input value={form.meeting_link} onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))} placeholder="https://..." className="glass-input w-full" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Name *</Label><input value={form.rep_name} onChange={e => setForm(p => ({ ...p, rep_name: e.target.value }))} required className="glass-input w-full" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rep Email *</Label><input type="email" value={form.rep_email} onChange={e => setForm(p => ({ ...p, rep_email: e.target.value }))} required className="glass-input w-full" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Notes</Label><input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="glass-input w-full" /></div>
            <Button type="submit" className="w-full font-display rounded-xl h-11" style={{ background: '#c9a96e', color: '#07091e' }} disabled={addMutation.isPending}>{addMutation.isPending ? 'Booking...' : 'Book Appointment'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}