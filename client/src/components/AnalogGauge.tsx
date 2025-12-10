import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './ui/design-system';

interface AnalogGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  warningThreshold?: number;
  criticalThreshold?: number;
  className?: string;
}

export const AnalogGauge: React.FC<AnalogGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  status = 'normal',
  size = 'md',
  warningThreshold,
  criticalThreshold,
  className,
}) => {
  // Calculate angle (-135 to 135 degrees, 270 degree arc)
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const angle = -135 + (percentage * 270) / 100;
  
  // Determine status color
  const getStatusColor = () => {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#22c55e';
  };

  // Size configurations
  const sizeConfig = {
    sm: { width: 120, height: 100, strokeWidth: 8, fontSize: 18, labelSize: 10 },
    md: { width: 160, height: 130, strokeWidth: 10, fontSize: 24, labelSize: 12 },
    lg: { width: 200, height: 160, strokeWidth: 12, fontSize: 32, labelSize: 14 },
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
  const needleEnd = polarToCartesian(centerX, centerY, needleLength, angle);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={config.width} height={config.height} className="overflow-visible">
        {/* Background arc */}
        <path
          d={createArc(-135, 135)}
          fill="none"
          stroke="#374151"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Warning zone */}
        {warningThreshold && (
          <path
            d={createArc(
              -135 + ((warningThreshold - min) / (max - min)) * 270,
              criticalThreshold 
                ? -135 + ((criticalThreshold - min) / (max - min)) * 270 
                : 135
            )}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}

        {/* Critical zone */}
        {criticalThreshold && (
          <path
            d={createArc(
              -135 + ((criticalThreshold - min) / (max - min)) * 270,
              135
            )}
            fill="none"
            stroke="#ef4444"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}

        {/* Value arc */}
        <motion.path
          d={createArc(-135, angle)}
          fill="none"
          stroke={getStatusColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            stroke={tick.major ? '#9ca3af' : '#4b5563'}
            strokeWidth={tick.major ? 2 : 1}
          />
        ))}

        {/* Needle */}
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
            stroke={getStatusColor()}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Needle cap */}
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill={getStatusColor()}
          />
        </motion.g>

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={4}
          fill="#1f2937"
          stroke="#4b5563"
          strokeWidth={2}
        />

        {/* Min/Max labels */}
        <text
          x={polarToCartesian(centerX, centerY, radius + 15, -135).x}
          y={polarToCartesian(centerX, centerY, radius + 15, -135).y}
          fill="#6b7280"
          fontSize={config.labelSize - 2}
          textAnchor="middle"
        >
          {min}
        </text>
        <text
          x={polarToCartesian(centerX, centerY, radius + 15, 135).x}
          y={polarToCartesian(centerX, centerY, radius + 15, 135).y}
          fill="#6b7280"
          fontSize={config.labelSize - 2}
          textAnchor="middle"
        >
          {max}
        </text>
      </svg>

      {/* Value display */}
      <div className="text-center -mt-2">
        <motion.div
          className="font-mono font-bold"
          style={{ fontSize: config.fontSize, color: getStatusColor() }}
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value.toFixed(1)}
          <span className="text-gray-500 ml-1" style={{ fontSize: config.fontSize * 0.5 }}>
            {unit}
          </span>
        </motion.div>
        <div className="text-gray-400 uppercase tracking-wider" style={{ fontSize: config.labelSize }}>
          {label}
        </div>
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
      <div className="relative w-8 h-24 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600">
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
        <div className="text-gray-400 text-xs uppercase tracking-wider">
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
}> = ({ value, max = 100, unit, label, status = 'normal', size = 100, className }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStatusColor = () => {
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
            stroke="#374151"
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
          <span className="text-gray-500" style={{ fontSize: size * 0.12 }}>
            {unit}
          </span>
        </div>
      </div>
      
      <div className="text-gray-400 text-xs uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
};
