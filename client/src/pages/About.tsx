import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Server, Code, Database, Zap, Activity, Radio, Layers, ShieldCheck } from 'lucide-react';
import { Card, cn } from '../components/ui/design-system';
import { useLanguageStore } from '../store/useLanguageStore';

export const About: React.FC = () => {
  const { t } = useLanguageStore();
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

  const HardwareItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-surfaceHighlight border border-border hover:border-primary/50 transition-colors group">
      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:text-white group-hover:bg-primary transition-colors">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-bold text-text mb-1">{title}</h4>
        <p className="text-sm text-textMuted">{desc}</p>
      </div>
    </div>
  );

  const TechBadge = ({ label }: { label: string }) => (
    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-surfaceHighlight border border-border text-text hover:border-primary/50 hover:text-primary transition-colors cursor-default">
      {label}
    </span>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 mb-4">
          <Zap size={48} className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight">
          {t('about.title')}<span className="text-primary">SENSE</span> <span className="text-textMuted text-2xl align-top">{t('about.version')}</span>
        </h1>
        <p className="text-xl text-textMuted max-w-2xl mx-auto">
          {t('about.subtitle')}
        </p>
      </motion.div>

      {/* System Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full" gradient>
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="text-accent" size={24} />
              <h3 className="text-xl font-bold text-white">Hardware Architecture</h3>
            </div>
            <div className="space-y-4">
              <HardwareItem 
                icon={Cpu} 
                title="ESP32 Microcontroller" 
                desc="Dual-core Tensilica LX6 @ 240MHz. Handles sensor data aggregation and WebSocket transmission." 
              />
              <HardwareItem 
                icon={Activity} 
                title="Sensor Array" 
                desc="7-point telemetry including Rotary Encoder (RPM), SW-420 (Vibration), ACS712 (Current), and Force Sensors." 
              />
              <HardwareItem 
                icon={Radio} 
                title="Actuators" 
                desc="Closed-loop DC Motor control with Servo-based feed mechanism." 
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <Code className="text-success" size={24} />
              <h3 className="text-xl font-bold text-text">Software Stack</h3>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-textMuted uppercase tracking-wider mb-3">Frontend Core</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="React 18" />
                  <TechBadge label="TypeScript" />
                  <TechBadge label="Vite" />
                  <TechBadge label="Tailwind CSS" />
                  <TechBadge label="Framer Motion" />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Data & Visualization</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="Recharts" />
                  <TechBadge label="Zustand" />
                  <TechBadge label="WebSocket" />
                  <TechBadge label="Lucide Icons" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Backend & Simulation</h4>
                <div className="flex flex-wrap gap-2">
                  <TechBadge label="Node.js" />
                  <TechBadge label="Express" />
                  <TechBadge label="Physics Engine" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Key Features Grid */}
      <motion.div variants={itemVariants}>
        <h3 className="text-2xl font-bold text-text mb-6">{t('about.systemCapabilities')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 hover:bg-surfaceHighlight transition-colors bg-surface border-border">
            <Layers className="text-primary mb-3" size={24} />
            <h4 className="font-bold text-text mb-2">{t('about.realtimeTelemetry')}</h4>
            <p className="text-sm text-textMuted">{t('about.realtimeTelemetryDesc')}</p>
          </Card>
          <Card className="p-5 hover:bg-surfaceHighlight transition-colors bg-surface border-border">
            <ShieldCheck className="text-success mb-3" size={24} />
            <h4 className="font-bold text-text mb-2">{t('about.safetyInterlock')}</h4>
            <p className="text-sm text-textMuted">{t('about.safetyInterlockDesc')}</p>
          </Card>
          <Card className="p-5 hover:bg-surfaceHighlight transition-colors bg-surface border-border">
            <Server className="text-accent mb-3" size={24} />
            <h4 className="font-bold text-text mb-2">{t('about.digitalTwin')}</h4>
            <p className="text-sm text-textMuted">{t('about.digitalTwinDesc')}</p>
          </Card>
        </div>
      </motion.div>

      {/* Footer Credit */}
      <motion.div variants={itemVariants} className="text-center pt-12 border-t border-border text-textMuted text-sm">
        <p>{t('about.footer')}</p>
        <p className="mt-2">{t('about.copyright')}</p>
      </motion.div>
    </motion.div>
  );
};

