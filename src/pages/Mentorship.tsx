import React from 'react';
import { Briefcase, GraduationCap, Compass, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MentorshipPage: React.FC = () => {
  const navigate = useNavigate();
  const pillars = [
    {
      title: 'Career Programs',
      icon: Briefcase,
      desc: 'Guidance on career path selection, skill development, and professional positioning to help you break into your desired field.',
      features: ['Career Pathing', 'Resume & Profile Audit', 'Interview Preparation', 'Industry Insights'],
    },
    {
      title: 'Schooling Programs',
      icon: GraduationCap,
      desc: 'Helping people navigate educational choices, study systems, and academic transitions with confidence and clarity.',
      features: ['Course Selection', 'Study Techniques', 'Academic Goals', 'Transition Support'],
    },
    {
      title: 'Life Programs',
      icon: Compass,
      desc: 'Personal development focused on decision-making, discipline, and finding direction during early adulthood transitions.',
      features: ['Decision Clarity', 'Habit Building', 'Goal Setting', 'Personal Vision'],
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 sm:mb-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <header className="mb-10 sm:mb-16 text-center flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">Programs</h1>
        <p className="text-slate-500 text-sm sm:text-lg max-w-2xl leading-relaxed font-medium px-4">
          Structured guidance across three key pillars for maximum growth and clarity.
        </p>
      </header>

      <div className="space-y-6 sm:space-y-12">
        {pillars.map((pillar, i) => (
          <section key={i} className="bg-white border border-black/[0.03] rounded-3xl sm:rounded-[48px] p-6 sm:p-12 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <pillar.icon size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mb-2 sm:mb-3">{pillar.title}</h2>
                  <p className="text-slate-500 text-xs sm:text-base leading-relaxed max-w-2xl font-semibold">
                    {pillar.desc}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {pillar.features.map(f => (
                    <div key={f} className="flex items-center gap-2 sm:gap-3 text-slate-600">
                      <CheckCircle2 size={16} className="text-emerald-500 sm:w-[18px] sm:h-[18px]" />
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="bg-slate-900 text-white rounded-[40px] sm:rounded-[60px] p-8 sm:p-20 text-center space-y-6 sm:space-y-8 mt-12 sm:mt-20">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Start Your Journey</h2>
          <p className="text-white/40 text-xs sm:text-base max-w-lg mx-auto font-medium px-4">
            Take the next step toward a clearer future. Apply today or contact us to find the right fit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            <Link to="/apply" className="btn-normal w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 bg-white text-black inline-flex items-center justify-center gap-2">
              Apply Now <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn-normal w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 bg-white/5 border border-white/10 text-white">
              Ask a Question
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MentorshipPage;