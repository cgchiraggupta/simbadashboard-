import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DrillData } from '../types';
import { Card, cn } from './ui/design-system';
import { useLanguageStore } from '../store/useLanguageStore';

interface ChartsProps {
  history: DrillData[];
  className?: string;
}

export const MainChart: React.FC<ChartsProps> = ({ history, className }) => {
  const { t } = useLanguageStore();
  const data = history.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rpm: d.sensors.rpm,
    vibration: d.sensors.vibration,
  }));

  return (
    <Card className={cn("p-6 h-[400px] flex flex-col bg-surface border-border", className)}>
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-textMuted text-sm font-bold uppercase tracking-wider flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-primary" />
           {t('dashboard.rpmVsVibration')}
         </h3>
         <div className="flex gap-4 text-xs font-mono text-textMuted">
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-primary rounded-full"/> {t('sensors.rpm')}</span>
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-accent rounded-full"/> {t('sensors.vibration')}</span>
         </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis 
                dataKey="time" 
                stroke="var(--color-text-muted)" 
                fontSize={10} 
                tickFormatter={(val) => val.split(':').slice(1).join(':')} 
                tickLine={false}
                axisLine={false}
                dy={10}
            />
            <YAxis 
                yAxisId="left" 
                stroke="var(--color-text-muted)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dx={-10}
            />
            <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="var(--color-text-muted)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dx={10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 500 }}
              labelStyle={{ color: 'var(--color-text-muted)', fontSize: '10px', marginBottom: '8px' }}
            />
            <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="rpm" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRpm)" 
            />
            <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="vibration" 
                stroke="var(--color-accent)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVib)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const CurrentChart: React.FC<ChartsProps> = ({ history, className }) => {
  const { t } = useLanguageStore();
  const data = history.slice(-30).map(d => ({
    time: d.timestamp,
    current: d.sensors.current
  }));

  return (
    <Card className={cn("p-6 h-[200px] flex flex-col bg-surface border-border", className)}>
      <h3 className="text-textMuted text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-success" />
        {t('dashboard.currentLoad')}
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis stroke="var(--color-text-muted)" fontSize={10} domain={[0, 20]} hide />
            <Tooltip 
              cursor={{ fill: 'var(--color-surface-highlight)' }}
              contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--color-success)' }}
            />
            <Bar dataKey="current" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const PressureGauge: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const { t } = useLanguageStore();
  const max = 500;
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <Card className={cn("p-6 flex flex-col items-center justify-center relative overflow-hidden bg-surface border-border", className)}>
       {/* Background subtle glow */}
       <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
       
       <h3 className="absolute top-4 left-4 text-textMuted text-xs font-bold uppercase tracking-wider">{t('dashboard.feedPressure')}</h3>
       
       <div className="relative w-48 h-24 mt-6 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full flex items-end justify-center">
             <div className="w-40 h-20 border-t-[16px] border-l-[16px] border-r-[16px] border-border rounded-t-full absolute"></div>
             <div 
                className="w-40 h-20 border-t-[16px] border-l-[16px] border-r-[16px] border-primary rounded-t-full absolute transition-all duration-500 ease-out shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                style={{ 
                    clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)',
                    transformOrigin: 'bottom center',
                    transform: `rotate(${percentage * 1.8 - 180}deg)` 
                }}
             ></div>
          </div>
       </div>
       <div className="mt-[-10px] text-center relative z-10">
          <span className="text-3xl font-mono font-bold text-text tracking-tight">{value.toFixed(0)}</span>
          <span className="text-textMuted ml-1 text-sm font-medium">N</span>
       </div>
    </Card>
  );
};

