import React from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldCheck, Mail, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PendingApproval: React.FC = () => {
  const { user, logout } = useAuth();
  const isRejected = user?.application_status === 'rejected';

  if (isRejected) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-12 rounded-[48px] shadow-2xl shadow-black/5 border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle size={40} />
          </div>
          
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Application Not Approved.</h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
            Unfortunately, your application for the Mentarino Workspace has not been approved at this time. 
            Please check your email for further details.
          </p>

          <button 
            onClick={() => logout()}
            className="mt-12 w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-12 rounded-[48px] shadow-2xl shadow-black/5 border border-slate-100 text-center"
      >
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <Clock size={40} />
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Application Pending.</h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
          Your application for the Mentarino Workspace is currently under review. 
          Peter will contact you via email once a decision has been made.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Secure Audit in progress</span>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
            <Mail className="text-indigo-500 shrink-0" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Notification will be sent by email</span>
          </div>
        </div>

        <button 
          onClick={() => logout()}
          className="mt-12 w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
        >
          Sign Out
        </button>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
