import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifySuccess, notifyError } from '../utils/toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  MoveDown, 
  Briefcase, 
  GraduationCap, 
  Compass, 
  CheckCircle2, 
  Search, 
  Video, 
  Map, 
  ClipboardList,
  Zap,
  Image as ImageIcon,
  Award,
  Users,
  Clock,
  Target,
  Plus,
  Minus,
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  AlertCircle,
  Sparkles,
  Calendar
} from 'lucide-react';

import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

interface LandingPageProps {
  currentRole?: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

interface ContactForm {
  name: string;
  email: string;
  discipline: string;
  subject: string;
  message: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ currentRole = 'visitor' }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // About Section States
  const mentorImageUrl = "https://lh3.googleusercontent.com/d/1u6X_oVTZvmMVfiITy0Felr6yukTDkW9y";

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);

  const toggleFaq = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenFaqIndex(openFaqIndex === key ? null : key);
  };

  // Contact Form States
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    discipline: 'IT & Tech',
    subject: 'Career Guidance',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      notifyError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    
    setTimeout(() => {
      try {
        const submissions = JSON.parse(localStorage.getItem('contact_submissions_v1') || '[]');
        const newSubmission = {
          ...form,
          id: 'sub-' + Date.now(),
          timestamp: new Date().toISOString()
        };
        submissions.push(newSubmission);
        localStorage.setItem('contact_submissions_v1', JSON.stringify(submissions));

        setSuccess(true);
        setSubmitting(false);
        notifySuccess('Your message has been sent successfully!');
        setForm({
          name: '',
          email: '',
          discipline: 'IT & Tech',
          subject: 'Career Guidance',
          message: ''
        });
      } catch (err) {
        setSubmitting(false);
        notifyError('Failed to send message. Please try again.');
      }
    }, 1200);
  };

  const testimonials = [
    { 
      name: "Mauricio L.", 
      role: "Information Technology Major", 
      text: "Working with Peter has had a huge impact on my growth. He has been an amazing role model and mentor, pushing me to improve while trusting me with real responsibilities. I’m now on track to obtain my CompTIA A+ certification and I'm currently interviewing for IT positions all before my graduation in May 2026. None of this would have been possible without his mentorship." 
    },
    { 
      name: "David C.", 
      role: "Cybersecurity Professional", 
      text: "Peter has played a key role in helping me bring structure and focus to my career. Under his mentorship, I’ve developed the habit of setting three specific goals each day, which has significantly improved my productivity and overall direction. Previously, I approached challenges without a clear plan, often taking on tasks reactively." 
    },
    { 
      name: "Mohamed R.", 
      role: "MS Cybersecurity | PC Support Specialist", 
      text: "Peter’s mentorship gave me clarity and direction when I needed it most. Over the past couple of years, I’ve grown not just technically, but in how I think, plan, and approach challenges. His guidance helped me stay focused, build discipline, and make smarter decisions about my future. It's pushed me to level up my career." 
    },
    { 
      name: "Connor C.", 
      role: "IT Graduate | Future Masters CS", 
      text: "Pete has supported me in countless meaningful ways. Whether it has been through direct instruction, sharing his resources, or pointing me toward the exact tools and information I need to reach my goals. He consistently demonstrates a genuine investment in my success, checking in regularly to see how I’m progressing and making sure I stay on track." 
    }
  ];

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

  return (
    <div className="bg-transparent font-['Inter'] antialiased relative pt-16 md:pt-24">
      <VisitorHeader />

      {/* Decorative background patterns */}
      <div className="absolute top-[15%] right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[45%] left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-24 px-4 md:px-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[40px] md:rounded-[80px] overflow-hidden bg-black min-h-[60vh] md:min-h-[75vh] flex items-center justify-center p-6 sm:p-12 md:p-24 text-center shadow-[0_80px_160px_-40px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2400" 
              alt="Architecture" 
              className="w-full h-full object-cover opacity-20 grayscale scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/95 to-black"></div>
            
            {/* Ambient light effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto space-y-10 md:space-y-12">
            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="italic text-4xl sm:text-6xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-white leading-[0.9] uppercase"
              >
                CONFUSED <br />
                ABOUT <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/30 via-white to-white/30 italic">DIRECTION?</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h2 className="text-xl md:text-3xl font-black text-white/90 tracking-tight uppercase">Let’s Figure It Out Together.</h2>
              </motion.div>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-sm md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-medium px-4"
            >
              For college students, recent grads, or anyone stuck choosing their next step. 1-on-1 mentoring with a clear step-by-step plan.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full max-w-md mx-auto"
            >
              <Link to="/apply" className="btn-normal bg-white text-black w-full text-center justify-center">
                START APPLICATION
              </Link>
              <Link to="/consultation" className="btn-normal bg-transparent border border-white/20 text-white w-full text-center justify-center hover:bg-white/5">
                EXPLORE SESSIONS
              </Link>
            </motion.div>

            <div className="pt-4 flex flex-col items-center gap-4 opacity-30">
              <MoveDown size={20} className="text-white animate-bounce" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Marquee Bar */}
      <div className="py-12 md:py-16 border-y border-black/[0.03] bg-white overflow-hidden flex flex-col items-center">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8">GUIDANCE PILLARS</span>
        
        <div className="w-full relative flex overflow-hidden">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-16 md:gap-24 grayscale opacity-30 hover:opacity-100 hover:grayscale-0 transition-all duration-700 shrink-0 px-8"
          >
            {[
              "CAREER STRATEGY", "ACADEMIC PLANNING", "LIFE ARCHITECTURE", "PERSONAL GROWTH", 
              "DECISION MASTERY", "MENTAL FRAMEWORKS", "SKILL ACQUISITION", "GOAL ALIGNMENT"
            ].map((name, i) => (
              <span key={i} className="text-lg md:text-xl font-black tracking-tighter whitespace-nowrap">{name}</span>
            ))}
            {/* Duplicate for infinite effect */}
            {[
              "CAREER STRATEGY", "ACADEMIC PLANNING", "LIFE ARCHITECTURE", "PERSONAL GROWTH", 
              "DECISION MASTERY", "MENTAL FRAMEWORKS", "SKILL ACQUISITION", "GOAL ALIGNMENT"
            ].map((name, i) => (
              <span key={`dup-${i}`} className="text-lg md:text-xl font-black tracking-tighter whitespace-nowrap">{name}</span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Process Section */}
      <section className="py-20 md:py-28 px-6 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-28 items-center mb-20 md:mb-24">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-indigo-600"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.45em] text-indigo-600">The Journey</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-950">
                OUR STRATEGIC <br />
                <span className="text-slate-200">PROCESS.</span>
              </h2>
            </div>
            <p className="text-slate-500 font-semibold leading-relaxed text-base md:text-lg max-w-[520px] lg:pt-16">
              We've refined a results-driven methodology to ensure every student finds their ideal trajectory through structured introspection and action.
            </p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            <div className="hidden lg:block absolute left-0 right-0 top-[78px] h-px bg-slate-200/80"></div>
            {[
              {
                phase: "Phase 01",
                title: "Apply",
                label: "The Intent",
                desc: "Complete the 2-minute application. We look for seriousness and readiness for guidance.",
                icon: ClipboardList,
                color: "bg-indigo-600 text-white"
              },
              {
                phase: "Phase 02",
                title: "Review",
                label: "The Audit",
                desc: "We review your current goal. Your application is approved within 48 hours.",
                icon: Search,
                color: "bg-emerald-600 text-white"
              },
              {
                phase: "Phase 03",
                title: "Consult",
                label: "The Clarity",
                desc: "A 1-on-1 session to verify goals and identify the exact hurdles in your way.",
                icon: Video,
                color: "bg-amber-500 text-white"
              },
              {
                phase: "Phase 04",
                title: "Roadmap",
                label: "The Growth",
                desc: "Get your custom trajectory plan. Weekly audits, tasks, and real-time support.",
                icon: Map,
                color: "bg-black text-white"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 space-y-7"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 + 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-[60px] h-[60px] rounded-[14px] ${item.color} flex items-center justify-center shadow-[0_18px_45px_-24px_rgba(15,23,42,0.8)]`}
                >
                  <item.icon size={24} strokeWidth={2.2} />
                </motion.div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{item.phase}</p>
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-950">{item.title}</h3>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: 40 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[3px] bg-slate-100"
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RESTORED SECTION: About Mentor */}
      <section id="about" className="bg-black text-white py-16 md:py-20 px-6 w-full overflow-hidden scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1fr] gap-12 md:gap-24 items-center max-w-6xl mx-auto">
          
          {/* Visual Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
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

            <Link to="/about" className="btn-normal bg-white text-black hover:bg-slate-100 inline-flex items-center gap-7 px-9 rounded-full">
              Read the backstory <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* RESTORED SECTION: Philosophy Section */}
      <section className="bg-black text-white py-28 md:py-44 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-start">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
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
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
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
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                  className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-500"
                >
                  <CheckCircle2 size={15} strokeWidth={2.5} className="shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* RESTORED SECTION: Programs Section */}
      <section id="programs" className="py-20 md:py-24 px-6 w-full border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 md:mb-20">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-slate-950">
            THE 3 PILLARS.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-bold leading-relaxed">
            Focused guidance for every aspect of your growth.
          </p>
        </div>

        {/* Detailed Program Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-11">
          {[
            {
              title: "Life",
              desc: "Decision clarity, confidence, stress management, and personal direction.",
              icon: Compass,
              iconClass: "text-amber-500"
            },
            {
              title: "Schooling",
              desc: "Education choices, course decisions, study planning, and academic confidence.",
              icon: GraduationCap,
              iconClass: "text-emerald-500"
            },
            {
              title: "Career",
              desc: "Career clarity, skill roadmap, job preparation, and long-term planning.",
              icon: Briefcase,
              iconClass: "text-indigo-500"
            }
          ].map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="bg-white border border-slate-100 rounded-[40px] md:rounded-[44px] min-h-[300px] p-9 md:p-11 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.55)] hover:shadow-[0_24px_70px_-42px_rgba(15,23,42,0.7)] transition-all duration-500 flex flex-col justify-center"
            >
              <div className="space-y-8">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-[20px] flex items-center justify-center shadow-sm">
                  <pillar.icon size={24} className={pillar.iconClass} />
                </div>
                <div className="space-y-5">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-black">{pillar.title}</h2>
                  <p className="text-slate-400 text-base leading-relaxed font-bold max-w-[280px]">{pillar.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      <section className="bg-black text-white py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">CONDUCTED EVENTS</span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              SEE COHORTS <br />
              <span className="text-indigo-400 italic">IN ACTION.</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
              From CompTIA celebration meetups and career bootcamps to hybrid virtual roundtables, explore how our students elevate their professional presence.
            </p>
            <div className="pt-2">
              <Link to="/gallery" className="btn-normal bg-white text-black hover:bg-slate-200 inline-flex items-center gap-3">
                <span>Browse Event Gallery</span>
                <ImageIcon size={16} />
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 grid grid-cols-2 gap-4 relative"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-white/10 group"
              >
                <img src="/images/event-1.jpeg" alt="CompTIA celebration meetup" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110" loading="lazy" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-white/10 group"
              >
                <img src="/images/event-2.jpeg" alt="Career bootcamp session" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110" loading="lazy" />
              </motion.div>
            </div>
            <div className="space-y-4 pt-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-white/10 group"
              >
                <img src="/images/event-3.jpeg" alt="Hybrid virtual roundtable" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110" loading="lazy" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-white/10 group"
              >
                <img src="/images/event-4.jpg" alt="Student professional presence event" className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-110" loading="lazy" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RESTORED SECTION: Consultation Options */}
      <section id="consultation" className="py-24 md:py-32 px-6 max-w-7xl mx-auto w-full">
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
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
              <Link to="/book-call?type=intro" className="btn-normal w-full bg-slate-900 text-white hover:bg-black text-center justify-center flex">
                Book Free Call
              </Link>
            </div>
          </motion.div>

          {/* Paid Call Option */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
                Facing an immediate tactical bottleneck? Book a high-intensity session to resolve critical certification roadblocks, career decisions, study planning crises, or life trajectory doubts with Peter.
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
              <Link to="/book-call?type=rapid" className="btn-normal w-full bg-white text-black hover:bg-slate-100 text-center justify-center flex">
                Schedule Response Call
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Deliverables detail */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12 max-w-4xl mx-auto py-12"
        >
          <h2 className="text-3xl font-black uppercase tracking-tighter text-center">WHAT IS INCLUDED IN EVERY CALL</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Secure Video Meeting', icon: Video, desc: 'Private, end-to-end encrypted 1:1 video session with Peter.' },
              { title: 'Trajectory Blueprint', icon: Zap, desc: 'A custom step-by-step checklist of what to execute next.' },
              { title: 'Post-Call Email Support', icon: Calendar, desc: 'Access for up to 2 direct clarification questions after.' },
              { title: 'Resource Checklist', icon: ArrowRight, desc: 'Links to specific guides, tools, and downloads.' }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex gap-4 p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:border-indigo-100 hover:bg-slate-50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                  <f.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-1 text-black">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">SUCCESS STORIES.</h2>
            <p className="text-slate-400 font-medium text-sm">Real outcomes from our dedicated mentees.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white p-8 md:p-10 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
              >
                <p className="text-slate-600 font-medium leading-relaxed mb-8 italic text-sm md:text-base">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-black text-xs text-indigo-600">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{t.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RESTORED SECTION: FAQ Accordions */}
      <section id="faq" className="py-24 md:py-32 px-6 max-w-4xl mx-auto border-t border-slate-100">
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

        <div className="space-y-16">
          {faqCategories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 border-b border-indigo-100 pb-3">
                {cat.category}
              </h2>
              
              <div className="space-y-4">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = openFaqIndex === key;

                  return (
                    <motion.div 
                      key={itemIdx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
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
      </section>

      {/* RESTORED SECTION: Contact Form */}
      <section id="contact" className="py-24 md:py-32 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-16 md:mb-24">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-[1px] bg-indigo-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Get In Touch</span>
              <div className="w-8 h-[1px] bg-indigo-500"></div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
              CONTACT <span className="text-indigo-600 italic">PETER.</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed">
              Have a question about the cohorts, pricing, or custom options? Drop a message and Peter will get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch max-w-6xl mx-auto">
            {/* Info Details Column */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 bg-black text-white p-10 md:p-14 rounded-[48px] md:rounded-[64px] flex flex-col justify-between shadow-2xl relative overflow-hidden"
            >
              {/* Ambient pattern */}
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="space-y-12 relative z-10">
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Direct Channels</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-medium">
                    Skip the contact form if you prefer direct corporate messaging channels.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Email Us</p>
                      <p className="text-sm font-semibold text-white">peter.mannarino@coaching.com</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Call/Text</p>
                      <p className="text-sm font-semibold text-white">+1 (201) 555-0192</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Location</p>
                      <p className="text-sm font-semibold text-white">New York Metropolitan Area</p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="pt-12 border-t border-white/10 relative z-10 mt-12"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Strict Confidentiality Guaranteed</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Form Column */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 bg-white border border-slate-100 rounded-[48px] md:rounded-[64px] p-8 md:p-12 shadow-sm flex flex-col justify-center"
            >
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-12"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">Message Sent!</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                      Thank you for reaching out. Peter will personally review your inquiry and respond within 24 hours.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="btn-normal bg-slate-900 text-white hover:bg-black mx-auto mt-4"
                  >
                    Send another inquiry
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={form.name}
                        onChange={handleContactChange}
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3.5 px-5 text-sm font-medium focus:outline-none transition-colors text-black placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address *</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={form.email}
                        onChange={handleContactChange}
                        placeholder="e.g. john@example.com"
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3.5 px-5 text-sm font-medium focus:outline-none transition-colors text-black placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Discipline / Area</label>
                      <select 
                        name="discipline"
                        value={form.discipline}
                        onChange={handleContactChange}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3.5 px-5 text-sm font-medium focus:outline-none transition-colors text-black appearance-none"
                      >
                        <option value="IT & Tech">IT & Tech</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Business & Finance">Business & Finance</option>
                        <option value="Liberal Arts">Liberal Arts</option>
                        <option value="Undecided">Undecided</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject / Goal</label>
                      <select 
                        name="subject"
                        value={form.subject}
                        onChange={handleContactChange}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3.5 px-5 text-sm font-medium focus:outline-none transition-colors text-black appearance-none"
                      >
                        <option value="Career Guidance">Career Guidance</option>
                        <option value="Schooling Advice">Schooling Advice</option>
                        <option value="Life Strategy">Life Strategy</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Message *</label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleContactChange}
                      placeholder="Tell Peter about where you are currently stuck, and what you'd like to achieve..."
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3.5 px-5 text-sm font-medium focus:outline-none transition-colors text-black placeholder:text-slate-400 resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="btn-normal bg-black text-white hover:bg-slate-800 w-full sm:w-auto inline-flex items-center gap-2 justify-center"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-24 px-6 bg-black text-white text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto space-y-8 relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            READY FOR <span className="text-indigo-400">CLARITY?</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed">
            Take control of your trajectory today. Submit an application for structured long-term cohorts or schedule a strategy consultation call with Peter.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/apply" className="btn-normal bg-white text-black w-full sm:w-auto hover:bg-slate-100">
              Apply for Programs
            </Link>
            <Link to="/consultation" className="btn-normal bg-transparent border border-white/20 text-white w-full sm:w-auto hover:bg-white/5">
              Book Strategy Session
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      <Footer />


    </div>
  );
};

export default LandingPage;
