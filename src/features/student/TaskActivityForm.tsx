
import React, { useState, useRef } from 'react';
import { Send, CheckCircle2, Upload, User, GraduationCap, Briefcase, Code2, FileText, Users, Target, AlertCircle, ClipboardList, BookOpen, MessageSquare } from 'lucide-react';
import { TaskActivity } from '../../types';

interface TaskActivityFormProps {
  onSubmit: (activity: Omit<TaskActivity, 'id' | 'user_id' | 'user_name' | 'status' | 'created_at'>) => Promise<void>;
  userName: string;
  isNetworkingOnly?: boolean;
  isBrandingOnly?: boolean;
}

const SectionDivider = ({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-4 pt-4">
    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-black uppercase tracking-tighter">{title}</h3>
      {subtitle && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>}
    </div>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)}
    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
    placeholder={placeholder} />
);

const TextAreaField = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none"
    placeholder={placeholder} rows={rows} />
);

const CheckboxGroup = ({ options, value, onChange, otherValue, onOtherChange, otherPlaceholder }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void;
  otherValue?: string; onOtherChange?: (v: string) => void; otherPlaceholder?: string;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const checked = value.includes(opt);
      return (
        <button key={opt} type="button" onClick={() => onChange(checked ? value.filter(v => v !== opt) : [...value, opt])}
          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            checked ? 'bg-black text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300'
          }`}>
          {opt}
        </button>
      );
    })}
    {onOtherChange && (
      <input type="text" value={otherValue || ''} onChange={e => onOtherChange(e.target.value)}
        className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium outline-none focus:border-black transition-all flex-1 min-w-[120px]"
        placeholder={otherPlaceholder || 'Other...'} />
    )}
  </div>
);

const RadioGroup = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const checked = value === opt;
      return (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            checked ? 'bg-black text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-300'
          }`}>
          {opt}
        </button>
      );
    })}
  </div>
);

const FileUploadField = ({ value, fileName, onUpload, label }: { value: string; fileName: string; onUpload: (base64: string, name: string) => void; label: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result as string, file.name);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex gap-3">
        <input ref={inputRef} type="file" onChange={handleFile} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()}
          className="px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all flex items-center gap-3 hover:bg-slate-100 flex-1">
          <Upload size={18} className="text-slate-400" />
          {fileName ? <span className="text-slate-600 truncate">{fileName}</span> : <span className="text-slate-400">Choose file...</span>}
        </button>
        {value && <button type="button" onClick={() => onUpload('', '')} className="px-4 py-2 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100">Remove</button>}
      </div>
    </div>
  );
};

