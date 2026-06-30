import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(password);
      setNotification('Password updated successfully!');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12 animate-in fade-in duration-700">
      <div className="w-full max-w-[400px] bg-white p-8 md:p-10 rounded-[48px] border border-black/[0.03] shadow-2xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-8 uppercase text-center">Reset Password</h1>
        <form className="space-y-6" onSubmit={handleResetPassword}>
          {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">NEW PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-xs font-medium focus:bg-white focus:border-black transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>

      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black text-white p-6 rounded-3xl shadow-2xl z-[200] animate-in slide-in-from-bottom-4 duration-500 border border-white/10">
           <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-500 text-white rounded-xl"><Info size={20} /></div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">System Message</p>
                <p className="text-[11px] font-medium leading-relaxed opacity-70">{notification}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={16} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;
