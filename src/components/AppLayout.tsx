import { useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AtomiseLogo } from '@/components/AtomiseLogo';
import { SidebarNavItem } from '@/components/SidebarNavItem';
import { TopHeader } from '@/components/TopHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Columns3, CheckSquare, CalendarDays,
  Mail, Sparkles, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Menu, X
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
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login', { replace: true });
  }, [signOut, navigate]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const basePath = '/' + location.pathname.split('/')[1];
  const meta = pageMeta[basePath] || { title: 'Atomise CRM', subtitle: '' };

  const initial = 'S';

  const sidebarContent = (
    <>
      {/* Logo + Toggle */}
      <div
        className={cn(
          'border-b transition-all duration-300 flex items-center mx-0 px-[15px]',
          collapsed ? 'flex-col gap-2 px-3 py-4 justify-center' : 'h-[72px] px-6 justify-between'
        )}
        style={{ borderColor: 'rgba(201,169,110,0.12)' }}
      >
        <AtomiseLogo collapsed={collapsed} />
        {/* Desktop toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[rgba(201,169,110,0.08)] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          )}
        </button>
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {mainNav.map((item) => (
          <SidebarNavItem key={item.to} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        ))}

        {/* Divider */}
        <div className="mx-4 my-2 border-t" style={{ borderColor: 'rgba(201,169,110,0.10)' }} />

        <SidebarNavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(201,169,110,0.10)' }}>
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: '#10133a', border: '1px solid #c9a96e', color: '#c9a96e' }}
          >
            {initial}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate leading-tight">{user?.email?.split('@')[0] || 'Sai Krishna'}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email || ''}</p>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium mt-1"
                  style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}
                >
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden md:flex shrink-0 flex-col border-r transition-all duration-300 ease-in-out h-screen sticky top-0',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
        style={{
          background: 'linear-gradient(180deg, #07091e 0%, #0d0f2b 100%)',
          borderColor: 'rgba(201,169,110,0.12)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, #07091e 0%, #0d0f2b 100%)',
          borderColor: 'rgba(201,169,110,0.12)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader title={meta.title} subtitle={meta.subtitle} userInitial={initial} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
