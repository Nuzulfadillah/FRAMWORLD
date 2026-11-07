import { LayoutDashboard, Globe2, Calculator, Users, FolderKanban } from 'lucide-react';
import { NavTab } from './Sidebar';
import { World } from '../types';
import { getWorldStatus } from '../utils/time';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  worlds: World[];
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, worlds }) => {
  const now = Date.now();
  const readyCount = worlds.filter((w) => {
    const s = getWorldStatus(w, now);
    return s === 'ready' || s === 'overdue';
  }).length;

  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: 'Beranda',
      icon: LayoutDashboard,
      badge: readyCount > 0 ? readyCount : undefined,
    },
    {
      id: 'worlds' as NavTab,
      label: 'World',
      icon: Globe2,
      badge: worlds.length > 0 ? worlds.length : undefined,
    },
    {
      id: 'calculator' as NavTab,
      label: 'Kalkulator',
      icon: Calculator,
    },
    {
      id: 'accounts' as NavTab,
      label: 'Akun',
      icon: Users,
    },
    {
      id: 'files' as NavTab,
      label: 'Berkas',
      icon: FolderKanban,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a101f]/95 backdrop-blur-md border-t border-slate-800/90 px-2 py-1.5 pb-safe shadow-2xl shadow-black">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-emerald-400 shadow-md shadow-emerald-400" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-4 text-[9px] font-black rounded-full text-center ${
                      tab.id === 'dashboard'
                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
