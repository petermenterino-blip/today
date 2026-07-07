import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';

const Financials: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 px-4 md:px-0 animate-in fade-in duration-700">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center justify-center w-12 h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={20} className="text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">Financials.</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Revenue Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Net Revenue', value: '—', icon: DollarSign },
          { label: 'Avg Session', value: '—', icon: TrendingUp },
          { label: 'Retention', value: '—', icon: CreditCard },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-black/[0.03] shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-slate-50 text-black rounded-2xl group-hover:bg-black group-hover:text-white transition-all"><stat.icon size={20} /></div>
            </div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 md:p-14 rounded-[60px] border border-black/[0.03] shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-slate-400">Strategic Growth Trajectory</h3>
        <div className="h-[300px] w-full flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No revenue data available yet</p>
        </div>
      </div>
    </div>
  );
};

export default Financials;
