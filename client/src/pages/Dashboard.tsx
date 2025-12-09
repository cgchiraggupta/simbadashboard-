import React from 'react';
import { SensorCard } from '../components/SensorCard';
import { ControlPanel } from '../components/ControlPanel';
import { AlertPanel } from '../components/AlertPanel';
import { MainChart, CurrentChart, PressureGauge } from '../components/Charts';
import { useDrillStore } from '../store/useDrillStore';
import { Activity, RotateCw, Volume2, Thermometer, Droplets, ArrowDownToLine, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../components/ui/design-system';

export const Dashboard: React.FC = () => {
  const { data, history, isConnected } = useDrillStore();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white gap-4">
         <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
         </div>
         <p className="text-gray-400 font-medium animate-pulse">Connecting to Neural Link...</p>
      </div>
    );
  }

  const sensorList = [
    { id: 'rpm', title: 'Rotary Speed', unit: 'RPM', icon: RotateCw, max: 3000, thresholds: { warning: 2500, critical: 2800 } },
    { id: 'vibration', title: 'Vibration', unit: 'mm/s²', icon: Activity, max: 100, thresholds: { warning: 60, critical: 80 } },
    { id: 'sound', title: 'Noise Level', unit: 'dB', icon: Volume2, max: 120, thresholds: { warning: 90, critical: 100 } },
    { id: 'temperature', title: 'Motor Temp', unit: '°C', icon: Thermometer, max: 100, thresholds: { warning: 60, critical: 70 } },
    { id: 'humidity', title: 'Humidity', unit: '%', icon: Droplets, max: 100, thresholds: { warning: 80, critical: 90 } },
    { id: 'pressure', title: 'Feed Pressure', unit: 'N', icon: ArrowDownToLine, max: 500, thresholds: { warning: 350, critical: 400 } },
    { id: 'current', title: 'Motor Current', unit: 'A', icon: Zap, max: 20, thresholds: { warning: 10, critical: 12 } },
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
        className="flex justify-between items-end pb-4 border-b border-white/10"
      >
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Live Monitoring</h2>
          <p className="text-gray-400 text-sm font-mono mt-1">SESSION ID: <span className="text-primary">{data.timestamp}</span></p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Status</span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                  data.status === 'Running' ? 'bg-success shadow-[0_0_10px_#10b981]' : 
                  data.status === 'Stopped' ? 'bg-gray-500' : 'bg-danger shadow-[0_0_10px_#ef4444]'
                )} />
                <span className={cn("text-sm font-bold",
                  data.status === 'Running' ? 'text-success' : 
                  data.status === 'Stopped' ? 'text-gray-400' : 'text-danger'
                )}>
                  {data.status.toUpperCase()}
                </span>
              </div>
           </div>
        </div>
      </motion.header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Sensor Cards Row - Top 4 critical */}
        {sensorList.slice(0, 4).map(sensor => (
          <SensorCard 
            key={sensor.id}
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="col-span-12 sm:col-span-6 lg:col-span-3 h-[180px]"
            title={sensor.title}
            value={(data.sensors as any)[sensor.id]}
            unit={sensor.unit}
            icon={sensor.icon}
            max={sensor.max}
            thresholds={sensor.thresholds}
            data={history.map(h => ({ value: (h.sensors as any)[sensor.id] }))}
          />
        ))}

        {/* Middle Section: Charts & Controls */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <motion.div variants={itemVariants}>
             <MainChart history={history} />
           </motion.div>
           <div className="grid grid-cols-2 gap-6 h-[200px]">
              <motion.div variants={itemVariants} className="h-full">
                <CurrentChart history={history} className="h-full" />
              </motion.div>
              <div className="h-full">
                 <div className="grid grid-cols-2 gap-4 h-full">
                    {sensorList.slice(4, 6).map(sensor => (
                      <SensorCard 
                        key={sensor.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="show"
                        title={sensor.title}
                        value={(data.sensors as any)[sensor.id]}
                        unit={sensor.unit}
                        icon={sensor.icon}
                        max={sensor.max}
                        thresholds={sensor.thresholds}
                        data={history.map(h => ({ value: (h.sensors as any)[sensor.id] }))}
                        className="h-full"
                      />
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Right Sidebar: Control & Alerts */}
        <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
           <motion.div variants={itemVariants}>
             <ControlPanel />
           </motion.div>
           <motion.div variants={itemVariants}>
             <PressureGauge value={data.sensors.pressure} />
           </motion.div>
           <motion.div variants={itemVariants} className="flex-1 min-h-[200px]">
             <AlertPanel alerts={data.alerts} />
           </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

