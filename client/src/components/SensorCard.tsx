import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { Card, cn } from './ui/design-system';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { AnalogGauge, CircularGauge, ThermometerGauge } from './AnalogGauge';

type DisplayMode = 'digital' | 'analog';
type GaugeType = 'speedometer' | 'circular' | 'thermometer';

interface SensorCardProps extends Omit<HTMLMotionProps<"div">, "title" | "id"> {
  title: string;
  value: number;
  previousValue?: number;
  unit: string;
  icon: LucideIcon;
  data: { value: number }[];
  min?: number;
  max: number;
  thresholds: { warning: number; critical: number };
  displayMode?: DisplayMode;
  gaugeType?: GaugeType;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  previousValue,
  unit,
  icon: Icon,
  data,
  min = 0,
  max,
  thresholds,
  displayMode = 'analog', // Default to analog
  gaugeType = 'speedometer',
  trend = 'stable',
  className,
  ...props
}) => {
  let statusColor = 'text-success';
  let strokeColor = '#10b981'; // success
  let glowColor = 'rgba(16, 185, 129, 0.2)';
  let statusText = 'NORMAL';
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  
  if (value >= thresholds.critical) {
    statusColor = 'text-danger';
    strokeColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.2)';
    statusText = 'CRITICAL';
    status = 'critical';
  } else if (value >= thresholds.warning) {
    statusColor = 'text-accent';
    strokeColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.2)';
    statusText = 'WARNING';
    status = 'warning';
  }

  // Render analog gauge based on type
  const renderAnalogGauge = () => {
    switch (gaugeType) {
      case 'thermometer':
        return (
          <ThermometerGauge
            value={value}
            min={min}
            max={max}
            unit={unit}
            label={title}
            status={status}
          />
        );
      case 'circular':
        return (
          <CircularGauge
            value={value}
            max={max}
            unit={unit}
            label={title}
            status={status}
            size={120}
            trend={trend}
            previousValue={previousValue}
          />
        );
      case 'speedometer':
      default:
        return (
          <AnalogGauge
            value={value}
            min={min}
            max={max}
            label={title}
            unit={unit}
            size="md"
            trend={trend}
            previousValue={previousValue}
          />
        );
    }
  };

  // Analog display mode
  if (displayMode === 'analog') {
    return (
      <Card 
        className={cn(
          "p-4 h-full flex flex-col items-center justify-center transition-all duration-300",
          "hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
          "bg-surface border-border",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 mb-2 w-full justify-between px-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn("p-1.5 rounded-lg bg-surfaceHighlight text-textMuted group-hover:text-primary transition-colors flex-shrink-0")}>
              <Icon size={16} />
            </div>
            <span className="text-xs font-bold text-textMuted uppercase tracking-wider truncate">{title}</span>
          </div>
          <motion.div 
            initial={false}
            animate={{ backgroundColor: value >= thresholds.warning ? strokeColor : 'rgba(128,128,128,0.1)' }}
            className={cn("px-2 py-0.5 rounded text-[9px] font-bold tracking-wider flex-shrink-0", 
              value >= thresholds.warning ? "text-white" : "text-textMuted"
            )}
          >
            {statusText}
          </motion.div>
        </div>
        
        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <div className="w-full flex justify-center">
            {renderAnalogGauge()}
          </div>
        </div>
      </Card>
    );
  }

  // Digital display mode (original)
  return (
    <Card 
      className={cn(
        "p-5 h-full flex flex-col justify-between transition-all duration-300",
        "hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
        "bg-surface border-border",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-surfaceHighlight text-textMuted group-hover:text-primary transition-colors")}>
            <Icon size={20} />
          </div>
          <span className="text-sm font-medium text-textMuted uppercase tracking-wider">{title}</span>
        </div>
        <motion.div 
          initial={false}
          animate={{ backgroundColor: value >= thresholds.warning ? strokeColor : 'rgba(128,128,128,0.1)' }}
          className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wider",
            value >= thresholds.warning ? "text-white" : "text-textMuted"
          )}
        >
          {statusText}
        </motion.div>
      </div>
      
      <div className="flex items-baseline gap-2 mb-4">
        <motion.span 
          key={Math.floor(value)} // Animate on integer change
          initial={{ scale: 1.1 }}
          animate={{ scale: 1, color: value >= thresholds.warning ? strokeColor : 'var(--color-text)' }}
          className={cn("text-4xl font-mono font-bold tracking-tight text-text")}
          style={{ textShadow: value >= thresholds.warning ? `0 0 20px ${strokeColor}` : 'none' }}
        >
          {value.toFixed(1)}
        </motion.span>
        <span className="text-textMuted font-medium">{unit}</span>
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
