import React from 'react';

import { Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';
import ContactFormContent from '../components/shared/ContactFormContent';

const ContactPage: React.FC = () => {
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
            <ContactFormContent />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
