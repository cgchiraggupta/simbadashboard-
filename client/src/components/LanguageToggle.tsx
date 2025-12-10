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
        "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
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
          !isHindi ? "text-primary" : "text-gray-500"
        )}>
          EN
        </span>
        
        {/* Toggle Switch */}
        <div className="relative w-10 h-5 bg-gray-700 rounded-full mx-1">
          <motion.div
            className="absolute top-0.5 w-4 h-4 bg-primary rounded-full shadow-lg"
            animate={{ left: isHindi ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
        
        <span className={cn(
          "transition-all",
          isHindi ? "text-primary" : "text-gray-500"
        )}>
          हिं
        </span>
      </div>

      {showLabel && (
        <span className="text-xs text-gray-400 hidden sm:inline">
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
        "bg-white/5 hover:bg-white/10 border border-white/10",
        className
      )}
    >
      <Globe size={16} className="text-primary" />
      <span className="text-sm font-medium">
        {isHindi ? 'EN' : 'हिं'}
      </span>
    </button>
  );
};
