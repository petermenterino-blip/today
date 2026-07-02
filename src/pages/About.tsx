import React from 'react';
import { ArrowLeft, Brain, Briefcase, Eye, Instagram, Linkedin, Shield, Target, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';

const AboutPage: React.FC = () => {
  const mentorImageUrl = 'https://lh3.googleusercontent.com/d/1u6X_oVTZvmMVfiITy0Felr6yukTDkW9y';

  const approach = [
    {
      title: 'Calm Clarity',
      desc: 'No hype, no motivation talk. Just structured analysis of your current state vs your desired state.',
      icon: Brain,
    },
    {
      title: 'Real Experience',
      desc: 'Advice rooted in two decades of corporate and entrepreneurial reality, not textbook theory.',
      icon: Briefcase,
    },
    {
      title: 'Extreme Truth',
      desc: 'Honest feedback that others are too polite to give, but you need to hear to grow.',
      icon: Target,
    },
  ];

  const values = ['Integrity', 'Impact', 'Strategic Thought', 'Discipline'];

  return (
    <div className="bg-white font-['Inter'] antialiased min-h-screen text-slate-950 pt-24 md:pt-32">
      <VisitorHeader />

      <main className="px-6">
        <div className="max-w-5xl mx-auto pt-4 md:pt-6">
          <Link
            to="/"
            aria-label="Back"
            className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-black hover:border-slate-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        <section className="max-w-5xl mx-auto text-center pt-2 md:pt-4 pb-16 md:pb-24 flex flex-col items-center">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
            Peter
          </h1>
          <div className="mt-5 mx-auto inline-flex justify-center bg-black px-8 sm:px-10 md:px-12 py-4 md:py-5">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
              Mentorino
            </h2>
          </div>
          <div className="mt-8 mx-auto inline-flex justify-center border border-slate-200 px-10 sm:px-14 py-4">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.45em] text-slate-400">
              Mentor & Strategic Consultant
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[0.85fr_1fr] gap-12 md:gap-20 items-center pb-24 md:pb-32">
          <div className="mx-auto w-full max-w-[330px] aspect-[0.78] rounded-[72px] overflow-hidden shadow-[0_28px_70px_-42px_rgba(15,23,42,0.7)] bg-slate-100">
            <img
              src={mentorImageUrl}
              alt="Peter Mentorino"
              className="w-full h-full object-cover grayscale contrast-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>

          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">The Bio</h3>
            <div className="space-y-7 text-slate-500 text-base md:text-lg font-semibold leading-relaxed">
              <p>
                Leveraging over 25 years of high-performance leadership in specialized sectors, I have dedicated the last 15 years to bridging the guidance gap for the next generation. Since 2010, I have guided over 1,000 people in this game called life, helping them navigate the complexities of career, education, and personal purpose.
              </p>
              <p>
                My approach is built on "Calm Clarity"--stripping away the noise and pressure of modern expectations to help college students, recent grads, and those seeking direction make decisions rooted in their own strengths and realistic trajectories.
              </p>
            </div>
            <div className="flex gap-12 mt-12">
              <div>
                <p className="text-5xl font-black tracking-tighter text-black">25+</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Years Exp</p>
              </div>
              <div>
                <p className="text-5xl font-black tracking-tighter text-black">15y</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Guidance</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center pb-24 md:pb-32">
          <span className="inline-flex rounded-full bg-slate-50 px-5 py-2 text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
            The Backstory
          </span>
          <h2 className="mt-8 text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            Why Mentorino Exists.
          </h2>
          <div className="mt-10 space-y-7 text-slate-500 text-base md:text-lg font-semibold leading-relaxed">
            <p>
              Before Mentorino, I spent over 25 years in corporate and entrepreneurial environments -- across multiple sectors and leadership roles. I saw the same pattern repeat: talented, smart people stalling not because they lacked ability, but because they lacked clarity and structured guidance.
            </p>
            <p>
              In 2010, I started mentoring on the side. One conversation led to another. Within a few years, I had guided over 1,000 individuals -- college students, recent grads, career changers -- helping them navigate the noise and build real, actionable trajectories.
            </p>
            <p>
              Mentorino was built to formalize what was already working. No hype, no motivation talk. Just calm, structured, honest guidance rooted in real-world experience.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto pb-24 md:pb-32">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Program Approach</h2>
            <div className="mx-auto mt-5 w-10 h-1 bg-black rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {approach.map((item) => (
              <div key={item.title} className="bg-white border border-slate-100 rounded-[42px] p-10 min-h-[250px] shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 mb-10">
                  <item.icon size={20} />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight mb-6">{item.title}</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto pb-20 md:pb-28">
          <div className="bg-black rounded-[56px] md:rounded-[86px] px-8 md:px-16 py-20 md:py-28 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Philosophy & Vision</h2>
            <blockquote className="mt-12 max-w-3xl mx-auto text-3xl md:text-4xl italic font-black leading-relaxed text-white/45">
              "Direction is more important than speed. Many people are running fast toward a wall. My mission is to show them where the door is."
            </blockquote>
            <div className="mt-16 flex flex-wrap justify-center gap-5">
              {values.map((value) => (
                <div key={value} className="min-w-[120px] rounded-full bg-white/[0.06] border border-white/10 px-7 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
