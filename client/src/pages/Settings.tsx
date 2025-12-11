import React from 'react';
import { Save, Bell, Shield, Database, Sliders } from 'lucide-react';
import { Card, Button } from '../components/ui/design-system';
import { motion } from 'framer-motion';
import { useLanguageStore } from '../store/useLanguageStore';

export const Settings: React.FC = () => {
  const { t } = useLanguageStore();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      className="space-y-6 max-w-4xl mx-auto"
    >
       <motion.header variants={itemVariants} className="pb-6 border-b border-border">
        <h2 className="text-3xl font-bold text-text">{t('settings.title')}</h2>
        <p className="text-textMuted mt-1">{t('settings.subtitle')}</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full bg-surface border-border">
            <div className="flex items-center gap-3 mb-6 text-text">
              <Sliders className="text-primary" size={24} />
              <h3 className="text-xl font-bold">{t('settings.sensorThresholds')}</h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'rpmWarningLimit', label: t('settings.rpmWarningLimit') },
                { key: 'vibrationCriticalLimit', label: t('settings.vibrationCriticalLimit') },
                { key: 'maxTemperature', label: t('settings.maxTemperature') },
                { key: 'currentOverload', label: t('settings.currentOverload') }
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-sm text-textMuted font-medium">{item.label}</label>
                  <input 
                    type="number" 
                    className="w-full bg-surfaceHighlight border border-border rounded-lg p-3 text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono" 
                    placeholder={t('common.loading')} 
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface border-border">
               <div className="flex items-center gap-3 mb-6 text-text">
                 <Bell className="text-accent" size={24} />
                 <h3 className="text-xl font-bold">{t('settings.notifications')}</h3>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceHighlight">
                   <span className="text-text">{t('settings.emailAlerts')}</span>
                   <input type="checkbox" className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-transparent" defaultChecked />
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceHighlight">
                   <span className="text-text">{t('settings.smsPriorityAlerts')}</span>
                   <input type="checkbox" className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-transparent" />
                 </div>
               </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface border-border">
               <div className="flex items-center gap-3 mb-6 text-text">
                 <Database className="text-success" size={24} />
                 <h3 className="text-xl font-bold">{t('settings.dataLogging')}</h3>
               </div>
               <div className="space-y-3">
                  <label className="text-sm text-textMuted font-medium">{t('settings.logInterval')}</label>
                  <select className="w-full bg-surfaceHighlight border border-border rounded-lg p-3 text-text focus:border-primary outline-none">
                    <option>{t('settings.logIntervalHigh')}</option>
                    <option>{t('settings.logIntervalStandard')}</option>
                    <option>{t('settings.logIntervalLow')}</option>
                  </select>
               </div>
            </Card>
          </motion.div>

           <motion.div variants={itemVariants}>
             <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/20">
               <Save size={20} />
               {t('settings.saveConfiguration')}
             </Button>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

