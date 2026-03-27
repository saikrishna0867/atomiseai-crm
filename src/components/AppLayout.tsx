import { Outlet, useLocation } from 'react-router-dom';
import { AtomiseLogo } from '@/components/AtomiseLogo';
import { SidebarNavItem } from '@/components/SidebarNavItem';
import { TopHeader } from '@/components/TopHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Columns3, CheckSquare, CalendarDays,
  Mail, Sparkles, Settings, LogOut
} from 'lucide-react';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/pipeline', icon: Columns3, label: 'Pipeline' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/campaigns', icon: Mail, label: 'Campaigns' },
  { to: '/ai-summaries', icon: Sparkles, label: 'AI Summaries' },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back to Atomise CRM' },
  '/contacts': { title: 'Contacts', subtitle: 'Manage your leads and contacts' },
  '/pipeline': { title: 'Pipeline', subtitle: 'Track deals across stages' },
  '/tasks': { title: 'Tasks', subtitle: 'Your to-do list' },
  '/appointments': { title: 'Appointments', subtitle: 'Schedule and manage meetings' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Email campaigns and outreach' },
  '/ai-summaries': { title: 'AI Summaries', subtitle: 'AI-powered contact insights' },
  '/settings': { title: 'Settings', subtitle: 'Configure your CRM' },
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const basePath = '/' + location.pathname.split('/')[1];
  const meta = pageMeta[basePath] || { title: 'Atomise CRM', subtitle: '' };

  const initial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r"
        style={{
          background: 'linear-gradient(180deg, hsl(240 40% 5%) 0%, hsl(240 33% 8%) 100%)',
          borderColor: 'rgba(124,58,237,0.15)',
        }}
      >
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <AtomiseLogo />
        </div>

        {/* Main Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {mainNav.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}

          {/* Divider */}
          <div className="mx-4 my-2 border-t" style={{ borderColor: 'rgba(124,58,237,0.1)' }} />

          <SidebarNavItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-purple-bright mt-0.5">
                Admin
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader title={meta.title} subtitle={meta.subtitle} userInitial={initial} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
