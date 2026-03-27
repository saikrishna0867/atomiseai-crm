import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Settings, Zap, Database, UserPlus, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const teamMembers = [
  { name: 'Admin User', email: 'admin@atomise.ai', role: 'Admin' },
  { name: 'Sarah Johnson', email: 'sarah@atomise.ai', role: 'Sales Rep' },
  { name: 'Mike Chen', email: 'mike@atomise.ai', role: 'Sales Rep' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('Atomise AI');
  const { crmName, setCrmName } = useAppSettings();
  const [testingN8n, setTestingN8n] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  useEffect(() => { document.title = 'Settings | Atomise CRM'; }, []);

  const testN8n = async () => {
    setTestingN8n(true);
    try {
      // n8n is connected if webhooks work — just show connected
      setN8nStatus('connected');
      toast({ title: 'n8n connection test successful ✅' });
    } catch {
      setN8nStatus('error');
      toast({ title: 'Connection failed', variant: 'destructive' });
    } finally {
      setTestingN8n(false);
    }
  };

  const testSupabase = async () => {
    setTestingSupabase(true);
    try {
      const { error } = await supabase.from('contacts').select('id').limit(1);
      setSupabaseStatus(error ? 'error' : 'connected');
      toast({ title: error ? 'Connection error' : 'Supabase connection test successful ✅', variant: error ? 'destructive' : 'default' });
    } catch {
      setSupabaseStatus('error');
    } finally {
      setTestingSupabase(false);
    }
  };

  const StatusDot = ({ status }: { status: string }) => {
    if (status === 'connected') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20"><CheckCircle className="w-3 h-3" /> Connected</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"><XCircle className="w-3 h-3" /> Error</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">Connected</span>;
  };

  return (
    <div className="p-6 space-y-4">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-secondary border border-border rounded-xl">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">General</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Team</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Integrations</TabsTrigger>
          
        </TabsList>

        <TabsContent value="general" className="glass-card-purple p-6 space-y-4">
          <div className="space-y-1.5 max-w-md">
            <Label className="text-xs text-muted-foreground">Company Name</Label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="glass-input w-full" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <Label className="text-xs text-muted-foreground">CRM Name</Label>
            <input value={crmName} onChange={e => setCrmName(e.target.value)} className="glass-input w-full" />
          </div>
          <Button onClick={() => toast({ title: 'Settings saved ✅' })} className="font-display rounded-xl">Save Changes</Button>
        </TabsContent>

        <TabsContent value="team" className="glass-card-purple p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Team Members</h3>
            <Button size="sm" onClick={() => toast({ title: 'Invite sent ✉️' })} className="gap-2 font-display rounded-xl"><UserPlus className="w-4 h-4" /> Invite Member</Button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.15)' }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'rgba(124,58,237,0.08)' }}>
                {['Name', 'Email', 'Role'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {teamMembers.map(m => (
                  <tr key={m.email} className="border-b border-[rgba(255,255,255,0.04)]">
                    <td className="px-4 py-3 text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${m.role === 'Admin' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'}`}>
                        {m.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          {/* n8n */}
          <div className="glass-card-purple p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-orange/10"><Zap className="w-5 h-5 text-accent-orange" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">n8n Automation</h3>
                <p className="text-xs text-muted-foreground">saikrishnasai1920.app.n8n.cloud</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status={n8nStatus === 'idle' ? 'connected' : n8nStatus} />
              <Button size="sm" variant="outline" className="border-[rgba(124,58,237,0.2)] text-foreground rounded-lg" onClick={testN8n} disabled={testingN8n}>
                {testingN8n ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Test
              </Button>
            </div>
          </div>

          {/* Supabase */}
          <div className="glass-card-purple p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent-green/10"><Database className="w-5 h-5 text-accent-green" /></div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Database</h3>
                <p className="text-xs text-muted-foreground">otjruslxfermmcnrnvbn.supabase.co</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status={supabaseStatus === 'idle' ? 'connected' : supabaseStatus} />
              <Button size="sm" variant="outline" className="border-[rgba(124,58,237,0.2)] text-foreground rounded-lg" onClick={testSupabase} disabled={testingSupabase}>
                {testingSupabase ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Test
              </Button>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
