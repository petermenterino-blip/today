import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';
import { notifySuccess, notifyError } from '../utils/toast';

interface ContactForm {
  name: string;
  email: string;
  discipline: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    discipline: 'IT & Tech',
    subject: 'Career Guidance',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      notifyError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    
    // Simulate API call and save to localStorage
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

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      {/* Main Content */}
      <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full flex-1">
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
          <div className="lg:col-span-5 bg-black text-white p-10 md:p-14 rounded-[48px] md:rounded-[64px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
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

            <div className="pt-12 border-t border-white/10 relative z-10 mt-12">
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Strict Confidentiality Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[48px] md:rounded-[64px] p-8 md:p-12 shadow-sm flex flex-col justify-center">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                    onChange={handleChange}
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
