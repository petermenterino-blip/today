import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/shared/Footer';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-12 flex items-center justify-center w-12 h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={20} className="text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <header className="mb-16 space-y-6">
        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-none">Terms of <br /><span className="text-slate-300">Service.</span></h1>
        <p className="text-slate-500 text-lg font-medium max-w-xl">Please read these terms carefully before using our services.</p>
      </header>

      <div className="space-y-12 text-slate-600 font-medium leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">1. Acceptance of Terms</h2>
          <p>By accessing and using Elevate by Peter Mannarino, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">2. Description of Service</h2>
          <p>Elevate provides strategic guidance, mentorship, and consulting services. These services are provided "as is" and are subject to change without notice.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">3. Professional Advice Disclaimer</h2>
          <p>The information provided through our services is for informational and educational purposes only. It is not intended as a substitute for professional legal, financial, or medical advice.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">4. Payment and Refunds</h2>
          <p>All payments for sessions and digital products are processed securely. Digital products are generally non-refundable unless specified otherwise. Consultation sessions require 24-hour notice for rescheduling.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">5. Content Ownership</h2>
          <p>All content provided, including but not limited to strategy frameworks, worksheets, and recordings, remains the intellectual property of Peter Mannarino and Elevate.</p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
