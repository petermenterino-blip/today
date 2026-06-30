import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { notifyError, notifySuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

const AuthPage: React.FC = () => {
  const { login, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      notifyError('Please enter your email address to reset your password.');
      return;
    }
    try {
      setIsLoading(true);
      await forgotPassword(email);
      notifySuccess('Password reset email sent successfully!');
    } catch (err: any) {
      notifyError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      notifySuccess('Signed in successfully!');
      navigate(user.role === 'mentor' ? '/mentor' : '/student');
    } catch (err: any) {
      notifyError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-black transition-colors text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft size={14} /> BACK
      </Link>



      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-lg font-black mx-auto mb-4 shadow-xl shadow-black/10">M</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 uppercase">
            SIGN IN
          </h1>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            WELCOME BACK TO MENTORINO WORKSPACE
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[40px] sm:rounded-[48px] border border-black/[0.03] shadow-2xl">
          <div className="bg-indigo-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-100 flex flex-col items-center text-center gap-1 sm:gap-2 mb-6">
            <p className="text-[8px] sm:text-[9px] font-black text-indigo-900 uppercase tracking-widest">INVITATION ONLY</p>
            <p className="text-[7px] sm:text-[8px] font-bold text-indigo-700/70 uppercase leading-relaxed tracking-wider">
              Accounts are created by invitation only. Submit an application first — if approved, you will receive your login credentials.
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleAuth}>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">EMAIL ADDRESS</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-[20px] text-xs font-medium text-center focus:bg-white focus:border-black transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">PASSWORD</label>
                <button type="button" onClick={handleForgotPassword} className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-black">FORGOT?</button>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-[20px] text-xs font-medium text-center focus:bg-white focus:border-black transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="btn-normal bg-black text-white w-full flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'SIGN IN'}
            </button>

            <div className="text-center">
              <Link to="/apply" className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-black transition-colors">
                DON'T HAVE AN ACCOUNT? APPLY HERE
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;