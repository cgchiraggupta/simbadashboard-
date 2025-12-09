import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { Card, cn } from './ui/design-system';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface SensorCardProps extends Omit<HTMLMotionProps<"div">, "title" | "id"> {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  data: { value: number }[];
  max: number;
  thresholds: { warning: number; critical: number };
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  data,
  max,
  thresholds,
  className,
  ...props
}) => {
  let statusColor = 'text-success';
  let strokeColor = '#10b981'; // success
  let glowColor = 'rgba(16, 185, 129, 0.2)';
  let statusText = 'NORMAL';
  
  if (value >= thresholds.critical) {
    statusColor = 'text-danger';
    strokeColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.2)';
    statusText = 'CRITICAL';
  } else if (value >= thresholds.warning) {
    statusColor = 'text-accent';
    strokeColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.2)';
    statusText = 'WARNING';
  }

  return (
    <Card 
      className={cn("p-5 h-full flex flex-col justify-between group hover:border-white/20 transition-colors", className)} 
      {...props}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-white transition-colors")}>
            <Icon size={20} />
          </div>
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
        <motion.div 
          initial={false}
          animate={{ backgroundColor: value >= thresholds.warning ? strokeColor : 'rgba(255,255,255,0.1)' }}
          className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wider text-white")}
        >
          {statusText}
        </motion.div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-4">
        <motion.span 
          key={Math.floor(value)} // Animate on integer change
          initial={{ scale: 1.1, color: '#fff' }}
          animate={{ scale: 1, color: value >= thresholds.warning ? strokeColor : '#fff' }}
          className={cn("text-4xl font-mono font-bold tracking-tight")}
          style={{ textShadow: value >= thresholds.warning ? `0 0 20px ${strokeColor}` : 'none' }}
        >
          {value.toFixed(1)}
        </motion.span>
        <span className="text-gray-500 font-medium">{unit}</span>
      </div>

      <div className="h-16 relative -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={[0, max]} hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              fill={`url(#gradient-${title})`}
              strokeWidth={2} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

