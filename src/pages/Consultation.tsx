import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Zap, ArrowRight, Video, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

const ConsultationPage: React.FC = () => {
  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 md:mb-24">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-[1px] bg-indigo-500"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Sessions</span>
            <div className="w-8 h-[1px] bg-indigo-500"></div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
            STRATEGIC <span className="text-indigo-600 italic">CONSULTATION.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
            High-intensity, hyper-focused coaching calls. We strip away the theories and solve real bottlenecks with practical logic.
          </p>
        </div>

        {/* Pricing Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-24 max-w-5xl mx-auto">
          {/* Free Call Option */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white p-8 sm:p-12 border border-slate-100 rounded-[48px] md:rounded-[64px] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 flex flex-col items-start gap-8"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Video className="text-indigo-600" size={24} />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black">1:1 Program Intro Call</h3>
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                Free
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Not sure where to start? Book a no-pressure introductory call. We will examine where you are, where you want to go, and whether our cohort is a perfect match — zero commitment, total clarity.
              </p>
            </div>

            <ul className="space-y-4 w-full">
              {["30-minute personal discovery call", "Custom trajectory analysis", "Zero pressure - alignment check only"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 mt-auto w-full">
              <Link to="/booking" className="btn-normal w-full bg-slate-900 text-white hover:bg-black text-center justify-center flex">
                Book Free Call
              </Link>
            </div>
          </motion.div>

          {/* Paid Call Option */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-black p-8 sm:p-12 rounded-[48px] md:rounded-[64px] shadow-2xl relative overflow-hidden flex flex-col items-start gap-8 group"
          >
            {/* Dynamic light effects */}
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform text-white"><Zap size={120} /></div>
            
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Zap className="text-white" size={24} />
            </div>

            <div className="space-y-4 relative z-10">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">Rapid Response Call</h3>
              <div className="inline-block px-3 py-1 bg-white/15 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                $25 <span className="opacity-50">Per Session</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Facing an immediate tactical bottleneck? Book a high-intensity session to resolve critical certification road blocks, career decisions, study planning crises, or life trajectory doubts with Peter.
              </p>
            </div>

            <ul className="space-y-4 w-full relative z-10">
              {["60-minute 1:1 strategy session", "Custom-built step-by-step action PDF", "Follow-up email feedback loop", "Priority scheduling support"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Zap size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-white/70">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 mt-auto w-full relative z-10">
              <Link to="/booking" className="btn-normal w-full bg-white text-black hover:bg-slate-100 text-center justify-center flex">
                Schedule Response Call
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Deliverables detail */}
        <section className="space-y-12 max-w-4xl mx-auto py-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-center">WHAT IS INCLUDED IN EVERY CALL</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Secure Video Meeting', icon: Video, desc: 'Private, end-to-end encrypted 1:1 video session with Peter.' },
              { title: 'Trajectory Blueprint', icon: Zap, desc: 'A custom step-by-step checklist of what to execute next.' },
              { title: 'Post-Call Email Support', icon: Calendar, desc: 'Access for up to 2 direct clarification questions after.' },
              { title: 'Resource Checklist', icon: ArrowRight, desc: 'Links to specific guides, tools, and downloads.' }
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:border-indigo-100 hover:bg-slate-50 transition-colors">
                <div className="shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                  <f.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-1 text-black">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notice alert */}
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 p-6 rounded-[28px] flex gap-4 items-start mt-12">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs font-semibold leading-relaxed">
            Note: Standard cohorts for long-term programs require an approved application. If you wish to join Peter’s monthly coaching plans, please submit an application. Individual strategy calls can be scheduled directly without an application audit.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConsultationPage;
