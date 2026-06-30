import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { surveyService } from '../services/surveyService';
import { notifySuccess, notifyError } from '../utils/toast';

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    if (!user?.id || !rating) return;
    setSubmitting(true);
    try {
      const surveyRes = await surveyService.fetchOrCreateCurrent(user.id);
      if (!surveyRes.data) throw new Error('No survey available');
      const res = await surveyService.submitResponse(surveyRes.data.id, user.id, rating, feedback);
      if (res.error) throw new Error(res.error);
      setSubmitted(true);
      notifySuccess('Survey submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      notifyError('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 sm:mb-12 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={18} className="sm:size-[20px] text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="bg-white p-8 sm:p-12 rounded-[32px] sm:rounded-[48px] border border-black/[0.03] shadow-sm space-y-6 sm:space-y-8">
        {submitted ? (
          <div className="text-center py-12 sm:py-20 animate-in zoom-in duration-500">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4 sm:mb-6 sm:size-[64px]" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Evaluation Sent</h2>
            <p className="text-slate-400 text-[10px] sm:text-xs font-semibold mt-2">Redirecting to portal...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Session Audit</h1>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Session Experience Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setRating(i)} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl font-black text-xs transition-all shadow-sm active:scale-90 ${rating === i ? 'bg-black text-white' : 'bg-slate-50 hover:bg-black hover:text-white'}`}>{i}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Brief Summary of Takeaways</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all min-h-[120px]" placeholder="Key insights..." />
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="btn-normal w-full py-4 sm:py-5 bg-black text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Evaluation'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SurveyPage;
