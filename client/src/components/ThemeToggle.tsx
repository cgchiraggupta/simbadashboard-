import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { cn } from './ui/design-system';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all relative overflow-hidden",
        "bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-border hover:border-primary/30",
        "text-text",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative z-10 flex items-center justify-center w-5 h-5">
        <Sun 
          size={18} 
          className={cn(
            "absolute transition-all duration-500",
            isDark ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100 text-yellow-500"
          )} 
        />
        <Moon 
          size={18} 
          className={cn(
            "absolute transition-all duration-500 text-blue-400",
            isDark ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0"
          )} 
        />
      </div>
    </motion.button>
  );
};
