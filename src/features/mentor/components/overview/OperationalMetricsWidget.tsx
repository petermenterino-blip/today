import React from 'react';
import { motion } from 'motion/react';
import type { HealthMetric } from '../../hooks/useOverviewStore';

interface Props {
  metrics: HealthMetric[];
  onMetricClick?: (tab?: string) => void;
}

export const OperationalMetricsWidget: React.FC<Props> = ({ metrics, onMetricClick }) => {
  if (metrics.length === 0) return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">OVERALL MENTORING HEALTH</h4>
        <p className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">OPERATIONAL METRICS</p>
      </div>
      <div className="text-center py-8 text-slate-400 text-xs font-medium">
        No metrics available yet. Start mentoring to see operational data.
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">OVERALL MENTORING HEALTH</h4>
        <p className="text-lg font-black text-brand-charcoal uppercase tracking-tighter">OPERATIONAL METRICS</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div
            key={metric.label}
            className={`space-y-2 ${onMetricClick ? 'cursor-pointer group' : ''}`}
            onClick={() => onMetricClick?.(metric.tab)}
          >
            <div className="flex justify-between items-baseline">
              <p className="text-xs font-bold text-slate-500 truncate group-hover:text-indigo-600 transition-colors">{metric.label}</p>
              <p className="text-lg font-black text-brand-charcoal">{metric.value}%</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-normal">{metric.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
