import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../components/ui/design-system';
import { motion } from 'framer-motion';

export const Analytics: React.FC = () => {
  // Mock historical data
  const sessionData = [
    { id: 1, date: '2023-11-20', duration: '45m', avgRpm: 2100, peakTemp: 65, energy: 1.2 },
    { id: 2, date: '2023-11-21', duration: '1h 20m', avgRpm: 2400, peakTemp: 72, energy: 2.5 },
    { id: 3, date: '2023-11-22', duration: '30m', avgRpm: 1800, peakTemp: 58, energy: 0.8 },
    { id: 4, date: '2023-11-23', duration: '2h 10m', avgRpm: 2200, peakTemp: 75, energy: 3.8 },
    { id: 5, date: '2023-11-24', duration: '55m', avgRpm: 2600, peakTemp: 68, energy: 1.5 },
  ];

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
      className="space-y-6"
    >
      <motion.header variants={itemVariants} className="pb-6 border-b border-white/10">
        <h2 className="text-3xl font-bold text-white">Performance Analytics</h2>
        <p className="text-gray-400 mt-1">Historical operational data and efficiency metrics</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="p-6">
             <h3 className="text-gray-400 text-sm font-bold uppercase mb-2 tracking-wider">Total Runtime (7 Days)</h3>
             <p className="text-4xl font-bold text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]">14h 25m</p>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-6">
             <h3 className="text-gray-400 text-sm font-bold uppercase mb-2 tracking-wider">Avg Efficiency</h3>
             <p className="text-4xl font-bold text-success drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">94.2%</p>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-6">
             <h3 className="text-gray-400 text-sm font-bold uppercase mb-2 tracking-wider">Total Energy</h3>
             <p className="text-4xl font-bold text-accent drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">45.2 kWh</p>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="p-6 h-[400px]">
          <h3 className="text-xl font-bold text-white mb-6">Session History</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" tickLine={false} axisLine={false} dy={10} fontSize={12} />
              <YAxis stroke="#71717a" tickLine={false} axisLine={false} dx={-10} fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="avgRpm" name="Avg RPM" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="peakTemp" name="Peak Temp (°C)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium">Avg RPM</th>
                <th className="p-4 font-medium">Peak Temp</th>
                <th className="p-4 font-medium">Energy</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-white/5">
              {sessionData.map((session) => (
                <tr key={session.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono">{session.date}</td>
                  <td className="p-4">{session.duration}</td>
                  <td className="p-4 font-mono text-primary">{session.avgRpm}</td>
                  <td className="p-4 font-mono text-danger">{session.peakTemp}°C</td>
                  <td className="p-4 font-mono text-accent">{session.energy} kWh</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </motion.div>
    </motion.div>
  );
};

