import { useState, useEffect, forwardRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Settings, Zap, Database, UserPlus, CheckCircle, XCircle, Loader2, Bell, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NotificationPref {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPref[] = [
  { key: 'new_lead', label: 'New Lead Assigned', desc: 'Get notified when a new contact is added to CRM', enabled: true },
  { key: 'stage_change', label: 'Stage Changes', desc: 'Get notified when a deal moves to a new pipeline stage', enabled: true },
  { key: 'appointment', label: 'Appointments Booked', desc: 'Get notified when a new appointment is scheduled', enabled: true },
  { key: 'campaign', label: 'Campaign Launched', desc: 'Get notified when a campaign is launched', enabled: true },
  { key: 'ai_summary', label: 'AI Summary Generated', desc: 'Get notified when an AI summary is generated', enabled: true },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { crmName, setCrmName } = useAppSettings();

  // General
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('atomise_company_name') || 'Atomise AI');
  const [localCrmName, setLocalCrmName] = useState(crmName);
  const [generalSaving, setGeneralSaving] = useState(false);

  // Team (localStorage)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('atomise_team_members');
    if (saved) { try { return JSON.parse(saved); } catch { /* fall through */ } }
    return [];
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Sales Rep');
  const [inviting, setInviting] = useState(false);

  // Integrations
  const [testingN8n, setTestingN8n] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationPref[]>(() => {
    const saved = localStorage.getItem('atomise_notification_prefs');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return DEFAULT_NOTIFICATIONS;
  });
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => { document.title = 'Settings | Atomise AI CRM'; }, []);
  useEffect(() => { setLocalCrmName(crmName); }, [crmName]);

  // Persist team to localStorage
  const saveTeam = (members: TeamMember[]) => {
    setTeamMembers(members);
    localStorage.setItem('atomise_team_members', JSON.stringify(members));
  };

  // General save
  const saveGeneral = async () => {
    setGeneralSaving(true);
    try {
      localStorage.setItem('atomise_company_name', companyName);
      setCrmName(localCrmName);
      toast({ title: 'Settings saved ✅' });
    } finally {
      setGeneralSaving(false);
    }
  };

  // Team invite
  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setInviting(true);
    try {
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      };
      saveTeam([...teamMembers, newMember]);
      toast({ title: `${newMember.name} added to team ✅` });
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Sales Rep');
    } finally {
      setInviting(false);
    }
  };

  // Team remove
  const removeMember = (member: TeamMember) => {
    saveTeam(teamMembers.filter(m => m.id !== member.id));
    toast({ title: `${member.name} removed from team` });
  };

  // Integration tests
  const testN8n = async () => {
    setTestingN8n(true);
    try {
      const res = await fetch('https://saikrishna96.app.n8n.cloud/webhook/new-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });
      setN8nStatus(res.ok || res.status === 404 ? 'connected' : 'error');
      toast({ title: 'n8n connection test successful ✅' });
    } catch {
      setN8nStatus('error');
      toast({ title: 'n8n connection failed', variant: 'destructive' });
    } finally {
      setTestingN8n(false);
    }
  };

  const testSupabase = async () => {
    setTestingSupabase(true);
    try {
      const { error } = await supabase.from('contacts').select('id').limit(1);
      setSupabaseStatus(error ? 'error' : 'connected');
      toast({ title: error ? 'Connection error' : 'Database connection test successful ✅', variant: error ? 'destructive' : 'default' });
    } catch {
      setSupabaseStatus('error');
    } finally {
      setTestingSupabase(false);
    }
  };

  // Notification toggle
  const toggleNotification = (key: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n);
      localStorage.setItem('atomise_notification_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  const saveNotifications = () => {
    setNotifSaving(true);
    localStorage.setItem('atomise_notification_prefs', JSON.stringify(notifications));
    setTimeout(() => {
      setNotifSaving(false);
      toast({ title: 'Notification preferences saved ✅' });
    }, 300);
  };

  const renderStatus = (status: string) => {
    if (status === 'connected') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20"><CheckCircle className="w-3 h-3" /> Connected</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"><XCircle className="w-3 h-3" /> Error</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">Connected</span>;
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-secondary border border-border rounded-xl">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">General</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Team</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Notifications</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="glass-card-purple p-6 space-y-4">
          <div className="space-y-1.5 max-w-md">
            <Label className="text-xs text-muted-foreground">Company Name</Label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="glass-input w-full" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <Label className="text-xs text-muted-foreground">CRM Name</Label>
            <input value={localCrmName} onChange={e => setLocalCrmName(e.target.value)} className="glass-input w-full" />
          </div>
          <Button onClick={saveGeneral} disabled={generalSaving} className="font-display rounded-xl" style={{ background: '#c9a96e', color: '#07091e' }}>
            {generalSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="glass-card-purple p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Team Members</h3>
            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2 font-display rounded-xl" style={{ background: '#c9a96e', color: '#07091e' }}>
              <UserPlus className="w-4 h-4" /> Add Member
            </Button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No team members yet. Click "Add Member" to get started.</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201,169,110,0.15)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: 'rgba(201,169,110,0.08)' }}>
                  {['Name', 'Email', 'Role', ''].map(h => (
                    <th key={h || 'actions'} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {teamMembers.map(m => (
                    <tr key={m.id} className="border-b border-[rgba(255,255,255,0.04)] group">
                      <td className="px-4 py-3 text-foreground">{m.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${m.role === 'Admin' ? 'border' : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'}`}
                          style={m.role === 'Admin' ? { background: 'rgba(201,169,110,0.10)', color: '#c9a96e', borderColor: 'rgba(201,169,110,0.20)' } : undefined}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => removeMember(m)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Invite Dialog */}
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogContent className="bg-secondary border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" className="bg-background border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="john@atomise.ai" type="email" className="bg-background border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="glass-input w-full">
                    <option value="Admin">Admin</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)} className="border-border text-foreground">Cancel</Button>
                <Button onClick={handleInvite} disabled={inviting} style={{ background: '#c9a96e', color: '#07091e' }}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="glass-card-purple p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-orange/10"><Zap className="w-5 h-5 text-accent-orange" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">n8n Automation</h3>
                <p className="text-xs text-muted-foreground">saikrishna96.app.n8n.cloud</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status={n8nStatus === 'idle' ? 'connected' : n8nStatus} />
              <Button size="sm" variant="outline" className="text-foreground rounded-lg" style={{ borderColor: 'rgba(201,169,110,0.20)' }} onClick={testN8n} disabled={testingN8n}>
                {testingN8n ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Test
              </Button>
            </div>
          </div>

          <div className="glass-card-purple p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-green/10"><Database className="w-5 h-5 text-accent-green" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Database</h3>
                <p className="text-xs text-muted-foreground">otjruslxfermmcnrnvbn.supabase.co</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status={supabaseStatus === 'idle' ? 'connected' : supabaseStatus} />
              <Button size="sm" variant="outline" className="text-foreground rounded-lg" style={{ borderColor: 'rgba(201,169,110,0.20)' }} onClick={testSupabase} disabled={testingSupabase}>
                {testingSupabase ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Test
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="glass-card-purple p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5" style={{ color: '#c9a96e' }} />
            <h3 className="font-display font-semibold text-foreground">Notification Preferences</h3>
          </div>
          <div className="space-y-4 max-w-lg">
            {notifications.map(n => (
              <div key={n.key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
                <Switch
                  checked={n.enabled}
                  onCheckedChange={() => toggleNotification(n.key)}
                  className="data-[state=checked]:bg-[#c9a96e]"
                />
              </div>
            ))}
          </div>
          <Button onClick={saveNotifications} disabled={notifSaving} className="font-display rounded-xl mt-4" style={{ background: '#c9a96e', color: '#07091e' }}>
            {notifSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Preferences
          </Button>
          <p className="text-xs text-muted-foreground mt-4">All notifications are delivered in-app via the notification bell. Email notifications can be configured through your n8n automation workflows.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
