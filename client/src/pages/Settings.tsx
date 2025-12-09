import React from 'react';
import { Save, Bell, Shield, Database, Sliders } from 'lucide-react';
import { Card, Button } from '../components/ui/design-system';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
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
       <motion.header variants={itemVariants} className="pb-6 border-b border-white/10">
        <h2 className="text-3xl font-bold text-white">System Configuration</h2>
        <p className="text-gray-400 mt-1">Manage thresholds, notifications, and system parameters</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full">
            <div className="flex items-center gap-3 mb-6 text-white">
              <Sliders className="text-primary" size={24} />
              <h3 className="text-xl font-bold">Sensor Thresholds</h3>
            </div>
            <div className="space-y-4">
              {['RPM Warning Limit', 'Vibration Critical Limit', 'Max Temperature', 'Current Overload'].map((label) => (
                <div key={label} className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">{label}</label>
                  <input 
                    type="number" 
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono" 
                    placeholder="Enter value..." 
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="p-6">
               <div className="flex items-center gap-3 mb-6 text-white">
                 <Bell className="text-accent" size={24} />
                 <h3 className="text-xl font-bold">Notifications</h3>
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                   <span className="text-gray-300">Email Alerts</span>
                   <input type="checkbox" className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" defaultChecked />
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                   <span className="text-gray-300">SMS Priority Alerts</span>
                   <input type="checkbox" className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" />
                 </div>
               </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-6">
               <div className="flex items-center gap-3 mb-6 text-white">
                 <Database className="text-success" size={24} />
                 <h3 className="text-xl font-bold">Data Logging</h3>
               </div>
               <div className="space-y-3">
                  <label className="text-sm text-gray-400 font-medium">Log Interval</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                    <option>500ms (High Resolution)</option>
                    <option>1s (Standard)</option>
                    <option>5s (Low Bandwidth)</option>
                  </select>
               </div>
            </Card>
          </motion.div>

           <motion.div variants={itemVariants}>
             <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-primary/20">
               <Save size={20} />
               Save Configuration
             </Button>
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

