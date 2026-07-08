import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Video, 
  HelpCircle, 
  FileText, 
  BookMarked, 
  Notebook, 
  Star, 
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  studentProgressService, 
  StudentProgress 
} from '../../services/studentProgressService';
import { getProgramCurriculum } from '../../services/curriculumService';
import { programModuleService } from '../../services/programModuleService';
import { Module, Lesson } from '../../types';
import { programService } from '../../services/programService';
import { toast } from 'sonner';

function getLastIncompleteLesson(progress: StudentProgress, curriculum: Module[]): { moduleId: string; lessonId: string } | null {
  for (const mod of curriculum) {
    for (const lesson of mod.lessons) {
      const lessonProg = progress.lessons[lesson.id];
      const isComplete = lessonProg?.quizCompleted && lessonProg?.assignmentSubmitted;
      if (!isComplete) {
        return { moduleId: mod.id, lessonId: lesson.id };
      }
    }
  }
  return null;
}

function calculateProgramProgress(progress: StudentProgress | null, curriculum: Module[]): number {
  if (!progress || curriculum.length === 0) return 0;
  let totalLessons = 0;
  let completedLessons = 0;
  for (const mod of curriculum) {
    for (const lesson of mod.lessons) {
      totalLessons++;
      const lessonProg = progress.lessons[lesson.id];
      if (lessonProg?.quizCompleted && lessonProg?.assignmentSubmitted) {
        completedLessons++;
      }
    }
  }
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
}

interface StudentProgramViewProps {
  currentUser: any;
}

