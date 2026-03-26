import { Outlet } from 'react-router-dom';
import { AtomiseLogo } from '@/components/AtomiseLogo';
import { SidebarNavItem } from '@/components/SidebarNavItem';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Columns3, CheckSquare, CalendarDays,
  Mail, Bot, Settings, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/pipeline', icon: Columns3, label: 'Pipeline' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/campaigns', icon: Mail, label: 'Campaigns' },
  { to: '/ai-summaries', icon: Bot, label: 'AI Summaries' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <AtomiseLogo />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.email || 'User'}</p>
              <p className="text-[10px] text-muted-foreground">Admin</p>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-accent-red transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
