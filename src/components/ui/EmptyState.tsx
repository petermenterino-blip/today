import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {icon && (
        <div className="mb-4 text-slate-300">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-500 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">{description}</p>
      )}
      {action}
    </motion.div>
  );
};
