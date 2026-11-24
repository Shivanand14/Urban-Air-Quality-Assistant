import React from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  CalendarClock,
  Home,
  LayoutDashboard,
  MessageSquare,
  Users,
  Wind,
  X,
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'family'
  | 'outdoor'
  | 'indoor'
  | 'routine'
  | 'assistant'
  | 'alerts'
  | 'learn';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  unreadAlertsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'family', label: 'Family Health', icon: Users },
  { id: 'outdoor', label: 'Outdoor Planner', icon: CalendarClock },
  { id: 'indoor', label: 'Indoor Air Hacks', icon: Home },
  { id: 'routine', label: 'AI Daily Routine', icon: Activity },
  { id: 'assistant', label: 'Ask AI Assistant', icon: MessageSquare },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'learn', label: 'Learn', icon: BookOpen },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  unreadAlertsCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSelectTab('dashboard');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-700 text-white shrink-0">
            <Wind className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
            BreatheWise AI
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                isActive
                  ? 'bg-teal-50 text-teal-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'alerts' && unreadAlertsCount > 0 && (
                <span className="font-mono-num text-xs font-semibold text-orange-700">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
        <p className="font-medium text-slate-700">Indian CPCB Standard</p>
        <p className="mt-1">Informational family guidance. Always follow your clinician’s medical care plan.</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{navContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex">{navContent}</div>
        </div>
      )}
    </>
  );
}
