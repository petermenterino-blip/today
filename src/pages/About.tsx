import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

const AboutPage: React.FC = () => {
  const mentorImageUrl = "https://lh3.googleusercontent.com/d/1u6X_oVTZvmMVfiITy0Felr6yukTDkW9y";

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />
      
      {/* Hero Section */}
      <section className="bg-black text-white px-6 py-16 md:py-20 w-full flex-1 overflow-hidden scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1fr] gap-12 md:gap-24 items-center max-w-6xl mx-auto">
          
          {/* Visual Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative group max-w-[540px] mx-auto lg:mx-0 w-full"
          >
            <div className="aspect-[4/5] bg-zinc-950 rounded-[44px] md:rounded-[58px] overflow-hidden border border-white/10 shadow-[0_40px_120px_-30px_rgba(79,70,229,0.45)] relative">
              <img 
                src={mentorImageUrl} 
                alt="Peter Mannarino" 
                className="w-full h-full object-cover filter grayscale contrast-110 transition-all duration-1000 scale-110 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent opacity-70"></div>
              <div className="absolute bottom-10 left-10 md:bottom-12 md:left-12">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.45em] text-white/70">Lead Strategist</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Mentorino</h3>
              </div>
            </div>
            
            {/* Floating Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-9 bg-indigo-600 text-white px-8 py-7 rounded-[32px] shadow-2xl border border-white/15 hidden md:block"
            >
              <div className="text-center">
                <p className="text-4xl font-black mb-1">1k+</p>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-85">People Guided</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Text/Content Container */}
          <div className="space-y-9">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-indigo-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.45em] text-indigo-500">Since 2010</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-white">
                GUIDANCE FROM <br />
                <span className="italic text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-800">EXPERIENCE.</span>
              </h1>
            </div>

            <div className="space-y-7 text-slate-400 font-semibold text-base md:text-lg leading-relaxed max-w-[560px]">
              <p>
                Leveraging over 25 years of professional experience, I have been guiding college students, recent grads, and people in the game of life for 15 years.
              </p>
              <p className="text-white/85">
                I help people make better decisions through calm, structured, and practical guidance — not pressure or motivation talk.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[540px]">
              {[
                { label: "Career", val: "Strategic Paths" },
                { label: "Life", val: "Decision Mastery" },
                { label: "Academic", val: "Future Clarity" },
                { label: "Growth", val: "Discipline Systems" }
              ].map((item, i) => (
                <div key={i} className="min-h-[90px] p-6 bg-white/[0.055] border border-white/10 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-indigo-500/40 transition-colors flex flex-col justify-center">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">{item.label}</p>
                  <p className="text-sm md:text-base font-black uppercase tracking-tight text-white">{item.val}</p>
                </div>
              ))}
            </div>

            <a href="#backstory" className="btn-normal bg-white text-black hover:bg-slate-100 inline-flex items-center gap-7 px-9 rounded-full">
              Read the backstory <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Philosophy and Journey details */}
      <section id="backstory" className="bg-black text-white py-28 md:py-44 px-6 overflow-hidden scroll-mt-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-start">
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                MOST PEOPLE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-500 to-zinc-800">FEEL LOST.</span>
              </h2>
            </div>
            <p className="text-zinc-500 text-lg md:text-xl font-bold leading-relaxed max-w-[560px]">
              It's normal, but it's a guidance gap. You might be unsure which career path to choose, feeling family pressure, or stuck without direction.
            </p>
            <ul className="space-y-4 pt-2">
              {[
                "Unsure which career path to choose",
                "Confused about education path",
                "Feeling pressure from family & society",
                "Overthinking your future"
              ].map((item) => (
                <li key={item} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white">
                PROGRAMS THAT <br />
                <span className="text-emerald-500">BRING CLARITY.</span>
              </h2>
            </div>
            <p className="text-zinc-500 text-lg md:text-xl font-bold leading-relaxed max-w-[560px]">
              No hype. No shortcuts. Just clear guidance to help you understand yourself and move forward with a realistic plan.
            </p>
            <ul className="space-y-4 pt-2">
              {[
                "Understand yourself better",
                "Make confident decisions",
                "Build a realistic plan",
                "Reduce stress and confusion"
              ].map((item) => (
                <li key={item} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-500">
                  <CheckCircle2 size={15} strokeWidth={2.5} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ready CTA Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            WANT TO WORK 1-ON-1 WITH PETER?
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            Peter works with a strictly limited cohort of dedicated students and professionals each year to ensure high-intensity, personal attention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/apply" className="btn-normal bg-black text-white hover:bg-slate-800 w-full sm:w-auto">
              Submit Your Application
            </Link>
            <Link to="/programs" className="btn-normal bg-slate-100 text-black hover:bg-slate-200 w-full sm:w-auto inline-flex items-center gap-2 justify-center">
              Explore Programs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
