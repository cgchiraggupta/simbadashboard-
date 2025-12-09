import { useEffect, useRef } from "react";
import { useSpring, useMotionValue, useTransform, motion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  toFixed?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber = ({ value, toFixed = 0, className, prefix = "", suffix = "" }: AnimatedNumberProps) => {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 200 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(toFixed)}${suffix}`;
      }
    });
  }, [springValue, toFixed, prefix, suffix]);

  return <span ref={ref} className={className} />;
};

