import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import { notifyError, notifySuccess } from '../utils/toast';

const ApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Fields
  const [mentorType, setMentorType] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [meetingPreference, setMeetingPreference] = useState<'Virtual' | 'In-Person' | 'Hybrid'>('Virtual');
  const [frequency, setFrequency] = useState('Weekly');
  const [goals, setGoals] = useState('');
  const [seriousness, setSeriousness] = useState(5);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  
  // File Uploader state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const totalSteps = 4;

  const handleFileSelect = async (file: File) => {
    setUploadingResume(true);
    try {
      const { data, error } = await applicationService.uploadDocument(file);
      if (error) throw new Error(error);
      setResumeUrl(data);
      notifySuccess("Document uploaded successfully!");
    } catch (err: any) {
      notifyError(err.message || "Failed to upload document");
    } finally {
      setUploadingResume(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!name || !email || !phone || !mentorType)) {
      notifyError("Please fill in all identity fields.");
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await applicationService.submitApplication({
        user_email: email,
        full_name: name,
        goal: goals,
        linkedin_url: linkedinUrl,
        resume_link: resumeUrl,
        mentor_type: mentorType,
        phone: phone,
        meeting_preference: meetingPreference,
        frequency: frequency,
        seriousness: seriousness,
      });
      
      if (error) throw new Error(error);
      
      setIsSubmitted(true);
      notifySuccess('Application submitted successfully!');
    } catch (error: any) {
      notifyError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 sm:mb-8 shadow-xl">
          <CheckCircle2 size={40} className="sm:w-[48px] sm:h-[48px]" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-3 sm:mb-4 text-slate-900 uppercase tracking-tighter">Application Sent</h1>
        <p className="text-[10px] sm:text-sm md:text-lg text-slate-500 max-w-md mx-auto mb-8 sm:mb-10 leading-relaxed font-medium">
          Peter is currently reviewing your intent. You will receive an automated response via email within 48 hours.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="btn-normal bg-black text-white px-8 sm:px-12 py-3.5 sm:py-5"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto py-6 sm:py-8 md:py-16 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 sm:mb-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border border-black/[0.05] rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all group"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5 text-black group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[10px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">PROGRAM AUDIT • Step {step}</span>
          <span className="text-[10px] sm:text-[10px] font-black text-black uppercase tracking-[0.4em]">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-black transition-all duration-1000 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 md:p-16 rounded-[32px] sm:rounded-[48px] md:rounded-[64px] border border-black/[0.03] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)]">
        {step === 1 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">PROFILE & GOALS</h2>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Questions 1-4</p>
            </div>
            
            <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">1. What type of Mentor are you seeking?</label>
                <select 
                  value={mentorType} 
                  onChange={e => setMentorType(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-3xl text-sm font-medium outline-none focus:border-black transition-all appearance-none" 
                >
                  <option value="" disabled>Select a mentor type...</option>
                  <option value="Career Strategist">Career Strategist</option>
                  <option value="Academic Guide">Academic Guide</option>
                  <option value="Research Mentor">Research Mentor</option>
                  <option value="Industry Expert">Industry Expert</option>
                  <option value="Life Coach">Life Coach</option>
                </select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 sm:py-4 md:px-5 md:py-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-3xl text-sm font-medium outline-none focus:border-black transition-all" 
                    placeholder="John Doe" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Phone Number</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 sm:py-4 md:px-5 md:py-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-3xl text-sm font-medium outline-none focus:border-black transition-all" 
                      placeholder="+1 (555) 000-0000" 
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">4. Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 sm:py-4 md:px-5 md:py-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-3xl text-sm font-medium outline-none focus:border-black transition-all" 
                      placeholder="john@example.com" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">MEETING PREF</h2>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Questions 5-6</p>
            </div>
            
            <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
              <div className="space-y-3 sm:space-y-4">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">5. What type of meeting would you prefer?</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {['Virtual', 'In-Person', 'Hybrid'].map((pref) => (
                    <button 
                      key={pref}
                      type="button"
                      onClick={() => setMeetingPreference(pref as any)}
                      className={`
                        py-4 sm:py-5 rounded-2xl sm:rounded-3xl border transition-all text-[8px] sm:text-[10px] font-black uppercase tracking-widest
                        ${meetingPreference === pref ? 'bg-black text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-black/10'}
                      `}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">6. Desired meeting frequency?</label>
                <select 
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-3xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-black appearance-none"
                >
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">THE CORE</h2>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Questions 7-8</p>
            </div>
            
            <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-1 ml-1">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">7. What is your main goal in working with a mentor?</label>
                </div>
                <textarea 
                  value={goals}
                  onChange={e => setGoals(e.target.value)}
                  className="w-full p-5 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl sm:rounded-[32px] text-xs sm:text-sm font-medium outline-none focus:border-black transition-all min-h-[120px] sm:min-h-[160px] leading-relaxed" 
                  placeholder="Be specific about the clarity or achievement you are chasing..."
                ></textarea>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">8. How serious are you? (1-10)</label>
                  <span className="text-lg sm:text-xl font-black">{seriousness}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={seriousness}
                  onChange={e => setSeriousness(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">COMMITMENT & DOCUMENTS</h2>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Questions 9-10</p>
            </div>
            
            <div className="space-y-5 sm:space-y-6 pt-2 sm:pt-4">
              <div className="space-y-2">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">9. LinkedIn Profile URL (Optional)</label>
                <input 
                  type="url" 
                  value={linkedinUrl} 
                  onChange={e => setLinkedinUrl(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 md:px-5 md:py-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-3xl text-sm font-medium outline-none focus:border-black transition-all" 
                  placeholder="https://linkedin.com/in/username" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">10. Upload Resume / Portfolio (PDF, DOCX, etc.)</label>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      await handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    dragOver ? 'border-black bg-slate-50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('resume-file-input')?.click()}
                >
                  <input 
                    type="file" 
                    id="resume-file-input"
                    className="hidden" 
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        await handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  {uploadingResume ? (
                    <div className="space-y-2 py-2 flex flex-col items-center">
                      <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-slate-900 rounded-full" role="status" aria-label="loading"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uploading document to Supabase storage...</p>
                    </div>
                  ) : resumeUrl ? (
                    <div className="space-y-1 py-2">
                      <p className="text-sm font-bold text-emerald-600">✓ Document Uploaded</p>
                      <p className="text-[9px] text-slate-400 font-mono break-all">{resumeUrl.slice(0, 60)}...</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-4">
                      <p className="text-xs font-bold text-slate-600">Drag and drop file here, or click to browse</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Supports PDF, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.1em] text-slate-600 leading-relaxed p-6 bg-slate-50 rounded-3xl border border-slate-100">
                By submitting this application, you agree to Peter Mannarino's audit protocols and terms of use.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-black/[0.02]">
          <button 
            type="button"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] ${step === 1 ? 'opacity-20 pointer-events-none' : 'text-slate-400 hover:text-black'}`}
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < totalSteps ? (
            <button 
              type="button"
              onClick={nextStep}
              className="btn-compact bg-black text-white flex items-center gap-2"
            >
              Next Phase <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingResume}
              className="btn-compact bg-black text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Confirm Inquiry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationPage;
