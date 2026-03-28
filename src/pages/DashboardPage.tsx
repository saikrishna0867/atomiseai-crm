import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KpiCard } from '@/components/KpiCard';
import { Users, DollarSign, Trophy, TrendingDown, TrendingUp, ListTodo, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const EVENT_COLORS: Record<string, string> = {
  lead_assigned: '#22d3ee',
  stage_change: '#fbbf24',
  campaign_email_sent: '#c9a96e',
  campaign_launched: '#c9a96e',
  appointment_booked: '#34d399',
  drip_email_sent: '#60a5fa',
  ai_summary_generated: '#f472b6',
};

function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 skeleton-shimmer h-72 rounded-2xl" />
        <div className="lg:col-span-2 skeleton-shimmer h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ contacts: 0, pipelineValue: 0, won: 0, lost: 0, convRate: 0, openTasks: 0 });
  const [stageData, setStageData] = useState<any[]>([]);
  const [dealStatusData, setDealStatusData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => { document.title = 'Dashboard | Atomise CRM'; }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, dealsRes, tasksRes, activityRes] = await Promise.all([
        supabase.from('contacts').select('pipeline_stage'),
        supabase.from('pipeline_deals').select('deal_value, stage'),
        supabase.from('tasks').select('status'),
        supabase.from('activity_log').select('id, lead_id, event_type, description, performed_by, timestamp').order('timestamp', { ascending: false }).limit(10),
      ]);

      const contacts = contactsRes.data || [];
      const deals = dealsRes.data || [];
      const tasks = tasksRes.data || [];

      const won = deals.filter(d => d.stage === 'Closed Won').length;
      const lost = deals.filter(d => d.stage === 'Closed Lost').length;
      const totalDeals = deals.length;
      const pipelineValue = deals.filter(d => d.stage !== 'Closed Lost').reduce((sum, d) => sum + (Number(d.deal_value) || 0), 0);
      const openTasks = tasks.filter(t => t.status === 'Pending').length;

      setStats({
        contacts: contacts.length,
        pipelineValue,
        won,
        lost,
        convRate: totalDeals > 0 ? Math.round((won / totalDeals) * 100) : 0,
        openTasks,
      });

      const allStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
      const stageCounts: Record<string, number> = {};
      allStages.forEach(s => { stageCounts[s] = 0; });
      contacts.forEach(c => {
        const s = c.pipeline_stage || 'Lead';
        if (stageCounts[s] !== undefined) stageCounts[s]++;
      });
      setStageData(allStages.map(name => ({ name, value: stageCounts[name] })));

      const inProgress = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
      setDealStatusData([
        { name: 'Won', value: won },
        { name: 'Lost', value: lost },
        { name: 'In Progress', value: inProgress },
      ]);

      setActivities(activityRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <SkeletonDashboard />;

  const PIE_COLORS = ['#34d399', '#f87171', '#c9a96e'];
  const totalDeals = dealStatusData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Contacts" value={stats.contacts.toLocaleString()} icon={Users} glowColor="#22d3ee" iconColor="#c9a96e" delay={0} />
        <KpiCard title="Pipeline Value" value={`£${stats.pipelineValue.toLocaleString()}`} icon={DollarSign} glowColor="#34d399" iconColor="#c9a96e" delay={80} />
        <KpiCard title="Deals Won" value={stats.won.toLocaleString()} icon={Trophy} glowColor="#c9a96e" iconColor="#c9a96e" delay={160} />
        <KpiCard title="Deals Lost" value={stats.lost.toLocaleString()} icon={TrendingDown} glowColor="#f87171" iconColor="#c9a96e" delay={240} />
        <KpiCard title="Conversion Rate" value={`${stats.convRate}%`} icon={TrendingUp} glowColor="#fbbf24" iconColor="#c9a96e" delay={320} />
        <KpiCard title="Open Tasks" value={stats.openTasks.toLocaleString()} icon={ListTodo} glowColor="#60a5fa" iconColor="#c9a96e" delay={400} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card-purple p-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4">Pipeline Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fill: '#7a80b0', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: '#7a80b0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(201,169,110,0.08)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0]?.value as number;
                  return (
                    <div style={{
                      background: 'rgba(13,15,43,0.95)',
                      border: '1px solid rgba(201,169,110,0.3)',
                      borderRadius: 12,
                      color: '#fff',
                      backdropFilter: 'blur(12px)',
                      padding: '10px 14px',
                      minWidth: 100,
                    }}>
                      <p style={{ fontSize: 12, color: '#7a80b0', marginBottom: 4 }}>{label}</p>
                      {val > 0 ? (
                        <p style={{ fontSize: 15, fontWeight: 700 }}>{val} lead{val !== 1 ? 's' : ''}</p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#7a80b0', fontStyle: 'italic' }}>No leads yet</p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" fill="#c9a96e" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 glass-card-purple p-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h3 className="font-display font-semibold text-foreground mb-4">Deal Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dealStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                {dealStatusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(13,15,43,0.95)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-[148px] mb-[108px]">
            <p className="text-2xl font-display font-bold text-foreground">{totalDeals}</p>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {dealStatusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '500ms' }}>
        <Button
          onClick={() => navigate('/contacts')}
          className="gap-2 font-display text-sm rounded-xl px-5 py-2.5 transition-all duration-200"
          style={{ background: '#c9a96e', color: '#07091e', boxShadow: '0 4px 20px rgba(201,169,110,0.4)' }}
        >
          <Plus className="w-4 h-4" /> Add Contact
        </Button>
        <Button
          onClick={() => navigate('/pipeline')}
          variant="outline"
          className="gap-2 text-[#c9a96e] hover:bg-[rgba(201,169,110,0.08)] rounded-xl px-5 py-2.5 transition-all duration-200"
          style={{ borderColor: 'rgba(201,169,110,0.40)' }}
        >
          <Plus className="w-4 h-4" /> New Deal
        </Button>
        <Button
          onClick={() => navigate('/appointments')}
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground rounded-xl px-5 py-2.5 transition-all duration-200"
          style={{ border: '1px solid rgba(201,169,110,0.15)' }}
        >
          <CalendarDays className="w-4 h-4" /> Schedule Appointment
        </Button>
      </div>

      {/* Activity Feed */}
      <div className="glass-card-purple p-6 animate-slide-in" style={{ animationDelay: '600ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-1">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : activities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-[rgba(201,169,110,0.04)] transition-colors my-[11px]">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: EVENT_COLORS[a.event_type] || '#c9a96e' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                      background: `${EVENT_COLORS[a.event_type] || '#c9a96e'}15`,
                      color: EVENT_COLORS[a.event_type] || '#c9a96e',
                      borderColor: `${EVENT_COLORS[a.event_type] || '#c9a96e'}30`,
                    }}
                  >
                    {a.event_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm mt-0.5 truncate py-[3px] font-light text-primary-foreground">{a.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{a.performed_by}</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}