import React from 'react';
import { Calendar, Clock, Zap, ArrowRight, Video, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ConsultationOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-12 flex items-center justify-center w-12 h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={20} className="text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <header className="mb-20 text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">1:1 <br /><span className="text-slate-300">Consultation.</span></h1>
        <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto">A high-impact, focused session designed to solve one specific problem with zero fluff.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        <div className="bg-white p-10 rounded-[48px] border border-black/[0.03] space-y-6 shadow-sm hover:border-black/10 transition-all">
          <div className="p-4 bg-slate-50 w-fit rounded-2xl text-black"><Clock size={24} /></div>
          <h3 className="text-xl font-black uppercase tracking-tight">The 60-Minute Audit</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">Ideal for quick clarity on a specific decision, a CV review, or academic path choice. Includes a digital summary of the call and action items.</p>
          <div className="pt-4">
            <p className="text-3xl font-black">$250</p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Per Session</p>
          </div>
        </div>
        <div className="bg-black text-white p-10 rounded-[48px] space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Zap size={80} /></div>
          <div className="p-4 bg-white/10 w-fit rounded-2xl text-white"><Zap size={24} /></div>
          <h3 className="text-xl font-black uppercase tracking-tight">Rapid Response Call</h3>
          <p className="text-white/40 text-sm leading-relaxed font-medium">A high-intensity, immediate strategy session for when you're at a critical junction and need an expert perspective within 24-48 hours.</p>
          <div className="pt-4">
            <p className="text-3xl font-black text-emerald-400">$450</p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Priority Booking</p>
          </div>
        </div>
      </div>

      <section className="space-y-12">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-center">What's Included</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { title: 'Secure Video Call', icon: Video, desc: 'Private, encrypted 1:1 video session via our platform.' },
            { title: 'Action Trajectory', icon: Zap, desc: 'A custom-built step-by-step PDF of what to do next.' },
            { title: 'Follow-up Email', icon: Calendar, desc: 'Direct access for one follow-up question post-session.' },
            { title: 'Resource Access', icon: ArrowRight, desc: 'Complementary access to one relevant store asset.' }
          ].map((f, i) => (
            <div key={i} className="flex gap-4 p-8 bg-white border border-black/[0.03] rounded-[32px] shadow-sm hover:bg-slate-50 transition-colors">
              <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm"><f.icon size={18} /></div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight mb-1">{f.title}</h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-24 bg-slate-900 text-white p-12 md:p-20 rounded-[60px] text-center space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none"></div>
        <h2 className="text-3xl font-black uppercase tracking-tighter relative z-10">Ready to Solve It?</h2>
        <p className="text-white/40 max-w-md mx-auto font-medium leading-relaxed relative z-10">
          Note: You must have an approved application to book. Apply first, then book your slot once approved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link to="/apply" className="px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 transition-all shadow-xl">
            Apply First
          </Link>
          <Link to="/booking" className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-white/20 transition-all">
            View Availability <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConsultationOverviewPage;