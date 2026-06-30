import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Youtube, Check } from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = () => {
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <footer className="bg-white text-black py-16 sm:py-24 px-6 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-16 sm:mb-20">
          {/* Brand Column */}
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-black italic">M</div>
              <span className="text-lg sm:text-xl font-black uppercase tracking-tighter">Mentorino.</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
              Clarity in career, schooling, and life. We build the trajectory you were meant to follow.
            </p>
            <div className="flex items-center gap-4 sm:gap-5">
              {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-black hover:text-white transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:block sm:space-y-4">
            <div>
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 sm:mb-8">Programs</h4>
              <ul className="space-y-3 sm:space-y-4">
                {['Programs'].map((item) => (
                  <li key={item}>
                    <Link to="/programs" className="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:mt-8">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 sm:mb-8">Company</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <Link to="/about" className="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">About Mentor</Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">Contact</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-6 sm:space-y-8 col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 sm:mb-8">Stay Updated</h4>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Get the weekly "Trajectory" field notes.</p>
            <div className="relative group max-w-md">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 sm:py-4 pl-5 pr-[110px] sm:pl-6 sm:pr-[120px] text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all text-black"
                disabled={submitting || success}
              />
              <button 
                onClick={handleSubscribe}
                disabled={!email || submitting || success}
                className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {success ? <Check size={14} /> : submitting ? '...' : 'Join'}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 sm:pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center sm:text-left">
            © 2024 Mentorino Trajectory Coaching. ALL RIGHTS RESERVED.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link to="/auth?role=mentor" className="hover:text-black transition-colors text-indigo-600">Mentor Portal</Link>
            <div className="flex items-center gap-2 text-indigo-500">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
              <span>Status: Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
