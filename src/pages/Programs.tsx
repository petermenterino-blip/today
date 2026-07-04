import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Briefcase, CalendarDays, CheckCircle2, ClipboardList, Compass, GraduationCap, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';
import { usePrograms } from '../hooks/usePrograms';
import type { Program } from '../types';

const iconMap: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  compass: Compass,
  shield: ShieldCheck,
  clipboard: ClipboardList,
  calendar: CalendarDays,
  default: Briefcase,
};

const colorMap: Record<string, { color: string; bg: string; border: string; iconBg: string }> = {
  career: { color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-blue-500' },
  schooling: { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-500' },
  life: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-500' },
  cybersecurity: { color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-500' },
  'project-management': { color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', iconBg: 'bg-cyan-500' },
  'academic-success': { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-500' },
  default: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', iconBg: 'bg-slate-500' },
};

const defaultPrograms: {
  id: string; title: string; icon: React.ElementType; color: string; bgColor: string;
  borderColor: string; short: string; details: string[];
}[] = [
  {
    id: 'career', title: 'Career & Professional Trajectory', icon: Briefcase,
    color: 'text-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100',
    short: 'Career clarity, skills roadmapping, certification guidance, and mock interviews.',
    details: ['Complete CV, resume and online presence audit', 'Custom roadmap for IT/technical certifications (CompTIA, CCNA, etc.)', 'Direct interview simulation and salary negotiation training', 'Strategic professional placement plan']
  },
  {
    id: 'schooling', title: 'Academic Navigation & Schooling', icon: GraduationCap,
    color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100',
    short: 'Smarter education decisions, major alignments, study schedules, and confidence.',
    details: ['Analysis of majors vs. career relevance (avoiding student debt)', 'Personalized master schedule development and study routines', 'Syllabus breakdown and task prioritizations', 'Post-graduate and Master\'s degree positioning']
  },
  {
    id: 'life', title: 'Life Strategy & Goal Architecture', icon: Compass,
    color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-100',
    short: 'Daily micro-goal setting, overthinking resolution, stress reduction, and self-belief.',
    details: ['3-Daily-Goals execution system with active check-ins', 'Anxiety reduction and stress-coping mechanisms', 'Decision-making framework for critical life junctions', 'Consistent habit-loop building and discipline logs']
  },
];

const defaultAcademyPrograms: {
  id: string; title: string; icon: React.ElementType; iconBg: string;
  duration: string; level: string; desc: string; points: string[];
}[] = [
  {
    id: 'career', title: 'IT Career Planning', icon: Briefcase, iconBg: 'bg-blue-500',
    duration: '12 weeks', level: 'All levels',
    desc: 'Build a strategic roadmap for your IT career with personalized guidance on certifications, skills, and job placement.',
    points: ['Career Path Assessment', 'Certification Roadmap', 'Resume Strategy', 'Interview Preparation']
  },
  {
    id: 'cybersecurity', title: 'Becoming a Cybersecurity Analyst', icon: ShieldCheck, iconBg: 'bg-purple-500',
    duration: '18 weeks', level: 'Beginner to intermediate',
    desc: 'Protect systems and networks from digital attacks. Master ethical hacking, networking security, and compliance.',
    points: ['Network Security', 'Ethical Hacking', 'Incident Response', 'Compliance & GRC']
  },
  {
    id: 'project-management', title: 'Project Management', icon: ClipboardList, iconBg: 'bg-emerald-500',
    duration: '10 weeks', level: 'Beginner',
    desc: 'Develop the skills to lead projects effectively using industry-standard frameworks and practical methodologies.',
    points: ['Agile & Scrum', 'Risk Management', 'Stakeholder Communication', 'PMP Prep']
  },
  {
    id: 'academic-success', title: 'Academic Success Planning', icon: CalendarDays, iconBg: 'bg-orange-500',
    duration: '8 weeks', level: 'Student focused',
    desc: 'Create practical study systems, course planning routines, and accountability habits for consistent performance.',
    points: ['Study Planning', 'Course Decisions', 'Weekly Reviews', 'Confidence Building']
  },
];

const ProgramsPage: React.FC = () => {
  const { programs: dbPrograms, loading } = usePrograms();

  const academyPrograms = defaultAcademyPrograms.map(prog => {
    const dbMatch = dbPrograms.find(p => p.id === prog.id || p.title.toLowerCase().includes(prog.title.toLowerCase().slice(0, 8)));
    if (dbMatch) {
      return {
        ...prog,
        title: dbMatch.title || prog.title,
        desc: dbMatch.description || prog.desc,
        duration: dbMatch.duration || prog.duration,
        level: dbMatch.difficulty || prog.level,
        points: dbMatch.outcomes && dbMatch.outcomes.length > 0 ? dbMatch.outcomes : prog.points,
      };
    }
    return prog;
  });

  const approachItems = defaultPrograms;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {academyPrograms.map((prog, idx) => {
            const IconComp = iconMap[prog.id] || iconMap.default;
            const colors = colorMap[prog.id] || colorMap.default;
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
                  <div className={`w-14 h-14 ${prog.iconBg || colors.iconBg} rounded-2xl flex items-center justify-center text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.8)]`}>
                    <IconComp size={24} />
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>{prog.duration || 'TBD'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{prog.level || 'All levels'}</span>
                  </div>
                  <div className="space-y-5">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 leading-tight">{prog.title}</h2>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">{prog.desc}</p>
                  </div>
                  <ul className="space-y-3 pt-2">
                    {prog.points.map((point) => (
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