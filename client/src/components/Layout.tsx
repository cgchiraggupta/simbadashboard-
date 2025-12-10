import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings, Info, Menu, Zap, HeartPulse, LogOut, Clock } from 'lucide-react';
import { cn } from './ui/design-system';
import { useAuthStore } from '../store/useAuthStore';
import { LanguageToggle, LanguageToggleCompact } from './LanguageToggle';
import { useLanguageStore } from '../store/useLanguageStore';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ icon: Icon, label, to, sidebarOpen }: { icon: any, label: string, to: string, sidebarOpen: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className="relative group block">
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
        isActive ? "text-primary" : "text-gray-400 group-hover:text-white"
      )}>
        <Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </Link>
  );
};

// Operator Footer Component
const OperatorFooter = ({ sidebarOpen }: { sidebarOpen: boolean }) => {
  const { operator, currentSession, logout } = useAuthStore();
  const { t } = useLanguageStore();

  if (!operator) return null;

  // Calculate session duration
  const getSessionDuration = () => {
    if (!currentSession) return '0m';
    const duration = Date.now() - currentSession.loginTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-4 border-t border-white/5 space-y-2">
      {/* Operator Info */}
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5",
        !sidebarOpen && "justify-center"
      )}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
          {getInitials(operator.name)}
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-white truncate">{operator.name}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {t('operator.online')}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock size={10} />
                {getSessionDuration()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Session Stats (only when sidebar open) */}
      {sidebarOpen && currentSession && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-black/20 rounded-lg border border-white/5 text-center">
            <p className="text-gray-500">{t('operator.healthAlerts')}</p>
            <p className="text-white font-bold">{currentSession.healthAlerts}</p>
          </div>
          <div className="p-2 bg-black/20 rounded-lg border border-white/5 text-center">
            <p className="text-gray-500">{t('operator.drillAlerts')}</p>
            <p className="text-white font-bold">{currentSession.drillAlerts}</p>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={logout}
        className={cn(
          "w-full flex items-center gap-2 p-2 rounded-lg",
          "bg-danger/10 hover:bg-danger/20 border border-danger/20",
          "text-danger text-sm font-medium transition-all",
          !sidebarOpen && "justify-center"
        )}
      >
        <LogOut size={16} />
        {sidebarOpen && <span>{t('nav.logout')}</span>}
      </button>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { t } = useLanguageStore();

  return (
    <div className="flex h-screen bg-background text-gray-100 font-sans overflow-hidden selection:bg-primary/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="relative z-10 bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl"
      >
        <div className="p-6 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 overflow-hidden"
            animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={18} className="text-white" fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              DRILL<span className="text-primary">SENSE</span>
            </h1>
          </motion.div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors mx-auto"
          >
            {sidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={LayoutDashboard} label={t('nav.dashboard')} to="/" sidebarOpen={sidebarOpen} />
          <NavItem icon={HeartPulse} label={t('nav.healthMonitor')} to="/health" sidebarOpen={sidebarOpen} />
          <NavItem icon={BarChart2} label={t('nav.analytics')} to="/analytics" sidebarOpen={sidebarOpen} />
          <NavItem icon={Settings} label={t('nav.settings')} to="/settings" sidebarOpen={sidebarOpen} />
          <NavItem icon={Info} label={t('nav.about')} to="/about" sidebarOpen={sidebarOpen} />
        </nav>

        {/* Language Toggle */}
        <div className="px-4 pb-2">
          {sidebarOpen ? (
            <LanguageToggle className="w-full justify-center" />
          ) : (
            <LanguageToggleCompact />
          )}
        </div>

        {/* Operator Profile / Status Footer */}
        <OperatorFooter sidebarOpen={sidebarOpen} />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

