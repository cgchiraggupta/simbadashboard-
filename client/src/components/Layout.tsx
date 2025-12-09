import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BarChart2, Settings, Info, Menu, Zap, HeartPulse, LogIn, LogOut } from 'lucide-react';
import { cn } from './ui/design-system';
import { useOperatorStore } from '../store/useOperatorStore';
import { Button } from './ui/design-system';

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

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [operatorName, setOperatorName] = useState('Arvind Srinivas');
  const { currentOperator, isSignedIn, signIn, signOut } = useOperatorStore();
  
  // Auto-sign in with default operator if not signed in
  useEffect(() => {
    if (!isSignedIn && !currentOperator) {
      signIn('Arvind Srinivas');
    }
  }, []);

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
          <NavItem icon={LayoutDashboard} label="Dashboard" to="/" sidebarOpen={sidebarOpen} />
          <NavItem icon={HeartPulse} label="Health Monitor" to="/health" sidebarOpen={sidebarOpen} />
          <NavItem icon={BarChart2} label="Analytics" to="/analytics" sidebarOpen={sidebarOpen} />
          <NavItem icon={Settings} label="Settings" to="/settings" sidebarOpen={sidebarOpen} />
          <NavItem icon={Info} label="About" to="/about" sidebarOpen={sidebarOpen} />
        </nav>

        {/* User Profile / Status Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {isSignedIn && currentOperator ? (
            <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5", !sidebarOpen && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-blue-600/20 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{currentOperator.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium text-white truncate">{currentOperator.name}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Signed In
                  </p>
                </div>
              )}
              {sidebarOpen && (
                <Button
                  variant="ghost"
                  onClick={signOut}
                  className="p-1.5 h-auto"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </Button>
              )}
            </div>
          ) : (
            <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5", !sidebarOpen && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10" />
              {sidebarOpen && (
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium text-white">Not Signed In</p>
                  <p className="text-xs text-gray-500">Click to sign in</p>
                </div>
              )}
              {sidebarOpen ? (
                <Button
                  variant="primary"
                  onClick={() => setShowSignInModal(true)}
                  className="p-1.5 h-auto text-xs"
                >
                  <LogIn size={16} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowSignInModal(true)}
                  className="p-2 h-auto"
                  title="Sign In"
                >
                  <LogIn size={16} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sign In Modal */}
        <AnimatePresence>
          {showSignInModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSignInModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">Operator Sign In</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Operator Name</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                      placeholder="Enter operator name"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={async () => {
                        await signIn(operatorName);
                        setShowSignInModal(false);
                      }}
                      className="flex-1"
                    >
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSignInModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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

