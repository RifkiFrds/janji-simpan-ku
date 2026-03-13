import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, GraduationCap, BarChart3, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { path: '/semester', label: 'Semester', icon: GraduationCap },
  { path: '/analitik', label: 'Analitik', icon: BarChart3 },
  { path: '/profil', label: 'Profil', icon: UserCircle },
];

export default function BottomNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="mx-auto max-w-lg flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className={cn('h-5 w-5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
