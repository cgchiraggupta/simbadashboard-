import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  gradient?: boolean;
}

export const Card = ({ children, className, gradient = false, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
      transition={{ duration: 0.4, hover: { duration: 0.2 } }}
      className={cn(
        "rounded-2xl border border-border backdrop-blur-xl overflow-hidden relative",
        gradient ? "bg-gradient-to-b from-surfaceHighlight/50 to-transparent" : "bg-surface/40",
        className
      )}
      {...props}
    >
      {/* Shine effect on top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.div>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'outline' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-primary hover:bg-blue-600 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]",
      danger: "bg-danger hover:bg-red-600 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]",
      outline: "border border-border hover:bg-surfaceHighlight text-text",
      ghost: "hover:bg-surfaceHighlight text-textMuted hover:text-text"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