const TaskActivityForm: React.FC<TaskActivityFormProps> = ({ onSubmit, userName, isNetworkingOnly, isBrandingOnly }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Section 1: Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [degreeMajor, setDegreeMajor] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [gradDate, setGradDate] = useState('');
  const [cityCountry, setCityCountry] = useState('');

  // Section 2: Career Goals
  const [careerInterest, setCareerInterest] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryOther, setIndustryOther] = useState('');
  const [shortTermGoals, setShortTermGoals] = useState('');
  const [longTermGoals, setLongTermGoals] = useState('');
  const [consultationGoals, setConsultationGoals] = useState('');

  // Section 3: Education & Experience
  const [gpa, setGpa] = useState('');
  const [coursework, setCoursework] = useState('');
  const [projects, setProjects] = useState('');
  const [internships, setInternships] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [leadership, setLeadership] = useState('');
  const [clubs, setClubs] = useState('');

  // Section 4: Skills Assessment
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [softSkills, setSoftSkills] = useState('');
  const [programmingLangs, setProgrammingLangs] = useState('');
  const [tools, setTools] = useState('');
  const [certs, setCerts] = useState('');

  // Section 5: Resume & Professional Presence
  const [resumeFile, setResumeFile] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [otherProfiles, setOtherProfiles] = useState('');

  // Section 6: Job Search Status
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [appliedCompanies, setAppliedCompanies] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('');
  const [offerStatus, setOfferStatus] = useState('');

  // Section 7: Interview Readiness
  const [techInterviewReady, setTechInterviewReady] = useState('');
  const [behavioralPractice, setBehavioralPractice] = useState('');
  const [struggleAreas, setStruggleAreas] = useState<string[]>([]);

  // Section 8: Networking
  const [networkingEvents, setNetworkingEvents] = useState('');
  const [linkedinConnecting, setLinkedinConnecting] = useState('');
  const [hasMentor, setHasMentor] = useState('');

  // Section 9: Personal Branding
  const [hasResume, setHasResume] = useState('');
  const [hasLinkedin, setHasLinkedin] = useState('');
  const [hasPortfolio, setHasPortfolio] = useState('');
  const [businessCards, setBusinessCards] = useState('');

  // Section 10: Career Challenges
  const [challenges, setChallenges] = useState<string[]>([]);
  const [challengesExplanation, setChallengesExplanation] = useState('');

  // Section 11: Consultation Priorities
  const [priorities, setPriorities] = useState<string[]>([]);
  const [priorityOther, setPriorityOther] = useState('');

  // Section 12: Additional Information
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Counselor Section
  const [counselorNotes, setCounselorNotes] = useState('');
  const [studentStrengths, setStudentStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState('');
  const [linkedinFeedback, setLinkedinFeedback] = useState('');
  const [careerRoadmap, setCareerRoadmap] = useState('');
  const [certsRecommended, setCertsRecommended] = useState('');
  const [interviewPlan, setInterviewPlan] = useState('');
  const [networkingRecs, setNetworkingRecs] = useState('');
  const [resourcesShared, setResourcesShared] = useState('');
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [followUpTasks, setFollowUpTasks] = useState('');
  const [consultationSummary, setConsultationSummary] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        intake_full_name: fullName,
        intake_email: email,
        intake_phone: phone,
        intake_university: university,
        intake_degree_major: degreeMajor,
        intake_current_year: currentYear,
        intake_grad_date: gradDate,
        intake_city_country: cityCountry,
        intake_career_interest: careerInterest,
        intake_industries: JSON.stringify(industries),
        intake_industry_other: industryOther,
        intake_short_term_goals: shortTermGoals,
        intake_long_term_goals: longTermGoals,
        intake_consultation_goals: consultationGoals,
        intake_gpa: gpa,
        intake_coursework: coursework,
        intake_projects: projects,
        intake_internships: internships,
        intake_work_experience: workExperience,
        intake_leadership: leadership,
        intake_clubs: clubs,
        intake_technical_skills: technicalSkills,
        intake_soft_skills: softSkills,
        intake_programming_languages: programmingLangs,
        intake_tools: tools,
        intake_certifications: certs,
        intake_resume_file: resumeFile,
        intake_resume_file_name: resumeFileName,
        intake_linkedin_url: linkedinUrl,
        intake_portfolio_url: portfolioUrl,
        intake_github_url: githubUrl,
        intake_other_profiles: otherProfiles,
        intake_looking_for: JSON.stringify(lookingFor),
        intake_applied_companies: appliedCompanies,
        intake_interview_status: interviewStatus,
        intake_offer_status: offerStatus,
        intake_tech_interview_ready: techInterviewReady,
        intake_behavioral_practice: behavioralPractice,
        intake_struggle_areas: JSON.stringify(struggleAreas),
        intake_networking_events: networkingEvents,
        intake_linkedin_connecting: linkedinConnecting,
        intake_has_mentor: hasMentor,
        intake_has_resume: hasResume,
        intake_has_linkedin: hasLinkedin,
        intake_has_portfolio: hasPortfolio,
        intake_business_cards: businessCards,
        intake_challenges: JSON.stringify(challenges),
        intake_challenges_explanation: challengesExplanation,
        intake_priorities: JSON.stringify(priorities),
        intake_priority_other: priorityOther,
        intake_additional_info: additionalInfo,
        counselor_notes: counselorNotes,
        counselor_student_strengths: studentStrengths,
        counselor_areas_for_improvement: areasForImprovement,
        counselor_recommended_actions: recommendedActions,
        counselor_resume_feedback: resumeFeedback,
        counselor_linkedin_feedback: linkedinFeedback,
        counselor_career_roadmap: careerRoadmap,
        counselor_certs_recommended: certsRecommended,
        counselor_interview_plan: interviewPlan,
        counselor_networking_recs: networkingRecs,
        counselor_resources_shared: resourcesShared,
        counselor_next_meeting_date: nextMeetingDate,
        counselor_follow_up_tasks: followUpTasks,
        counselor_consultation_summary: consultationSummary
      });
      setIsSuccess(true);
    } catch (error: any) {
      const msg = error?.message || 'An unexpected error occurred. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[40px] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-900">Intake Form Submitted</h3>
        <p className="text-emerald-700/70 font-medium max-w-sm mx-auto">Your career consultation intake form has been submitted to Peter for review. You will receive feedback shortly.</p>
        <button onClick={() => setIsSuccess(false)}
          className="mt-6 px-10 py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-emerald-700 transition-all shadow-lg">
          Submit Another
        </button>
      </div>
    );
  }

  const inputCls = "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all";
  const textareaCls = "w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-12">

      {/* Section 1: Personal Information */}
      <div className="space-y-6">
        <SectionDivider number="1" title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Full Name"><TextInput value={fullName} onChange={setFullName} placeholder="John Doe" /></FormField>
          <FormField label="Email Address"><TextInput value={email} onChange={setEmail} type="email" placeholder="john@email.com" /></FormField>
          <FormField label="Phone Number"><TextInput value={phone} onChange={setPhone} type="tel" placeholder="+1 (555) 000-0000" /></FormField>
          <FormField label="University / College"><TextInput value={university} onChange={setUniversity} placeholder="MIT" /></FormField>
          <FormField label="Degree & Major"><TextInput value={degreeMajor} onChange={setDegreeMajor} placeholder="B.S. Computer Science" /></FormField>
          <FormField label="Current Year / Semester"><TextInput value={currentYear} onChange={setCurrentYear} placeholder="Junior / 6th Semester" /></FormField>
          <FormField label="Expected Graduation Date"><TextInput value={gradDate} onChange={setGradDate} type="date" /></FormField>
          <FormField label="City & Country"><TextInput value={cityCountry} onChange={setCityCountry} placeholder="San Francisco, USA" /></FormField>
        </div>
      </div>

      {/* Section 2: Career Goals */}
      <div className="space-y-6">
        <SectionDivider number="2" title="Career Goals" />
        <FormField label="What career are you interested in?">
          <TextInput value={careerInterest} onChange={setCareerInterest} placeholder="Software Engineer, Data Scientist, Product Manager..." />
        </FormField>
        <FormField label="Which industries interest you?">
          <CheckboxGroup options={['AI', 'Software', 'Finance', 'Healthcare', 'Startups', 'Consulting', 'Marketing']}
            value={industries} onChange={setIndustries} otherValue={industryOther} onOtherChange={setIndustryOther} otherPlaceholder="Other industry..." />
        </FormField>
        <FormField label="Short-term career goals (Next 6–12 months)">
          <TextAreaField value={shortTermGoals} onChange={setShortTermGoals} placeholder="e.g. Land a SWE internship at a top tech company..." />
        </FormField>
        <FormField label="Long-term career goals (3–5 years)">
          <TextAreaField value={longTermGoals} onChange={setLongTermGoals} placeholder="e.g. Become a Staff Engineer leading a team..." />
        </FormField>
        <FormField label="What would you like to achieve from this consultation?">
          <TextAreaField value={consultationGoals} onChange={setConsultationGoals} placeholder="I want clarity on which career path to pursue..." />
        </FormField>
      </div>

      {/* Section 3: Education & Experience */}
      <div className="space-y-6">
        <SectionDivider number="3" title="Education & Experience" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Current GPA (Optional)"><TextInput value={gpa} onChange={setGpa} placeholder="3.8" /></FormField>
          <FormField label="Relevant Coursework"><TextInput value={coursework} onChange={setCoursework} placeholder="Data Structures, Algorithms, ML..." /></FormField>
        </div>
        <FormField label="Projects you've worked on"><TextAreaField value={projects} onChange={setProjects} placeholder="Describe your key projects..." /></FormField>
        <FormField label="Previous Internships"><TextAreaField value={internships} onChange={setInternships} placeholder="Company, role, dates, key contributions..." /></FormField>
        <FormField label="Work Experience"><TextAreaField value={workExperience} onChange={setWorkExperience} placeholder="Describe your work history..." /></FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Leadership Experience"><TextAreaField value={leadership} onChange={setLeadership} rows={2} placeholder="Student orgs, team lead..." /></FormField>
          <FormField label="Clubs / Organizations"><TextAreaField value={clubs} onChange={setClubs} rows={2} placeholder="ACM, Robotics Club..." /></FormField>
        </div>
      </div>

      {/* Section 4: Skills Assessment */}
      <div className="space-y-6">
        <SectionDivider number="4" title="Skills Assessment" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Technical Skills"><TextAreaField value={technicalSkills} onChange={setTechnicalSkills} rows={2} placeholder="System Design, Data Analysis..." /></FormField>
          <FormField label="Soft Skills"><TextAreaField value={softSkills} onChange={setSoftSkills} rows={2} placeholder="Communication, Leadership..." /></FormField>
          <FormField label="Programming Languages"><TextAreaField value={programmingLangs} onChange={setProgrammingLangs} rows={2} placeholder="Python, Java, TypeScript..." /></FormField>
          <FormField label="Tools & Technologies"><TextAreaField value={tools} onChange={setTools} rows={2} placeholder="React, Docker, AWS..." /></FormField>
        </div>
        <FormField label="Certifications"><TextInput value={certs} onChange={setCerts} placeholder="AWS Certified, Google Analytics..." /></FormField>
      </div>

      {/* Section 5: Resume & Professional Presence */}
      <div className="space-y-6">
        <SectionDivider number="5" title="Resume & Professional Presence" />
        <FileUploadField value={resumeFile} fileName={resumeFileName} onUpload={(base64, name) => { setResumeFile(base64); setResumeFileName(name); }} label="Resume Upload" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="LinkedIn Profile"><TextInput value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/..." /></FormField>
          <FormField label="Portfolio / Personal Website"><TextInput value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://yourportfolio.com" /></FormField>
          <FormField label="GitHub"><TextInput value={githubUrl} onChange={setGithubUrl} placeholder="https://github.com/..." /></FormField>
          <FormField label="Other Professional Profiles"><TextInput value={otherProfiles} onChange={setOtherProfiles} placeholder="Stack Overflow, Kaggle..." /></FormField>
        </div>
      </div>

      {/* Section 6: Job Search Status */}
      <div className="space-y-6">
        <SectionDivider number="6" title="Job Search Status" />
        <FormField label="Are you currently looking for?">
          <CheckboxGroup options={['Internship', 'Full-time Job', 'Research Position', 'Freelance Work', 'Startup Opportunities']}
            value={lookingFor} onChange={setLookingFor} />
        </FormField>
        <FormField label="Have you applied to any companies? If yes, list them.">
          <TextAreaField value={appliedCompanies} onChange={setAppliedCompanies} rows={2} placeholder="Google, Meta, Stripe..." />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Have you received interviews?"><TextAreaField value={interviewStatus} onChange={setInterviewStatus} rows={2} placeholder="Companies, stages reached..." /></FormField>
          <FormField label="Have you received offers?"><TextAreaField value={offerStatus} onChange={setOfferStatus} rows={2} placeholder="Details..." /></FormField>
        </div>
      </div>

      {/* Section 7: Interview Readiness */}
      <div className="space-y-6">
        <SectionDivider number="7" title="Interview Readiness" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Prepared for technical interviews?"><RadioGroup options={['Yes', 'No']} value={techInterviewReady} onChange={setTechInterviewReady} /></FormField>
          <FormField label="Practiced behavioral interviews?"><RadioGroup options={['Yes', 'No']} value={behavioralPractice} onChange={setBehavioralPractice} /></FormField>
        </div>
        <FormField label="Which interview areas do you struggle with?">
          <CheckboxGroup options={['Coding', 'System Design', 'Communication', 'Behavioral', 'Resume Questions', 'Case Studies']}
            value={struggleAreas} onChange={setStruggleAreas} />
        </FormField>
      </div>

      {/* Section 8: Networking */}
      <div className="space-y-6">
        <SectionDivider number="8" title="Networking" />
        <FormField label="Have you attended any networking events?"><TextAreaField value={networkingEvents} onChange={setNetworkingEvents} rows={2} placeholder="Conferences, meetups, career fairs..." /></FormField>
        <FormField label="Do you actively connect with professionals on LinkedIn?">
          <RadioGroup options={['Yes', 'Sometimes', 'No']} value={linkedinConnecting} onChange={setLinkedinConnecting} />
        </FormField>
        <FormField label="Do you currently have a mentor?"><TextInput value={hasMentor} onChange={setHasMentor} placeholder="Name / Not yet" /></FormField>
      </div>

      {/* Section 9: Personal Branding */}
      <div className="space-y-6">
        <SectionDivider number="9" title="Personal Branding" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField label="Updated resume?"><RadioGroup options={['Yes', 'No']} value={hasResume} onChange={setHasResume} /></FormField>
          <FormField label="Professional LinkedIn?"><RadioGroup options={['Yes', 'No']} value={hasLinkedin} onChange={setHasLinkedin} /></FormField>
          <FormField label="Portfolio?"><RadioGroup options={['Yes', 'No']} value={hasPortfolio} onChange={setHasPortfolio} /></FormField>
          <FormField label="Professional business cards?"><RadioGroup options={['Digital', 'Physical', 'None']} value={businessCards} onChange={setBusinessCards} /></FormField>
        </div>
      </div>

      {/* Section 10: Career Challenges */}
      <div className="space-y-6">
        <SectionDivider number="10" title="Career Challenges" />
        <FormField label="What are your biggest career challenges right now?">
          <CheckboxGroup options={['Finding internships', 'Resume', 'LinkedIn', 'Networking', 'Technical Skills', 'Communication', 'Interview Preparation', 'Time Management', 'Confidence', 'Career Direction']}
            value={challenges} onChange={setChallenges} otherValue={challengesExplanation ? 'explain' : undefined}
            onOtherChange={(v) => {}} otherPlaceholder="Other..." />
        </FormField>
        <FormField label="Please explain.">
          <TextAreaField value={challengesExplanation} onChange={setChallengesExplanation} rows={3} placeholder="Tell Peter more about your challenges..." />
        </FormField>
      </div>

      {/* Section 11: Consultation Priorities */}
      <div className="space-y-6">
        <SectionDivider number="11" title="Consultation Priorities" subtitle="What topics would you like Peter to help you with?" />
        <CheckboxGroup options={['Career Roadmap', 'Resume Review', 'LinkedIn Optimization', 'Interview Preparation', 'Internship Strategy', 'Job Search Plan', 'Networking Strategy', 'Personal Branding', 'Skill Development Plan', 'Higher Education Guidance', 'Startup Career Guidance']}
          value={priorities} onChange={setPriorities} otherValue={priorityOther} onOtherChange={setPriorityOther} otherPlaceholder="Other topic..." />
      </div>

      {/* Section 12: Additional Information */}
      <div className="space-y-6">
        <SectionDivider number="12" title="Additional Information" subtitle="Is there anything else Peter should know before your consultation?" />
        <TextAreaField value={additionalInfo} onChange={setAdditionalInfo} rows={4} placeholder="Share anything else..." />
      </div>



      {/* Submit */}
      <div className="pt-4">
        <button type="submit" disabled={isSubmitting}
          className="w-full py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-4">
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><Send size={18} /> SUBMIT FOR AUDIT</>
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskActivityForm;
