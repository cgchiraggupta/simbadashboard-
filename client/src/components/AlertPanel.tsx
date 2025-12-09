import React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../types';
import { Card, cn } from './ui/design-system';

interface AlertPanelProps {
  alerts: Alert[];
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wider">
          <AlertTriangle className="text-accent" size={16} />
          System Alerts
        </h2>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-bold border",
          alerts.length > 0 
            ? "bg-danger/10 text-danger border-danger/20" 
            : "bg-success/10 text-success border-success/20"
        )}>
          {alerts.length} ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-500 py-8"
            >
              <CheckCircle2 size={48} className="mb-3 opacity-20" />
              <p className="text-sm">All systems nominal</p>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div 
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-3 rounded-lg border flex gap-3 items-start relative overflow-hidden group",
                  alert.type === 'critical' 
                    ? "bg-danger/5 border-danger/20 text-red-200" 
                    : "bg-accent/5 border-accent/20 text-yellow-200"
                )}
              >
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                  alert.type === 'critical' ? "bg-danger" : "bg-accent"
                )} />
                
                {alert.type === 'critical' 
                  ? <AlertOctagon size={20} className="shrink-0 text-danger mt-0.5" /> 
                  : <AlertTriangle size={20} className="shrink-0 text-accent mt-0.5" />
                }
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-bold text-sm leading-tight">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

