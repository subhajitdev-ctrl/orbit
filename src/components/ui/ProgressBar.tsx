import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
}

export const ProgressBar = ({ 
  value, 
  max = 100, 
  className, 
  color = "bg-primary" 
}: ProgressBarProps) => {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const percentage = Math.round(Math.min(Math.max((safeValue / max) * 100, 0), 100));

  return (
    <div className={cn("w-full h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 relative", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn("h-full rounded-full shadow-sm relative z-10", color)}
      />
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mix-blend-difference">
          {percentage}%
        </span>
      </div>
    </div>
  );
};
