import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Menu, X } from 'lucide-react';

export const VisitorHeader: React.FC = () => {
  const { role } = useAuth();
  const currentRole = role || 'visitor';
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'About Mentor', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'Consultation', path: '/consultation' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
    { name: 'Gallery', path: '/gallery' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full glass-panel z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
              <span className="text-[10px] md:text-xs font-black italic">M</span>
            </div>
            <span className="text-sm md:text-xl font-black tracking-tighter text-black uppercase">Mentorino</span>
          </Link>

          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((item) => (
              <Link 
                key={item.name}
                to={item.path}
                className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive(item.path) 
                    ? 'text-indigo-600 font-extrabold' 
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link to={currentRole !== 'visitor' ? (currentRole === 'mentor' ? '/mentor' : '/student') : '/auth'} className="btn-compact bg-black text-white px-6 py-2.5 text-[9px] tracking-widest font-black uppercase rounded-full">
              {currentRole !== 'visitor' ? 'DASHBOARD' : 'MEMBERS PORTAL'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 xl:hidden">
            <Link to={currentRole !== 'visitor' ? (currentRole === 'mentor' ? '/mentor' : '/student') : '/auth'} className="btn-compact bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 text-[8px] sm:text-[9px] tracking-widest whitespace-nowrap flex-shrink-0 rounded-full">
              {currentRole !== 'visitor' ? 'DASHBOARD' : 'PORTAL'}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-black hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] xl:hidden"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 flex flex-col p-8 bg-black"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">
                    <span className="text-[10px] font-black italic">M</span>
                  </div>
                  <span className="text-sm font-black uppercase tracking-tighter">Mentorino</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                {navLinks.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="group flex items-center justify-between py-2 border-b border-white/10"
                    >
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">0{i+1}</span>
                        <span className={`text-2xl font-black uppercase tracking-tighter transition-colors duration-300 ${
                          isActive(item.path) ? 'text-indigo-400' : 'text-white group-hover:text-white/70'
                        }`}>{item.name}</span>
                      </div>
                      <ArrowRight size={24} className="text-white/20 group-hover:text-white transition-colors" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div 
                className="mt-auto pt-8 pb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link 
                  to={currentRole !== 'visitor' ? (currentRole === 'mentor' ? '/mentor' : '/student') : '/auth'} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-4 md:py-5 bg-white text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-full shadow-xl hover:scale-105 transition-all"
                >
                  {currentRole !== 'visitor' ? 'DASHBOARD' : 'MEMBERS PORTAL'}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
