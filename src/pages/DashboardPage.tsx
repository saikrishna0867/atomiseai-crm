import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/EmptyState';
import { Users, DollarSign, Trophy, TrendingDown, TrendingUp, ListTodo, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ contacts: 0, pipelineValue: 0, won: 0, lost: 0, convRate: 0, openTasks: 0 });
  const [stageData, setStageData] = useState<any[]>([]);
  const [dealStatusData, setDealStatusData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [contactsRes, dealsRes, tasksRes, activityRes] = await Promise.all([
        supabase.from('contacts').select('pipeline_stage'),
        supabase.from('pipeline_deals').select('deal_value, stage'),
        supabase.from('tasks').select('status'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
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

      // Stage distribution — always show all 6 stages
      const allStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
      const stageCounts: Record<string, number> = {};
      allStages.forEach(s => { stageCounts[s] = 0; });
      contacts.forEach(c => {
        const s = c.pipeline_stage || 'Lead';
        if (stageCounts[s] !== undefined) {
          stageCounts[s]++;
        }
      });
      setStageData(allStages.map(name => ({ name, value: stageCounts[name] })));

      // Deal status breakdown
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

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const PIE_COLORS = ['#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back to Atomise CRM</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Contacts" value={stats.contacts} icon={Users} color="blue" />
        <KpiCard title="Pipeline Value" value={`£${stats.pipelineValue.toLocaleString()}`} icon={DollarSign} color="green" />
        <KpiCard title="Deals Won" value={stats.won} icon={Trophy} color="green" />
        <KpiCard title="Deals Lost" value={stats.lost} icon={TrendingDown} color="red" />
        <KpiCard title="Conversion Rate" value={`${stats.convRate}%`} icon={TrendingUp} color="cyan" />
        <KpiCard title="Open Tasks" value={stats.openTasks} icon={ListTodo} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card-purple p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Contacts by Stage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageData}>
              <XAxis dataKey="name" tick={{ fill: '#a0a0c0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0c0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0ff' }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 glass-card-purple p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Deal Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dealStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                {dealStatusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid #2a2a3d', borderRadius: 8, color: '#f0f0ff' }} />
            </PieChart>
          </ResponsiveContainer>
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
      <div className="flex gap-3">
        <Button onClick={() => navigate('/contacts')} className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>
        <Button onClick={() => navigate('/pipeline')} variant="outline" className="gap-2 border-border text-foreground hover:bg-muted"><Plus className="w-4 h-4" /> New Deal</Button>
        <Button onClick={() => navigate('/appointments')} variant="outline" className="gap-2 border-border text-foreground hover:bg-muted"><CalendarDays className="w-4 h-4" /> Schedule Appointment</Button>
      </div>

      {/* Activity Feed */}
      <div className="glass-card-purple p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : activities.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <StatusBadge type="status" value={a.activity_type} />
              <span className="text-sm text-foreground flex-1">{a.description}</span>
              <span className="text-xs text-muted-foreground font-mono">{a.contact_name}</span>
              <span className="text-xs text-muted-foreground">
                {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
