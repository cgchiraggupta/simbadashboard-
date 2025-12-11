import React from 'react';
import { SensorCard } from '../components/SensorCard';
import { ControlPanel } from '../components/ControlPanel';
import { AlertPanel } from '../components/AlertPanel';
import { MainChart, CurrentChart, PressureGauge } from '../components/Charts';
import { useDrillStore } from '../store/useDrillStore';
import { Activity, RotateCw, Volume2, Thermometer, Droplets, ArrowDownToLine, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/design-system';
import { useLanguageStore } from '../store/useLanguageStore';

export const Dashboard: React.FC = () => {
  const { data, history, isConnected } = useDrillStore();
  const { t } = useLanguageStore();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[50vh] text-text gap-4">
         <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
         </div>
         <p className="text-textMuted font-medium animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  // Sensor list with gauge types for analog display
  // Temperature now uses speedometer like others
  const sensorList = [
    { id: 'rpm', titleKey: 'sensors.rotarySpeed', unit: t('sensors.rpm'), icon: RotateCw, max: 3000, thresholds: { warning: 2500, critical: 2800 }, gaugeType: 'speedometer' as const },
    { id: 'vibration', titleKey: 'sensors.vibration', unit: t('sensors.mmPerSec'), icon: Activity, max: 100, thresholds: { warning: 60, critical: 80 }, gaugeType: 'speedometer' as const },
    { id: 'sound', titleKey: 'sensors.noiseLevel', unit: t('sensors.db'), icon: Volume2, max: 120, thresholds: { warning: 90, critical: 100 }, gaugeType: 'speedometer' as const },
    { id: 'temperature', titleKey: 'sensors.motorTemp', unit: t('sensors.celsius'), icon: Thermometer, max: 100, thresholds: { warning: 60, critical: 70 }, gaugeType: 'speedometer' as const },
    { id: 'humidity', titleKey: 'sensors.humidity', unit: t('sensors.percent'), icon: Droplets, max: 100, thresholds: { warning: 80, critical: 90 }, gaugeType: 'circular' as const },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Status Bar */}
      <motion.header 
        variants={itemVariants}
        className="flex justify-between items-end pb-4 border-b border-border"
      >
        <div>
          <h2 className="text-3xl font-bold text-text tracking-tight">{t('dashboard.title')}</h2>
          <p className="text-textMuted text-sm font-mono mt-1">{t('dashboard.sessionId')}: <span className="text-primary">{data.timestamp}</span></p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-surfaceHighlight px-4 py-2 rounded-full border border-border">
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{t('dashboard.systemStatus')}</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                  data.status === 'Running' ? 'bg-success shadow-[0_0_10px_#10b981]' : 
                  data.status === 'Stopped' ? 'bg-textMuted' : 'bg-danger shadow-[0_0_10px_#ef4444]'
                )} />
                <span className={cn("text-sm font-bold",
                  data.status === 'Running' ? 'text-success' : 
                  data.status === 'Stopped' ? 'text-textMuted' : 'text-danger'
                )}>
                  {data.status === 'Running' ? t('dashboard.running') : t('dashboard.stopped')}
                </span>
              </div>
           </div>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Sensor Cards Row - Top 5 with Analog Gauges */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
          {sensorList.map(sensor => {
            const currentValue = (data.sensors as any)[sensor.id];
            const previousValue = history.length > 1 ? (history[history.length - 2].sensors as any)[sensor.id] : currentValue;
            // Calculate trend: if value increased significantly (>1% of range), it's increasing
            const range = sensor.max - (sensor.min || 0);
            const threshold = range * 0.01; // 1% of range
            const trend = currentValue > previousValue + threshold ? 'increasing' : 
                         currentValue < previousValue - threshold ? 'decreasing' : 'stable';
            
            return (
              <SensorCard 
                key={sensor.id}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="h-[220px] w-full max-w-full"
                title={t(sensor.titleKey)}
                value={currentValue}
                previousValue={previousValue}
                unit={sensor.unit}
                icon={sensor.icon}
                max={sensor.max}
                thresholds={sensor.thresholds}
                data={history.map(h => ({ value: (h.sensors as any)[sensor.id] }))}
                displayMode="analog"
                gaugeType={sensor.gaugeType}
                trend={trend}
              />
            );
          })}
        </div>

        {/* Middle Section: Charts & Alerts */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <motion.div variants={itemVariants}>
             <MainChart history={history} />
           </motion.div>
           <div className="grid grid-cols-2 gap-6 h-[200px]">
              <motion.div variants={itemVariants} className="h-full">
                <CurrentChart history={history} className="h-full" />
              </motion.div>
              <motion.div variants={itemVariants} className="h-full">
                <AlertPanel alerts={data.alerts} />
              </motion.div>
           </div>
        </div>

        {/* Right Sidebar: Control & Gauge */}
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-6">
           <motion.div variants={itemVariants} className="flex-1">
             <ControlPanel className="h-full" />
           </motion.div>
           <motion.div variants={itemVariants} className="flex-1">
             <PressureGauge value={data.sensors.pressure} className="h-full" />
           </motion.div>
        </div>

      </div>
    </motion.div>
  );
};
