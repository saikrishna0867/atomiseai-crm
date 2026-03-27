import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AtomiseLogo } from '@/components/AtomiseLogo';
import { SidebarNavItem } from '@/components/SidebarNavItem';
import { TopHeader } from '@/components/TopHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Columns3, CheckSquare, CalendarDays,
  Mail, Sparkles, Settings, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [collapsed, setCollapsed] = useState(false);
  const basePath = '/' + location.pathname.split('/')[1];
  const meta = pageMeta[basePath] || { title: 'Atomise CRM', subtitle: '' };

  const initial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out h-screen sticky top-0',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(240 40% 5%) 0%, hsl(240 33% 8%) 100%)',
          borderColor: 'rgba(124,58,237,0.15)',
        }}
      >
        {/* Logo + Toggle */}
        <div
          className={cn(
            'border-b transition-all duration-300 flex items-center mx-0 px-[15px]',
            collapsed ? 'flex-col gap-2 px-3 py-4 justify-center' : 'h-[72px] px-6 justify-between'
          )}
          style={{ borderColor: 'rgba(124,58,237,0.15)' }}
        >
          <AtomiseLogo collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[rgba(124,58,237,0.1)] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px]" />
            ) : (
              <PanelLeftClose className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {mainNav.map((item) => (
            <SidebarNavItem key={item.to} {...item} collapsed={collapsed} />
          ))}

          {/* Divider */}
          <div className="mx-4 my-2 border-t" style={{ borderColor: 'rgba(124,58,237,0.1)' }} />

          <SidebarNavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
            >
              {initial}
            </div>
            {!collapsed && (
              <>
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
              </>
            )}
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
