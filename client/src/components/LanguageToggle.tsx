import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { cn } from './ui/design-system';

interface LanguageToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className,
  showLabel = true 
}) => {
  const { language, toggleLanguage } = useLanguageStore();
  const isHindi = language === 'hi';

  return (
    <motion.button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
        "bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-border hover:border-primary/30",
        "text-text",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
    >
      <Globe size={18} className="text-primary" />
      
      <div className="flex items-center gap-1 text-sm font-medium">
        <span className={cn(
          "transition-all",
          !isHindi ? "text-primary font-semibold" : "text-textMuted"
        )}>
          EN
        </span>
        
        {/* Toggle Switch - Theme aware */}
        <div className="relative w-10 h-5 bg-surface rounded-full mx-1 border border-border">
          <motion.div
            className="absolute top-0.5 w-4 h-4 bg-primary rounded-full shadow-lg"
            animate={{ left: isHindi ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
        
        <span className={cn(
          "transition-all",
          isHindi ? "text-primary font-semibold" : "text-textMuted"
        )}>
          हिं
        </span>
      </div>

      {showLabel && (
        <span className="text-xs text-textMuted hidden sm:inline">
          {isHindi ? 'हिंदी' : 'English'}
        </span>
      )}
    </motion.button>
  );
};

// Compact version for sidebar
export const LanguageToggleCompact: React.FC<{ className?: string }> = ({ className }) => {
  const { language, toggleLanguage } = useLanguageStore();
  const isHindi = language === 'hi';

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg transition-all",
        "bg-surfaceHighlight hover:bg-surfaceHighlight/80 border border-border hover:border-primary/30",
        "text-text",
        className
      )}
    >
      <Globe size={16} className="text-primary" />
      <span className="text-sm font-medium text-text">
        {isHindi ? 'EN' : 'हिं'}
      </span>
    </button>
  );
};
