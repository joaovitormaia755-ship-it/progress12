import { ReactNode } from 'react';

interface BottomNavProps {
  active: 'today' | 'session' | 'manage' | 'history';
  onNavigate: (view: 'today' | 'session' | 'manage' | 'history') => void;
}

import { Home, Dumbbell, Settings, TrendingUp } from 'lucide-react';

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const items: { key: BottomNavProps['active']; label: string; icon: ReactNode }[] = [
    { key: 'today', label: 'Hoje', icon: <Home size={22} /> },
    { key: 'session', label: 'Treinar', icon: <Dumbbell size={22} /> },
    { key: 'manage', label: 'Treinos', icon: <Settings size={22} /> },
    { key: 'history', label: 'Histórico', icon: <TrendingUp size={22} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-base-700/95 backdrop-blur-md border-t border-base-500/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {items.map(item => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-col items-center gap-1 px-5 py-1 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
            >
              <span className={isActive ? 'transition-transform scale-110' : ''}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
