import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const faqCategories: FaqCategory[] = [
    {
      category: "General Program",
      items: [
        { q: "Is this program only for IT people?", a: "No. It covers career, education, and life guidance for people across all disciplines seeking clarity. Whether you are in liberal arts, engineering, cybersecurity, business, or still undecided, our frameworks apply universally." },
        { q: "Do I need to know my goals before applying?", a: "No. Many people apply precisely because they feel unsure or confused. Our initial auditing and goal-setting process is specifically designed to uncover your values and map out realistic plans." },
        { q: "Do you accept everyone who applies?", a: "No. Applications are reviewed on a case-by-case basis. We check if the applicant is genuinely ready for structured guidance, open to active feedback, and willing to put in the consistent daily effort." }
      ]
    },
    {
      category: "Consultations & Coaching",
      items: [
        { q: "Is this mentoring paid?", a: "The long-term cohorts and specialized planning paths are paid engagements for serious candidates. Your initial step is to submit an application or book a free 30-minute discovery call so we can establish if we are a good fit." },
        { q: "How are mentoring sessions conducted?", a: "We offer a flexible variety of options ranging from fully virtual video calls, phone consultations, or in-person hybrid meetings depending on your location and specific schedule. This allows each individual to customize their roadmap pace." },
        { q: "What is the Rapid Response call?", a: "The Rapid Response call is a specialized, high-intensity 60-minute strategy session designed to solve immediate problems (e.g., certification road blocks, upcoming interviews, major choices) within 24-48 hours. It bypasses the standard multi-week application queue." }
      ]
    },
    {
      category: "Methodology & Platform",
      items: [
        { q: "What is the 3-Daily-Goals system?", a: "It is our core accountability framework. Under Peter's mentorship, you select exactly three high-impact tasks each morning. You log them on your student dashboard, track your performance, and review completion rates with Peter. This builds immense consistency." },
        { q: "Can I access resources on my dashboard?", a: "Yes. Once you log in, your student portal gives you direct access to downloadable templates, curated technical assets, interactive forms, direct messaging with Peter, and historical session notes." }
      ]
    }
  ];

  const toggleFaq = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      {/* Hero Header */}
      <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 md:mb-24">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-[1px] bg-indigo-500"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Answers</span>
            <div className="w-8 h-[1px] bg-indigo-500"></div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
            COMMON <span className="text-indigo-600 italic">QUESTIONS.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
            Everything you need to know about starting your coaching journey, booking consultation calls, and unlocking consistent direction.
          </p>
        </div>

        {/* Accordions categorized */}
        <div className="max-w-4xl mx-auto space-y-16">
          {faqCategories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 border-b border-indigo-100 pb-3">
                {cat.category}
              </h2>
              
              <div className="space-y-4">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openIndex === key;

                  return (
                    <motion.div 
                      key={itemIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: itemIdx * 0.05 }}
                      className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:border-slate-200 transition-colors"
                    >
                      <button 
                        onClick={() => toggleFaq(catIdx, itemIdx)} 
                        className="w-full p-6 md:p-8 flex items-center justify-between text-left group"
                      >
                        <span className="font-black text-sm md:text-base uppercase tracking-tight text-slate-800 group-hover:text-black transition-colors">
                          {item.q}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                          className="text-slate-400 group-hover:text-black shrink-0 ml-4"
                        >
                          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 md:px-8 md:pb-8 text-slate-500 text-xs md:text-sm font-medium leading-relaxed border-t border-slate-50 pt-4">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact fallback */}
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-100 p-8 rounded-[40px] text-center space-y-6 mt-20">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto text-indigo-600">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-black">Still have queries?</h3>
          <p className="text-slate-500 text-sm font-medium">
            If you didn’t find your answer here, please reach out to Peter directly via our contact form.
          </p>
          <div>
            <Link to="/contact" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
              Go to Contact <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
