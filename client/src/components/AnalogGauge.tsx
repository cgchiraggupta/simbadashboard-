import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './ui/design-system';

interface AnalogGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  previousValue?: number;
}

export const AnalogGauge: React.FC<AnalogGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 'md',
  className,
  trend = 'stable',
  previousValue,
}) => {
  // Calculate angle (-135 to 135 degrees, 270 degree arc)
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const angle = -135 + (percentage * 270) / 100;
  
  // Determine color based on VALUE (not trend) - Green -> Yellow -> Orange -> Red
  // This matches the image: segmented color zones based on value ranges
  const getValueBasedColor = () => {
    const range = max - min;
    const normalizedValue = value - min;
    
    // Define color zones as percentages of the range
    // Green: 0-40% (low values)
    // Yellow: 40-60% (medium-low)
    // Orange: 60-80% (medium-high)
    // Red: 80-100% (high values)
    
    const zonePercentage = (normalizedValue / range) * 100;
    
    if (zonePercentage < 40) {
      return '#22c55e'; // Green (low/safe)
    } else if (zonePercentage < 60) {
      return '#fbbf24'; // Yellow (medium-low)
    } else if (zonePercentage < 80) {
      return '#f59e0b'; // Orange (medium-high/warning)
    } else {
      return '#ef4444'; // Red (high/critical)
    }
  };

  // Needle color is always black (as shown in image)
  const needleColor = '#000000';
  
  // Value display color matches the zone color
  const valueColor = getValueBasedColor();

  // Size configurations - Reduced font sizes to prevent overlap
  const sizeConfig = {
    sm: { width: 120, height: 100, strokeWidth: 8, fontSize: 16, labelSize: 9 },
    md: { width: 160, height: 130, strokeWidth: 10, fontSize: 20, labelSize: 10 },
    lg: { width: 200, height: 160, strokeWidth: 12, fontSize: 26, labelSize: 12 },
  };

  const config = sizeConfig[size];
  const centerX = config.width / 2;
  const centerY = config.height - 20;
  const radius = (config.width - config.strokeWidth * 2) / 2 - 10;

  // Create arc path
  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Create tick marks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = -135 + (i * 270) / 10;
    const innerRadius = radius - 8;
    const outerRadius = radius + 2;
    const inner = polarToCartesian(centerX, centerY, innerRadius, tickAngle);
    const outer = polarToCartesian(centerX, centerY, outerRadius, tickAngle);
    ticks.push({ inner, outer, major: i % 2 === 0 });
  }

  // Needle endpoint
  const needleLength = radius - 15;

  return (
    <div className={cn("flex flex-col items-center justify-center w-full", className)}>
      <svg width={config.width} height={config.height} className="overflow-visible mx-auto">
        {/* Segmented Color Zones - Green -> Yellow -> Orange -> Red */}
        {/* Green Zone: 0-40% */}
        <path
          d={createArc(-135, -135 + (270 * 0.4))}
          fill="none"
          stroke="#22c55e"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Yellow Zone: 40-60% */}
        <path
          d={createArc(-135 + (270 * 0.4), -135 + (270 * 0.6))}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Orange Zone: 60-80% */}
        <path
          d={createArc(-135 + (270 * 0.6), -135 + (270 * 0.8))}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Red Zone: 80-100% */}
        <path
          d={createArc(-135 + (270 * 0.8), 135)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke={tick.major ? 'var(--color-text-muted)' : 'var(--color-border)'}
            strokeWidth={tick.major ? 2 : 1}
          />
        ))}

        {/* Needle - Always Black (as shown in image) */}
        <motion.g
          initial={{ rotate: -135 }}
          animate={{ rotate: angle }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - needleLength}
            stroke={needleColor}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Needle cap - Black */}
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill={needleColor}
          />
        </motion.g>

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={4}
          fill="var(--color-surface)"
          stroke="var(--color-border)"
          strokeWidth={2}
        />

        {/* Min/Max labels - Better aligned */}
        <text
          x={polarToCartesian(centerX, centerY, radius + 18, -135).x}
          y={polarToCartesian(centerX, centerY, radius + 18, -135).y + 4}
          fill="var(--color-text-muted)"
          fontSize={config.labelSize - 2}
          textAnchor="middle"
          className="font-mono"
        >
          {min}
        </text>
        <text
          x={polarToCartesian(centerX, centerY, radius + 18, 135).x}
          y={polarToCartesian(centerX, centerY, radius + 18, 135).y + 4}
          fill="var(--color-text-muted)"
          fontSize={config.labelSize - 2}
          textAnchor="middle"
          className="font-mono"
        >
          {max}
        </text>
      </svg>

      {/* Value display - Centered with better spacing */}
      <div className="text-center -mt-2 w-full">
        <motion.div
          className="font-mono font-bold leading-tight"
          style={{ fontSize: config.fontSize, color: valueColor, lineHeight: 1.2 }}
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value.toFixed(1)}
          <span className="ml-0.5 text-textMuted" style={{ fontSize: config.fontSize * 0.45 }}>
            {unit}
          </span>
        </motion.div>
        <div className="uppercase tracking-wider text-textMuted text-center mt-0.5" style={{ fontSize: config.labelSize, lineHeight: 1.2 }}>
          {label}
        </div>
        {/* Trend indicator - Small arrow below value */}
        {trend && previousValue !== undefined && (
          <div className="flex items-center justify-center gap-1 mt-1">
            {trend === 'increasing' && (
              <motion.span 
                className="text-xs"
                style={{ color: valueColor }}
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ?
              </motion.span>
            )}
            {trend === 'decreasing' && (
              <motion.span 
                className="text-xs"
                style={{ color: valueColor }}
                animate={{ y: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ?
              </motion.span>
            )}
            {trend === 'stable' && (
              <span className="text-xs" style={{ color: valueColor }}>?</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Thermometer-style gauge for temperature
export const ThermometerGauge: React.FC<{
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  status?: 'normal' | 'warning' | 'critical';
  className?: string;
}> = ({ value, min, max, unit, label, status = 'normal', className }) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  const getStatusColor = () => {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative w-8 h-24 rounded-full overflow-hidden border-2 bg-surfaceHighlight border-border">
        {/* Mercury */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{ backgroundColor: getStatusColor() }}
          initial={{ height: '0%' }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
        {/* Bulb */}
        <div 
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-2 border-gray-600"
          style={{ backgroundColor: getStatusColor() }}
        />
      </div>
      
      <div className="text-center">
        <motion.div
          className="font-mono font-bold text-xl"
          style={{ color: getStatusColor() }}
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {value.toFixed(1)}{unit}
        </motion.div>
        <div className="text-xs uppercase tracking-wider text-textMuted">
          {label}
        </div>
      </div>
    </div>
  );
};

// Circular progress gauge for humidity/percentage values
export const CircularGauge: React.FC<{
  value: number;
  max?: number;
  unit: string;
  label: string;
  status?: 'normal' | 'warning' | 'critical';
  size?: number;
  className?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  previousValue?: number;
}> = ({ value, max = 100, unit, label, status = 'normal', size = 100, className, trend }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Trend-based colors: White/Yellow/Red
  const getTrendColor = () => {
    if (trend === 'increasing') return '#ef4444'; // Red
    if (trend === 'decreasing') return '#e5e7eb'; // Light gray/white
    return '#fbbf24'; // Yellow
  };

  const getStatusColor = () => {
    // Use trend-based colors if trend is provided
    if (trend) {
      return getTrendColor();
    }
    // Fallback to status-based colors
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-highlight)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getStatusColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono font-bold"
            style={{ fontSize: size * 0.22, color: getStatusColor() }}
            key={value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {value.toFixed(1)}
          </motion.span>
          <span className="text-textMuted" style={{ fontSize: size * 0.12 }}>
            {unit}
          </span>
        </div>
      </div>
      
      <div className="text-xs uppercase tracking-wider mt-1 text-textMuted">
        {label}
      </div>
    </div>
  );
};
