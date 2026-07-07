import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSessions } from '../../hooks/useSessions';
import { Clock3, Calendar } from 'lucide-react';
import { notifySuccess } from '../../utils/toast';

interface StudentSessionsProps {
  studentId: string;
}

const StudentSessions: React.FC<StudentSessionsProps> = ({ studentId }) => {
  const { sessions, loading } = useSessions(studentId, 'student');
  const [notification, setNotification] = useState<string | null>(null);

  const upcomingSessions = sessions.filter(s => s.attendanceStatus === 'pending');

  const handleJoinSession = (session: any) => {
    setNotification(`Joining session with Peter Mannarino...\nDate: ${new Date(session.startTime).toLocaleDateString()}\n\nRedirecting to secure video link.`);
    setTimeout(() => {
      window.open(session.meetingUrl || '#', '_blank');
      setNotification(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {upcomingSessions.map((session, i) => (
        <motion.div 
           key={session.id} 
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: i * 0.1 }}
           className="relative overflow-hidden bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg transition-all group"
        >
          <div className="absolute left-0 top-0 w-2 h-full bg-indigo-500"></div>
          <div className="flex items-center gap-4 pl-4 z-10">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="font-bold text-base text-brand-charcoal">{session.title}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {new Date(session.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <button onClick={() => handleJoinSession(session)} className="btn-compact text-[10px] bg-brand-charcoal text-white hover:bg-indigo-600 transition-colors shadow-md z-10">Join Secure Link</button>
        </motion.div>
      ))}
      {upcomingSessions.length === 0 && !loading && (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 mt-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
            <Calendar size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No upcoming sessions</p>
        </div>
      )}

      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md p-4">
          <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest flex-1 whitespace-pre-wrap">{notification}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSessions;
