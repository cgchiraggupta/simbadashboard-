import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, cn } from './ui/design-system';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface HealthVitalCardProps {
  label: string;
  value: number;
  unit: string;
  normalRange: string;
  status: 'Normal' | 'Warning' | 'Critical';
  icon: LucideIcon;
}

export const HealthVitalCard: React.FC<HealthVitalCardProps> = ({
  label,
  value,
  unit,
  normalRange,
  status,
  icon: Icon,
}) => {
  const statusColors = {
    Normal: { border: 'border-success/30', bg: 'bg-success/5', text: 'text-success', badge: 'bg-success/10 text-success border-success/20' },
    Warning: { border: 'border-accent/30', bg: 'bg-accent/5', text: 'text-accent', badge: 'bg-accent/10 text-accent border-accent/20' },
    Critical: { border: 'border-danger/30', bg: 'bg-danger/5', text: 'text-danger', badge: 'bg-danger/10 text-danger border-danger/20' },
  };

  const colors = statusColors[status];

  return (
    <Card className={cn("p-5 h-full flex flex-col justify-between group hover:border-primary/50 transition-colors", colors.border, colors.bg)}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-surfaceHighlight", colors.text)}>
            <Icon size={20} />
          </div>
          <span className="text-sm font-medium text-textMuted uppercase tracking-wider">{label}</span>
        </div>
        <motion.div
          initial={false}
          animate={{ backgroundColor: status === 'Normal' ? 'rgba(16, 185, 129, 0.1)' : status === 'Warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
          className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wider border", colors.badge)}
        >
          {status.toUpperCase()}
        </motion.div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <motion.div
          key={Math.floor(value)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={cn("text-4xl font-mono font-bold tracking-tight", colors.text)}
        >
          <AnimatedNumber value={value} toFixed={status === 'Critical' ? 0 : 1} />
        </motion.div>
        <span className="text-textMuted font-medium">{unit}</span>
      </div>

      <div className="text-xs text-textMuted font-mono">
        Normal: {normalRange}
      </div>
    </Card>
  );
};
