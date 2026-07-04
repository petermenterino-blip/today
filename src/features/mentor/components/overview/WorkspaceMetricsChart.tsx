import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Props {
  chartData: {
    growth: { name: string; active: number }[];
    sessions: { name: string; completed: number; scheduled: number }[];
    completions: { name: string; rate: number }[];
  };
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export const WorkspaceMetricsChart: React.FC<Props> = ({ chartData, selectedTab, onTabChange }) => {
  const tabs = [
    { id: 'growth', label: 'Student Growth' },
    { id: 'sessions', label: 'Session Delivery' },
    { id: 'completions', label: 'Program Success' },
  ];

  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Workspace Metrics & Performance</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time cohort engagement data</p>
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl self-start md:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${selectedTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {selectedTab === 'completions' ? (
            <AreaChart data={chartData.completions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="cSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="rate" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#cSuccess)" name="Completion Rate (%)" />
            </AreaChart>
          ) : selectedTab === 'sessions' ? (
            <AreaChart data={chartData.sessions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="cSched" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient><linearGradient id="cComp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="scheduled" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#cSched)" name="Scheduled Sessions" />
              <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#cComp)" name="Completed Sessions" />
            </AreaChart>
          ) : (
            <AreaChart data={chartData.growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="cGrowth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dx={-10} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="active" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#cGrowth)" name="Active Enrollments" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