const StudentProgramView: React.FC<StudentProgramViewProps> = ({ currentUser }) => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any | null>(null);
  const [curriculum, setCurriculum] = useState<Module[]>([]);
  const [progressRecord, setProgressRecord] = useState<StudentProgress | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'video' | 'quiz' | 'assignment' | 'notes'>('video');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Form states
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assignmentText, setAssignmentText] = useState('');
  const [notesText, setNotesText] = useState('');

  // Video Ref for restoring playback position
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Load programs, progress & curriculum
  useEffect(() => {
    const loadData = async () => {
      if (!programId || !currentUser?.id) return;

      // Fetch program details
      const { data: matchedProg, error: progErr } = await programService.getById(programId);
      if (progErr || !matchedProg) {
        toast.error("Program not found or you do not have access.");
        navigate('/student/programs');
        return;
      }
      setProgram(matchedProg);

      // Fetch curriculum (with fallback to program_modules table)
      let cur = await getProgramCurriculum(programId);
      if (!cur || cur.length === 0) {
        const { data: mods } = await programModuleService.fetchByProgram(programId);
        if (mods && mods.length > 0) {
          cur = mods.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description || '',
            lessons: (m.videos || []).map(v => ({
              id: v.url,
              title: v.title,
              videoUrl: v.url,
              topics: [],
            })),
          }));
        }
      }
      setCurriculum(cur);

      // Initialize program progress if not already
      let record = await studentProgressService.getProgress(currentUser.id, programId);
      if (!record) {
        record = {
          userId: currentUser.id,
          programId,
          startedAt: new Date().toISOString(),
          lessons: {}
        };
      }
      setProgressRecord(record);

      // Determine starting lesson (last incomplete, or first lesson of first module)
      const lastIncomplete = getLastIncompleteLesson(record, cur);
      if (lastIncomplete) {
        setActiveModuleId(lastIncomplete.moduleId);
        setActiveLessonId(lastIncomplete.lessonId);
      } else if (cur.length > 0 && cur[0].lessons.length > 0) {
        setActiveModuleId(cur[0].id);
        setActiveLessonId(cur[0].lessons[0].id);
      }

      // Initialize accordions to expand the active module
      const initialExpanded: Record<string, boolean> = {};
      cur.forEach(mod => {
        initialExpanded[mod.id] = true; // expand all by default
      });
      setExpandedModules(initialExpanded);
    };

    loadData();
  }, [programId, currentUser?.id, navigate]);

  // Handle active lesson selection changes (load active lesson saved states)
  useEffect(() => {
    if (!activeLessonId || !progressRecord) return;
    const lessonProg = progressRecord.lessons[activeLessonId];
    if (lessonProg) {
      setNotesText(lessonProg.notes || '');
      setAssignmentText(lessonProg.assignmentText || '');
      setQuizAnswer(lessonProg.quizAnswerIndex !== undefined ? lessonProg.quizAnswerIndex : null);
      setQuizSubmitted(!!lessonProg.quizCompleted);
    } else {
      setNotesText('');
      setAssignmentText('');
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
    setActiveTab('video');
  }, [activeLessonId, progressRecord]);

  // Restore video playback position once metadata is loaded
  useEffect(() => {
    if (!activeLessonId || !progressRecord || !videoRef.current) return;
    const lessonProg = progressRecord.lessons[activeLessonId];
    if (lessonProg && lessonProg.videoPosition) {
      videoRef.current.currentTime = lessonProg.videoPosition;
    }
  }, [activeLessonId, progressRecord, activeTab]);

  // Save progress changes
  const saveProgressState = (updatedFields: any) => {
    if (!currentUser?.id || !programId || !activeLessonId) return;
    const updated = studentProgressService.updateLessonProgress(
      currentUser.id,
      programId,
      activeLessonId,
      updatedFields
    );
    setProgressRecord(updated);
  };

  // 1. Video position saver
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    // Debounce state saving to once every 4 seconds to avoid over-writing
    if (Math.abs(currentTime - lastSavedTimeRef.current) > 4) {
      lastSavedTimeRef.current = currentTime;
      saveProgressState({ videoPosition: currentTime });
    }
  };

  // 2. Topics checklist
  const handleTopicToggle = (topicId: string) => {
    if (!progressRecord) return;
    const lessonProg = progressRecord.lessons[activeLessonId] || { completedTopics: [] };
    let currentTopics = [...(lessonProg.completedTopics || [])];

    if (currentTopics.includes(topicId)) {
      currentTopics = currentTopics.filter(id => id !== topicId);
    } else {
      currentTopics.push(topicId);
    }

    saveProgressState({ completedTopics: currentTopics });
    toast.success("Topic progress saved.");
  };

  // 3. Quiz submissions
  const handleQuizSubmit = (correctIndex: number) => {
    if (quizAnswer === null) {
      toast.error("Please select an option before submitting.");
      return;
    }
    const isCorrect = quizAnswer === correctIndex;
    saveProgressState({
      quizCompleted: true,
      quizAnswerIndex: quizAnswer
    });
    setQuizSubmitted(true);

    if (isCorrect) {
      toast.success("Correct Answer! Well done.");
    } else {
      toast.error("Incorrect Answer. Feel free to review the video and try again!");
    }
  };

  // 4. Assignment submissions
  const handleAssignmentSubmit = () => {
    if (!assignmentText.trim()) {
      toast.error("Please write a draft before submitting.");
      return;
    }
    saveProgressState({
      assignmentSubmitted: true,
      assignmentText: assignmentText
    });
    toast.success("Assignment submitted successfully!");
  };

  // 5. Notes auto-saving or manually clicking save
  const handleNotesSave = () => {
    saveProgressState({ notes: notesText });
    toast.success("Personal notes saved successfully.");
  };

  // 6. Bookmark toggle
  const handleBookmarkToggle = () => {
    const lessonProg = progressRecord?.lessons[activeLessonId];
    const nextBookmark = !lessonProg?.isBookmarked;
    saveProgressState({ isBookmarked: nextBookmark });
    if (nextBookmark) {
      toast.success("Lesson bookmarked!");
    } else {
      toast.success("Bookmark removed.");
    }
  };

  // Find active Lesson details
  let activeLesson: Lesson | undefined;
  let activeModuleTitle = '';
  for (const mod of curriculum) {
    const found = mod.lessons.find(l => l.id === activeLessonId);
    if (found) {
      activeLesson = found;
      activeModuleTitle = mod.title;
      break;
    }
  }

  // Calculate percentages
  const overallPct = programId && currentUser?.id 
    ? calculateProgramProgress(progressRecord, curriculum) 
    : 0;

  // Toggle Module accordion
  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-black">Loading Program Data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/student/programs')} 
            className="group flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
            Back to Programs
          </button>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brand-charcoal">
            {program.title}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Learning Hub • {activeModuleTitle || "Select a Lesson"}
          </p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            {overallPct === 100 ? <Award size={22} /> : <BookOpen size={22} />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Overall Progress</span>
              <span className="text-indigo-600">{overallPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${overallPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Learning Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Modules & Lessons Accordion List (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Program Curriculum
            </h3>

            <div className="space-y-3">
              {curriculum.map((mod, modIdx) => {
                const isExpanded = !!expandedModules[mod.id];
                return (
                  <div key={mod.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    {/* Module Header */}
                    <button 
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/60 transition-colors text-left"
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                          Module {modIdx + 1}
                        </p>
                        <h4 className="text-xs font-extrabold text-brand-charcoal leading-snug">
                          {mod.title.replace(/^Module \d+:\s*/, '')}
                        </h4>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {/* Lessons inside Module */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white border-t border-slate-50 divide-y divide-slate-50"
                        >
                          {mod.lessons.map((les) => {
                            const isActive = les.id === activeLessonId;
                            const lessonRecord = progressRecord?.lessons[les.id];
                            const isCompleted = !!lessonRecord?.completedAt;

                            return (
                              <button
                                key={les.id}
                                onClick={() => {
                                  setActiveModuleId(mod.id);
                                  setActiveLessonId(les.id);
                                }}
                                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                                  isActive 
                                    ? 'bg-indigo-50/40 border-l-4 border-indigo-500' 
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : (
                                      <Play size={14} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className={`text-xs font-semibold leading-snug ${
                                      isActive ? 'text-indigo-900 font-extrabold' : 'text-slate-700'
                                    }`}>
                                      {les.title}
                                    </p>
                                    {les.duration && (
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        {les.duration} Duration
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Video Player & Learning Interactions Workspace (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {activeLesson ? (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
              
              {/* Lesson Title Banner */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-brand-charcoal uppercase tracking-tight">
                    {activeLesson.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Active Workspace
                    </span>
                    {progressRecord?.lessons[activeLessonId]?.isBookmarked && (
                      <span className="flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        <Star size={10} className="fill-amber-400 text-amber-500" /> Bookmarked
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleBookmarkToggle}
                  className={`p-3 rounded-full border transition-all ${
                    progressRecord?.lessons[activeLessonId]?.isBookmarked
                      ? 'bg-amber-50 border-amber-200 text-amber-500'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title={progressRecord?.lessons[activeLessonId]?.isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
                >
                  <Star size={16} className={progressRecord?.lessons[activeLessonId]?.isBookmarked ? 'fill-amber-400' : ''} />
                </button>
              </div>

              {/* Interaction Tabs */}
              <div className="flex border-b border-slate-100 text-xs font-black uppercase tracking-widest">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'video'
                      ? 'border-indigo-500 text-indigo-600 font-extrabold bg-indigo-50/10'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/40'
                  }`}
                >
                  <Video size={14} /> Video Lecture
                </button>
                {activeLesson.quiz && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'quiz'
                        ? 'border-indigo-500 text-indigo-600 font-extrabold bg-indigo-50/10'
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/40'
                    }`}
                  >
                    <HelpCircle size={14} /> Lesson Quiz
                  </button>
                )}
                {activeLesson.assignment && (
                  <button
                    onClick={() => setActiveTab('assignment')}
                    className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'assignment'
                        ? 'border-indigo-500 text-indigo-600 font-extrabold bg-indigo-50/10'
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/40'
                    }`}
                  >
                    <FileText size={14} /> Assignment
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'notes'
                      ? 'border-indigo-500 text-indigo-600 font-extrabold bg-indigo-50/10'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/40'
                  }`}
                >
                  <Notebook size={14} /> Lecture Notes
                </button>
              </div>

              {/* Workspace Content Panels */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Video Tab */}
                  {activeTab === 'video' && (
                    <motion.div
                      key="video-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {activeLesson.videoUrl ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-100 group">
                          <video
                            ref={videoRef}
                            src={activeLesson.videoUrl}
                            controls
                            className="w-full h-full object-cover"
                            onTimeUpdate={handleVideoTimeUpdate}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">
                          Video lecture is not available
                        </div>
                      )}

                      {/* Topics Checked Section */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Lesson Key Concept Checkpoints
                        </h3>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Review each core concept discussed in the video. Mark them as reviewed to log concept mastery.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {activeLesson.topics.map((topic) => {
                            const isChecked = !!progressRecord?.lessons[activeLessonId]?.completedTopics.includes(topic.id);
                            return (
                              <button
                                key={topic.id}
                                onClick={() => handleTopicToggle(topic.id)}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                  isChecked 
                                    ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900 shadow-sm' 
                                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isChecked 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <CheckCircle2 size={12} className="text-white fill-emerald-500" />}
                                </div>
                                <span className="text-xs font-extrabold leading-normal select-none">
                                  {topic.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quiz Tab */}
                  {activeTab === 'quiz' && activeLesson.quiz && (
                    <motion.div
                      key="quiz-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Lesson Comprehension Assessment</span>
                        <h3 className="text-sm font-black text-slate-800 leading-snug">
                          {activeLesson.quiz.question}
                        </h3>
                      </div>

                      <div className="space-y-3 pt-1">
                        {activeLesson.quiz.options.map((opt, optIdx) => {
                          const isSelected = quizAnswer === optIdx;
                          const showCorrect = quizSubmitted && optIdx === activeLesson!.quiz!.correctIndex;
                          const showIncorrect = quizSubmitted && isSelected && optIdx !== activeLesson!.quiz!.correctIndex;

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswer(optIdx)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                showCorrect
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                  : showIncorrect
                                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                                    : isSelected
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 disabled:hover:bg-white'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                showCorrect
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : showIncorrect
                                    ? 'bg-rose-500 border-rose-500 text-white'
                                    : isSelected
                                      ? 'bg-indigo-500 border-indigo-500 text-white'
                                      : 'border-slate-300 bg-white'
                              }`}>
                                <span className="text-[10px] font-black">{String.fromCharCode(65 + optIdx)}</span>
                              </div>
                              <span className="text-xs font-bold leading-normal">
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-4">
                        {!quizSubmitted ? (
                          <button
                            onClick={() => handleQuizSubmit(activeLesson!.quiz!.correctIndex)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-8 py-3 rounded-full transition-colors shadow-sm"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500">
                              {quizAnswer === activeLesson.quiz.correctIndex 
                                ? '✓ Correct Answer' 
                                : `✗ Incorrect (Correct is Option ${String.fromCharCode(65 + activeLesson.quiz.correctIndex)})`}
                            </span>
                            <button
                              onClick={() => {
                                setQuizSubmitted(false);
                                setQuizAnswer(null);
                              }}
                              className="text-indigo-500 hover:text-indigo-600 text-[10px] uppercase font-black tracking-widest py-3"
                            >
                              Retry Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Assignment Tab */}
                  {activeTab === 'assignment' && activeLesson.assignment && (
                    <motion.div
                      key="assignment-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">ASSIGNMENT PROMPT</span>
                        <h4 className="text-xs font-black text-brand-charcoal uppercase tracking-wider">{activeLesson.assignment.title}</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {activeLesson.assignment.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Response & Draft</label>
                        <textarea
                          value={assignmentText}
                          onChange={(e) => setAssignmentText(e.target.value)}
                          disabled={!!progressRecord?.lessons[activeLessonId]?.assignmentSubmitted}
                          placeholder="Draft your solution or submit links to shared documents (Google Drive, Github, etc.)..."
                          rows={6}
                          className="w-full text-xs font-semibold p-4 border border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 bg-slate-50/30 text-slate-700 leading-relaxed disabled:opacity-80"
                        />
                      </div>

                      <div className="flex justify-end">
                        {progressRecord?.lessons[activeLessonId]?.assignmentSubmitted ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                            <CheckCircle2 size={16} /> Assignment Submitted for Review
                          </div>
                        ) : (
                          <button
                            onClick={handleAssignmentSubmit}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-8 py-3 rounded-full transition-colors shadow-sm"
                          >
                            Submit Assignment
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <motion.div
                      key="notes-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">LECTURE COMPANION</span>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Lecture Personal Notepad</h3>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          Note down key thoughts, timestamp pointers, and follow-ups. Notes are saved automatically to your profile space.
                        </p>
                      </div>

                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Start typing your notes for this lecture here..."
                        rows={10}
                        className="w-full text-xs font-semibold p-4 border border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 bg-slate-50/30 text-slate-700 leading-relaxed"
                      />

                      <div className="flex justify-end">
                        <button
                          onClick={handleNotesSave}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-8 py-3 rounded-full transition-colors shadow-sm"
                        >
                          Save Notes
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <p className="text-sm font-bold uppercase tracking-wider">No lesson selected</p>
              <p className="text-xs mt-2">Please select a lesson from the module sidebar list to start learning.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentProgramView;
