import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';
import { usePrograms } from '../hooks/usePrograms';

const getIconForProgram = (title: string): React.ElementType => {
  const t = title.toLowerCase();
  if (t.includes('cyber') || t.includes('security')) return BookOpen;
  if (t.includes('project') || t.includes('manage')) return Briefcase;
  return Briefcase;
};

const colorOptions = [
  { iconBg: 'bg-indigo-500' },
  { iconBg: 'bg-emerald-500' },
  { iconBg: 'bg-amber-500' },
  { iconBg: 'bg-purple-500' },
  { iconBg: 'bg-cyan-500' },
  { iconBg: 'bg-rose-500' },
];

const ProgramsPage: React.FC = () => {
  const { programs: dbPrograms, loading } = usePrograms();
  const academyPrograms = dbPrograms.filter(p => p.status === 'published');

  const steps = [
    { num: '01', title: 'Apply & Audit', desc: 'Submit your application detailing your background, road blocks, and current goals. We review it to check for a perfect coaching fit.' },
    { num: '02', title: 'Trajectory Call', desc: 'A free 30-minute introductory strategic session where we review your roadmap options and set your targets.' },
    { num: '03', title: 'Goal Tracking', desc: 'Daily goals logging, personalized weekly or bi-weekly check-ins, and direct portal dashboard tracking of all assets.' },
    { num: '04', title: 'Continuous Review', desc: 'Ongoing curriculum updates, mock audits, resource downloads, and priority support in the game of life.' },
  ];

  if (loading) {
    return (
      <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
        <VisitorHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      <section className="px-6 py-10 md:py-14 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl space-y-8 mb-16 md:mb-24">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Curated Learning Paths</span>
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.78] text-slate-950">
                Specialized <br />
                <span className="italic text-slate-400">Academy Programs</span>
              </h1>
            </div>
            <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed">
              Mentorship-first programs designed for industry-ready proficiency.
            </p>
          </div>
        </div>

        {academyPrograms.length === 0 ? (
          <div className="text-center py-24 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={28} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-3">No Programs Yet</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Academy programs are being prepared. Check back soon or contact us to learn more.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {academyPrograms.map((prog, idx) => {
              const IconComp = getIconForProgram(prog.title);
              const color = colorOptions[idx % colorOptions.length];
              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="bg-white border border-slate-100 rounded-[36px] md:rounded-[44px] p-8 md:p-10 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 min-h-[470px] flex flex-col"
                >
                  <div className="space-y-7 flex-1">
                    <div className={`w-14 h-14 ${color.iconBg} rounded-2xl flex items-center justify-center text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.8)]`}>
                      <IconComp size={24} />
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>{prog.duration || 'TBD'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{prog.difficulty || 'All levels'}</span>
                    </div>
                    <div className="space-y-5">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 leading-tight">{prog.title}</h2>
                      <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{prog.description}</p>
                    </div>
                    <ul className="space-y-3 pt-2">
                      {(prog.outcomes || []).map((point) => (
                        <li key={point} className="flex items-center gap-3 text-xs font-black text-slate-700">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-8 mt-8">
                    <Link to="/apply" className="h-12 w-full rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-950 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.18em] transition-colors">
                      Enroll Now
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

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
            {steps.map((step, sIdx) => (
              <div key={sIdx} className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6 hover:bg-white/10 transition-colors">
                <span className="text-4xl font-black text-indigo-500 italic block">{step.num}</span>
                <h3 className="text-lg font-black uppercase tracking-tight">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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