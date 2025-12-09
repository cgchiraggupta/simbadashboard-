import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  toFixed?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, toFixed = 0, className }) => {
  const spring = useSpring(value, { stiffness: 100, damping: 10 });

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(spring, (current) => current.toFixed(toFixed));

  return <motion.span className={className}>{display}</motion.span>;
};

