import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Send } from 'lucide-react';
import { notifySuccess, notifyError } from '../../utils/toast';
import { contactSubmissionService } from '../../services/contactSubmissionService';
import { notify } from '../../services/notificationService';

interface ContactForm {
  name: string;
  email: string;
  discipline: string;
  subject: string;
  message: string;
}

const ContactFormContent: React.FC = () => {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    discipline: 'IT & Tech',
    subject: 'Career Guidance',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const submittedRef = useRef(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      notifyError('Please fill in all required fields.');
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;

    setSubmitting(true);

    try {
      const { error } = await contactSubmissionService.submit({
        name: form.name,
        email: form.email,
        discipline: form.discipline,
        subject: form.subject,
        message: form.message,
      });

      if (error) {
        setSubmitting(false);
        notifyError('Failed to send message. Please try again.');
        return;
      }
    } catch {
      setSubmitting(false);
      notifyError('Network error. Please check your connection and try again.');
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    notify.contactReceived().catch(() => {});
    notifySuccess('Your message has been sent successfully!');
    setForm({
      name: '',
      email: '',
      discipline: 'IT & Tech',
      subject: 'Career Guidance',
      message: '',
    });
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 py-12"
      >
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tight text-black">
            Message Sent!
          </h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
            Thank you for reaching out. Peter will personally review your
            inquiry and respond within 24 hours.
          </p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="btn-normal bg-slate-900 text-white hover:bg-black mx-auto mt-4"
        >
          Send another inquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Full Name *
          </label>
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
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Email Address *
          </label>
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
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Your Discipline / Area
          </label>
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
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Subject / Goal
          </label>
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
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Your Message *
        </label>
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
  );
};

export default ContactFormContent;
