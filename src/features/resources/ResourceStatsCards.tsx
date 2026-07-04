import React from 'react';
import { Download, Eye, Heart, Upload, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import type { ResourceStats } from '../../types/resources';

interface StatsCardsProps {
  stats: ResourceStats | null;
  loading: boolean;
}

const ResourceStatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  const cards = stats ? [
    { label: 'Total Resources', value: stats.totalResources, icon: Upload, color: 'bg-indigo-50 text-indigo-600', trend: `${stats.recentlyAdded} added this week` },
    { label: 'Total Downloads', value: stats.totalDownloads, icon: Download, color: 'bg-emerald-50 text-emerald-600', trend: 'All time' },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'bg-blue-50 text-blue-600', trend: 'All time' },
    { label: 'Total Favorites', value: stats.totalFavorites, icon: Heart, color: 'bg-rose-50 text-rose-600', trend: 'Across all resources' },
  ] : [];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
            <div className="w-10 h-10 bg-slate-100 rounded-xl mb-3" />
            <div className="h-8 bg-slate-100 rounded-lg w-16 mb-1" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
            <card.icon size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{card.label}</p>
          <p className="text-[9px] text-slate-300 font-medium mt-1">{card.trend}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default ResourceStatsCards;
