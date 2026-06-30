import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, GraduationCap, Compass, ArrowRight, CheckCircle2, Zap, Target, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

const ProgramsPage: React.FC = () => {
  const programs = [
    {
      id: 'career',
      title: 'Career & Professional Trajectory',
      icon: Briefcase,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      short: 'Career clarity, skills roadmapping, certification guidance, and mock interviews.',
      details: [
        'Complete CV, resume and online presence audit',
        'Custom roadmap for IT/technical certifications (CompTIA, CCNA, etc.)',
        'Direct interview simulation and salary negotiation training',
        'Strategic professional placement plan'
      ]
    },
    {
      id: 'schooling',
      title: 'Academic Navigation & Schooling',
      icon: GraduationCap,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      short: 'Smarter education decisions, major alignments, study schedules, and confidence.',
      details: [
        'Analysis of majors vs. career relevance (avoiding student debt)',
        'Personalized master schedule development and study routines',
        'Syllabus breakdown and task prioritizations',
        'Post-graduate and Master’s degree positioning'
      ]
    },
    {
      id: 'life',
      title: 'Life Strategy & Goal Architecture',
      icon: Compass,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      short: 'Daily micro-goal setting, overthinking resolution, stress reduction, and self-belief.',
      details: [
        '3-Daily-Goals execution system with active check-ins',
        'Anxiety reduction and stress-coping mechanisms',
        'Decision-making framework for critical life junctions',
        'Consistent habit-loop building and discipline logs'
      ]
    }
  ];

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      {/* Hero Section */}
      <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 md:mb-24">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-[1px] bg-indigo-500"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Framework</span>
            <div className="w-8 h-[1px] bg-indigo-500"></div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
            OUR GUIDANCE <span className="text-indigo-600 italic">PILLARS.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
            We do not sell pre-recorded video courses. Our program is a active, collaborative 1-on-1 strategic alliance custom-tailored to solve your specific chaos.
          </p>
        </div>

        {/* Detailed Program Pillars Grid */}
        <div className="space-y-12 md:space-y-20">
          {programs.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="bg-white border border-slate-100 rounded-[48px] md:rounded-[64px] p-8 md:p-16 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
            >
              {/* Left Column (Icon & Summary) */}
              <div className="lg:col-span-5 space-y-6">
                <div className={`w-16 h-16 ${prog.bgColor} rounded-3xl flex items-center justify-center`}>
                  <prog.icon size={28} className={prog.color} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black">{prog.title}</h2>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{prog.short}</p>
                <div className="pt-2">
                  <Link to="/apply" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                    Apply for this tier <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right Column (List of Deliverables) */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-100 rounded-[36px] p-8 md:p-12 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">WHAT WE ARCHITECT TOGETHER</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prog.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex gap-3 items-start">
                      <div className="shrink-0 mt-1">
                        <CheckCircle2 size={16} className={prog.color} />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Program Process Section */}
      <section className="bg-black text-white py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">The Blueprint</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              HOW THE ENGAGEMENT WORKS
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">Four clear steps to absolute alignment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Apply & Audit", desc: "Submit your application detailing your background, road blocks, and current goals. We review it to check for a perfect coaching fit." },
              { num: "02", title: "Trajectory Call", desc: "A free 30-minute introductory strategic session where we review your roadmap options and set your targets." },
              { num: "03", title: "Goal Tracking", desc: "Daily goals logging, personalized weekly or bi-weekly check-ins, and direct portal dashboard tracking of all assets." },
              { num: "04", title: "Continuous Review", desc: "Ongoing curriculum updates, mock audits, resource downloads, and priority support in the game of life." }
            ].map((step, sIdx) => (
              <div key={sIdx} className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6 hover:bg-white/10 transition-colors">
                <span className="text-4xl font-black text-indigo-500 italic block">{step.num}</span>
                <h3 className="text-lg font-black uppercase tracking-tight">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials or bottom CTA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto space-y-10">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
          READY TO ELEVATE YOUR DISCIPLINE?
        </h2>
        <p className="text-slate-500 text-lg font-medium">
          Whether it is career roadmap, academic confidence, or clear decision structures — we hold you to high standards.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/apply" className="btn-normal bg-black text-white hover:bg-slate-800 w-full sm:w-auto">
            Apply Now
          </Link>
          <Link to="/consultation" className="btn-normal bg-slate-100 text-black hover:bg-slate-200 w-full sm:w-auto">
            Book Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProgramsPage;
