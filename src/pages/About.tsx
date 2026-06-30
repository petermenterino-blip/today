import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Award, Users, BookOpen, Clock, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

const AboutPage: React.FC = () => {
  const mentorImageUrl = "https://lh3.googleusercontent.com/d/1u6X_oVTZvmMVfiITy0Felr6yukTDkW9y";

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />
      
      {/* Hero Section */}
      <section className="px-6 py-12 md:py-20 max-w-7xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          
          {/* Visual Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative group"
          >
            <div className="aspect-[4/5] bg-slate-900 rounded-[48px] md:rounded-[64px] overflow-hidden border border-black/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative">
              <img 
                src={mentorImageUrl} 
                alt="Peter Mannarino" 
                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60"></div>
              <div className="absolute bottom-12 left-12">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/75">Lead Strategist & Coach</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Peter Mannarino.</h3>
              </div>
            </div>
            
            {/* Floating Badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-indigo-600 text-white p-6 rounded-[32px] shadow-2xl border border-white/20 hidden md:block"
            >
              <div className="text-center">
                <p className="text-4xl font-black mb-1">15+</p>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Years Mentoring</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Text/Content Container */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-indigo-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Mentor</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
                GUIDANCE FROM <br />
                <span className="text-indigo-600 italic">REAL EXPERIENCE.</span>
              </h1>
            </div>

            <div className="space-y-6 text-slate-600 font-medium text-base md:text-lg leading-relaxed">
              <p>
                Peter Mannarino has over 20 years of professional corporate and technical experience, and has spent the last 15 years guiding college students, recent graduates, and high-potential individuals through the game of life.
              </p>
              <p className="text-black">
                He believes in tactical, case-by-case strategy. His mentoring is centered on developing actionable daily plans and calm, clear direction, strictly avoiding over-hyped motivation talks or generic advice.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "EXPERIENCE", val: "20+ Years Exp", icon: Award, color: "text-indigo-500" },
                { label: "GUIDANCE", val: "1k+ Lives Touched", icon: Users, color: "text-emerald-500" },
                { label: "METHODOLOGY", val: "No Hype, Pure Logic", icon: Target, color: "text-amber-500" },
                { label: "AVAILABILITY", val: "Limited Cohorts", icon: Clock, color: "text-blue-500" }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-slate-100 transition-colors flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy and Journey details */}
      <section className="bg-slate-950 text-white py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-8 mb-20">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Core Principles</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              THE MENTORSHIP PHILOSOPHY
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              "Directional alignment always trumps raw velocity. If you are running as fast as you can but in the wrong direction, you are simply getting lost quicker."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "1. No Motivation Hype",
                desc: "Motivation is temporary and reactive. We focus on building consistent daily systems, micro-routines, and structured workflows that run on auto-pilot even when motivation is absent."
              },
              {
                title: "2. Tactical Roadmapping",
                desc: "Every person has a unique set of circumstances, biases, strengths, and constraints. We construct personalized, hyper-realistic, day-by-day action trajectories for your specific situation."
              },
              {
                title: "3. Direct Accountability",
                desc: "We don't tell you what you want to hear; we tell you what you need to hear. Clear feedback loops, goal audits, and active review sessions keep you grounded and moving forward."
              }
            ].map((principle, idx) => (
              <div key={idx} className="p-8 bg-white/5 border border-white/10 rounded-[36px] space-y-4 hover:border-indigo-500/30 transition-all duration-300">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{principle.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{principle.desc}</p>
              </div>
            ))}
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
