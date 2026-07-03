import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2, User } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storageService';
import { notifySuccess, notifyError } from '../../utils/toast';

interface StudentEditProfileProps {
  currentUser: any;
}

const StudentEditProfile: React.FC<StudentEditProfileProps> = ({ currentUser }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    bio: '',
    linkedin_url: '',
    discipline: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await profileService.getProfile(currentUser.id);
      if (res?.data) {
        setForm(prev => ({
          ...prev,
          ...res.data,
        }));
      }
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        setAvatarUploading(true);
        avatarUrl = await storageService.uploadAvatar(currentUser.id, avatarFile);
        setAvatarUploading(false);
      }
      await profileService.updateProfile(currentUser.id, {
        ...form,
        avatar_url: avatarUrl,
      } as any);
      notifySuccess('Profile updated successfully');
    } catch {
      notifyError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Edit Profile</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Update your personal information</p>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-slate-300" />
            )}
          </div>
          <label className="cursor-pointer px-5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
            {avatarUploading ? 'Uploading...' : 'Change Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">First Name</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.first_name} onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Last Name</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.last_name} onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</label>
            <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</label>
            <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.phone_number} onChange={e => setForm(prev => ({ ...prev, phone_number: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bio</label>
            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none" value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">LinkedIn URL</label>
            <input type="url" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.linkedin_url} onChange={e => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Discipline</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={form.discipline} onChange={e => setForm(prev => ({ ...prev, discipline: e.target.value }))} />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEditProfile;
