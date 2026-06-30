import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/shared/Footer';

const PrivacyPage: React.FC = () => {
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
        <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter leading-none">Privacy <br /><span className="text-slate-300">Policy.</span></h1>
        <p className="text-slate-500 text-lg font-medium max-w-xl">How we protect and manage your personal data.</p>
      </header>

      <div className="space-y-12 text-slate-600 font-medium leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you apply for mentorship, book a session, or purchase a product. This may include your name, email address, phone number, and professional details.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">2. How We Use Your Information</h2>
          <p>We use your information to provide our services, communicate with you about your progress, process payments, and improve our offerings. We do not sell your personal data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">3. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, or alteration. All transaction data is handled via industry-standard encrypted processors.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">4. AI Processing</h2>
          <p>We may use AI-driven tools to summarize applications or sessions to provide better strategic guidance. Your data is processed securely and is never used to train third-party public models.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. Contact us at support@elevate.com for any privacy-related inquiries.</p>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
