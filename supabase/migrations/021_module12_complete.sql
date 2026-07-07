-- Module 12: Program Progress Performance, Real-Time & Student Drill-Down
-- Indexes for fast progress lookups
CREATE INDEX IF NOT EXISTS idx_student_progress_user_program ON public.student_progress(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON public.student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_program ON public.student_progress(program_id);

-- Indexes for enrollment queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_student ON public.program_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON public.program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON public.program_enrollments(status);

-- Indexes for session lookups in side panel
CREATE INDEX IF NOT EXISTS idx_sessions_student ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON public.sessions(mentor_id);

-- Indexes for task queries
CREATE INDEX IF NOT EXISTS idx_tasks_student ON public.tasks(student_id);

-- Indexes for goal queries
CREATE INDEX IF NOT EXISTS idx_goals_student ON public.goals(student_id);

-- Enable realtime for student_progress (auto-update progress table)
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_progress;

-- Enable realtime for program_enrollments (auto-update enrollment changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.program_enrollments;
