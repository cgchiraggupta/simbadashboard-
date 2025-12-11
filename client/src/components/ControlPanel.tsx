import React from 'react';
import { Play, Square, RotateCcw, AlertOctagon, Power } from 'lucide-react';
import { useDrillStore } from '../store/useDrillStore';
import { Card, Button, cn } from './ui/design-system';
import { motion } from 'framer-motion';
import { useLanguageStore } from '../store/useLanguageStore';

interface ControlPanelProps {
  className?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ className }) => {
  const { data, sendCommand, isConnected } = useDrillStore();
  const { t } = useLanguageStore();
  const isRunning = data?.status === 'Running';

  const handleStartStop = () => {
    if (isRunning) {
      sendCommand('STOP');
    } else {
      sendCommand('START');
    }
  };

  return (
    <Card className={cn("p-6 flex flex-col justify-between h-full border-border bg-surface", className)} gradient>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Power size={20} className="text-primary" />
            {t('controls.manualControl')}
          </h2>
          <div className="flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full animate-pulse", isConnected ? "bg-success" : "bg-danger")} />
             <span className={cn("text-xs font-mono", isConnected ? "text-success" : "text-danger")}>
               {isConnected ? t('controls.online') : t('controls.offline')}
             </span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={isRunning ? "outline" : "primary"}
            onClick={handleStartStop}
            disabled={!isConnected}
            className={cn("h-24 text-lg flex-col gap-3", isRunning && "border-accent text-accent hover:bg-accent/10 hover:text-accent")}
          >
            {isRunning ? <Square size={32} /> : <Play size={32} />}
            {isRunning ? t('controls.stopOperation') : t('controls.startOperation')}
          </Button>

          <Button
             variant="outline"
             onClick={() => sendCommand('RESET')}
             disabled={!isConnected}
             className="h-24 flex-col gap-3 hover:border-textMuted hover:bg-surfaceHighlight"
          >
            <RotateCcw size={28} className="opacity-70" />
            <span className="text-sm opacity-70">{t('controls.systemReset')}</span>
          </Button>
        </div>

        {/* Sliders with custom styling */}
        <div className="space-y-6 bg-surfaceHighlight p-4 rounded-xl border border-border">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <label className="text-textMuted font-medium">{t('controls.rotarySpeedTarget')}</label>
              <span className="text-primary font-mono font-bold">{data?.sensors.rpm.toFixed(0)} <span className="text-textMuted text-xs">RPM</span></span>
            </div>
            <div className="relative h-6 flex items-center">
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                defaultValue="1000"
                onChange={(e) => sendCommand('SET_RPM', parseInt(e.target.value))}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary hover:accent-blue-400 transition-all"
              />
            </div>
            <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>500</span>
              <span>1750</span>
              <span>3000</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <label className="text-textMuted font-medium">{t('controls.feedPressureForce')}</label>
              <span className="text-primary font-mono font-bold">{data?.sensors.pressure ? (data.sensors.pressure / 30).toFixed(1) : 0} <span className="text-textMuted text-xs">LEVEL</span></span>
            </div>
             <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  defaultValue="5"
                  onChange={(e) => sendCommand('SET_FEED', parseInt(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary hover:accent-blue-400 transition-all"
                />
             </div>
             <div className="flex justify-between text-[10px] text-textMuted font-mono">
              <span>{t('controls.low')}</span>
              <span>{t('controls.high')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* E-STOP */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => sendCommand('STOP')}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold p-4 rounded-xl shadow-[0_0_30px_-10px_rgba(220,38,38,0.7)] border border-red-500/50 flex items-center justify-center gap-3 transition-all group relative overflow-hidden mt-8"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
        <AlertOctagon size={24} className="group-hover:animate-pulse" />
        {t('controls.emergencyStop')}
      </motion.button>
    </Card>
  );
};
