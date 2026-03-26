import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Zap, Database, UserPlus } from 'lucide-react';

const teamMembers = [
  { name: 'Admin User', email: 'admin@atomise.ai', role: 'Admin' },
  { name: 'Sarah Johnson', email: 'sarah@atomise.ai', role: 'Sales Rep' },
  { name: 'Mike Chen', email: 'mike@atomise.ai', role: 'Sales Rep' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('Atomise AI');
  const [crmName, setCrmName] = useState('Atomise CRM');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Team</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="glass-card-purple p-6 space-y-4">
          <div className="space-y-1 max-w-md">
            <Label className="text-foreground text-xs">Company Name</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-secondary border-border text-foreground" />
          </div>
          <div className="space-y-1 max-w-md">
            <Label className="text-foreground text-xs">CRM Name</Label>
            <Input value={crmName} onChange={e => setCrmName(e.target.value)} className="bg-secondary border-border text-foreground" />
          </div>
          <Button onClick={() => toast({ title: 'Settings saved ✅' })}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="team" className="glass-card-purple p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Team Members</h3>
            <Button size="sm" onClick={() => toast({ title: 'Invite sent ✉️' })} className="gap-2"><UserPlus className="w-4 h-4" /> Invite Member</Button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50">
              {['Name', 'Email', 'Role'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {teamMembers.map(m => (
                <tr key={m.email} className="border-b border-border/30">
                  <td className="px-4 py-3 text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="notifications" className="glass-card-purple p-6">
          <p className="text-sm text-muted-foreground">Notification preferences coming soon.</p>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="glass-card-purple p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-orange/10"><Zap className="w-5 h-5 text-accent-orange" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">n8n Automation</h3>
                <p className="text-xs text-muted-foreground">saikrishnasai1920.app.n8n.cloud</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Connected</span>
              <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => toast({ title: 'Connection test successful ✅' })}>Test</Button>
            </div>
          </div>
          <div className="glass-card-purple p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-green/10"><Database className="w-5 h-5 text-accent-green" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Supabase Database</h3>
                <p className="text-xs text-muted-foreground">otjruslxfermmcnrnvbn.supabase.co</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Connected</span>
              <Button size="sm" variant="outline" className="border-border text-foreground" onClick={() => toast({ title: 'Connection test successful ✅' })}>Test</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
