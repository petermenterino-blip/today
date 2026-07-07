import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  LogOut,
  Camera,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  Eye,
  EyeOff,
  Facebook,
  Github,
  FileText,
  Globe2,
  Palette,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { User } from '../../types';
import { notifyError, notifySuccess } from '../../utils/toast';
import { profileService } from '../../services/profileService';
import { socialLinksService, SocialLink } from '../../services/socialLinksService';
import { websiteSettingsService, WebsiteSettings } from '../../services/websiteSettingsService';
import { QK } from '../../constants/queryKeys';
import { useRealtimeData } from '../../hooks/useRealtimeData';

interface SettingsPageProps {
  onLogout: () => void;
  currentUser: any;
}

interface SocialLinkItem {
  id?: string;
  platform: string;
  url: string;
  enabled: boolean;
  sort_order: number;
}

const SOCIAL_PLATFORMS: { key: string; icon: any; color: string; placeholder: string; validate: (url: string) => boolean }[] = [
  { key: 'Instagram', icon: Instagram, color: 'text-pink-500', placeholder: 'https://instagram.com/your-profile', validate: (u) => !u || u.startsWith('https://instagram.com/') || u.startsWith('https://www.instagram.com/') },
  { key: 'Twitter', icon: Twitter, color: 'text-sky-500', placeholder: 'https://twitter.com/your-profile', validate: (u) => !u || u.startsWith('https://twitter.com/') || u.startsWith('https://x.com/') },
  { key: 'Linkedin', icon: Linkedin, color: 'text-blue-600', placeholder: 'https://linkedin.com/in/your-profile', validate: (u) => !u || u.startsWith('https://linkedin.com/') || u.startsWith('https://www.linkedin.com/') },
  { key: 'Youtube', icon: Youtube, color: 'text-red-500', placeholder: 'https://youtube.com/@your-channel', validate: (u) => !u || u.startsWith('https://youtube.com/') || u.startsWith('https://www.youtube.com/') },
  { key: 'Facebook', icon: Facebook, color: 'text-blue-600', placeholder: 'https://facebook.com/your-profile', validate: (u) => !u || u.startsWith('https://facebook.com/') || u.startsWith('https://www.facebook.com/') },
  { key: 'GitHub', icon: Github, color: 'text-gray-800', placeholder: 'https://github.com/your-username', validate: (u) => !u || u.startsWith('https://github.com/') },
  { key: 'Medium', icon: FileText, color: 'text-green-700', placeholder: 'https://medium.com/@your-username', validate: (u) => !u || u.startsWith('https://medium.com/') },
  { key: 'Website', icon: Globe2, color: 'text-indigo-600', placeholder: 'https://your-website.com', validate: (u) => !u || u.startsWith('https://') },
  { key: 'Behance', icon: Palette, color: 'text-blue-500', placeholder: 'https://behance.net/your-profile', validate: (u) => !u || u.startsWith('https://behance.net/') || u.startsWith('https://www.behance.net/') },
];

const FOOTER_PREVIEW_PLATFORMS = ['Instagram', 'Twitter', 'Linkedin', 'Youtube', 'Facebook', 'GitHub', 'Medium', 'Website', 'Behance'];

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Social Media Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([]);
  const [socialSaved, setSocialSaved] = useState(false);
  const [socialSaving, setSocialSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Website Settings
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSaved, setWsSaved] = useState(false);

  // Profile fields state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  // Messaging preferences
  const [readReceipts, setReadReceipts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [messageSound, setMessageSound] = useState(true);

  // AI features toggle
  const [aiEnabled, setAiEnabled] = useState(true);

  // Footer preview
  const [showFooterPreview, setShowFooterPreview] = useState(false);

  useRealtimeData([
    { table: 'social_links', queryKey: [QK.socialLinks] },
    { table: 'website_settings', queryKey: [QK.websiteSettings] },
  ]);

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.profile) {
      const prof = currentUser.profile;
      setName(prof.name || currentUser.name || '');
      setUsername(prof.last_name ? `${prof.first_name}${prof.last_name}`.toLowerCase() : prof.first_name || '');
      setEmail(prof.email || currentUser.email || '');
      setPhone(prof.phone_number || '');
      setBio(prof.bio || '');
      setCurrentUserAvatar(prof.avatar_url || '');
    }

    const loadAll = async () => {
      const profileRes = await profileService.getProfile(currentUser.id);
      if (profileRes.data) {
        const p = profileRes.data;
        if (p.first_name || p.last_name) setName(`${p.first_name || ''} ${p.last_name || ''}`.trim());
        if (p.email) setEmail(p.email);
        if (p.phone_number) setPhone(p.phone_number);
        if (p.bio) setBio(p.bio);
        if (p.avatar_url) setCurrentUserAvatar(p.avatar_url);
      }

      const res = await profileService.getProfileSettings(currentUser.id);
      if (res.data?.username) setUsername(res.data.username);
      if (res.data?.read_receipts !== undefined) setReadReceipts(res.data.read_receipts);
      if (res.data?.message_notifications !== undefined) setMessageNotifications(res.data.message_notifications);
      if (res.data?.message_sound !== undefined) setMessageSound(res.data.message_sound);
      if (res.data?.ai_enabled !== undefined) setAiEnabled(res.data.ai_enabled);

      const slRes = await socialLinksService.fetchAll();
      if (slRes.data && slRes.data.length > 0) {
        setSocialLinks(slRes.data.map(l => ({
          id: l.id,
          platform: l.platform,
          url: l.url,
          enabled: l.enabled,
          sort_order: l.sort_order,
        })));
      } else {
        setSocialLinks(SOCIAL_PLATFORMS.map((p, i) => ({
          platform: p.key,
          url: '',
          enabled: ['Instagram', 'Twitter', 'Linkedin', 'Youtube'].includes(p.key),
          sort_order: i + 1,
        })));
      }

      const wsRes = await websiteSettingsService.get();
      if (wsRes.data) {
        setWebsiteSettings(wsRes.data);
      }
    };
    loadAll();
  }, [currentUser]);

  const validateUrl = (platform: string, url: string): string | null => {
    if (!url.trim()) return null;
    const platformConfig = SOCIAL_PLATFORMS.find(p => p.key === platform);
    if (platformConfig && !platformConfig.validate(url)) {
      return `Must start with ${platformConfig.placeholder}`;
    }
    try {
      new URL(url);
      if (!url.startsWith('https://')) {
        return 'URL must use HTTPS';
      }
      return null;
    } catch {
      return 'Invalid URL format';
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notifyError('Image must be less than 10MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      const res = await profileService.uploadAvatar(currentUser.id, file);
      if (res.error) {
        notifyError(res.error);
      } else if (res.data) {
        setCurrentUserAvatar(res.data);
        await profileService.updateProfile(currentUser.id, { avatar_url: res.data } as any);
        window.dispatchEvent(new Event('user-avatar-changed'));
        notifySuccess('Profile photo updated successfully!');
      }
    } catch (err: any) {
      notifyError(err?.message || 'Error uploading avatar.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const nameParts = name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const res = await profileService.updateProfile(currentUser.id, {
        first_name,
        last_name,
        email,
        phone_number: phone,
        bio,
      });

      if (res.error) {
        notifyError(res.error);
      } else {
        await profileService.updateProfileSettings(currentUser.id, {
          username,
          phone,
          bio,
          updated_at: new Date().toISOString()
        });

        window.dispatchEvent(new Event('user-profile-changed'));
        setShowSuccess(true);
        notifySuccess('Profile updated successfully!');
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err: any) {
      notifyError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    const errors: Record<string, string> = {};
    for (const sl of socialLinks) {
      const err = validateUrl(sl.platform, sl.url);
      if (err) errors[sl.platform] = err;
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      notifyError('Please fix the invalid URLs before saving.');
      return;
    }

    setSocialSaving(true);
    try {
      const { error } = await socialLinksService.save(socialLinks);
      if (error) {
        notifyError(error);
      } else {
        setSocialSaved(true);
        notifySuccess('Social media links saved!');
        setTimeout(() => setSocialSaved(false), 3000);
      }
    } catch {
      notifyError('Failed to save social links.');
    } finally {
      setSocialSaving(false);
    }
  };

  const handleSaveWebsiteSettings = async () => {
    if (!websiteSettings) return;
    setWsSaving(true);
    try {
      const { error } = await websiteSettingsService.update(websiteSettings);
      if (error) {
        notifyError(error);
      } else {
        setWsSaved(true);
        notifySuccess('Website settings saved!');
        setTimeout(() => setWsSaved(false), 3000);
      }
    } catch {
      notifyError('Failed to save website settings.');
    } finally {
      setWsSaving(false);
    }
  };

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : (currentUser?.name ? currentUser.name[0] : 'U');

  const enabledSocialLinks = socialLinks.filter(s => s.enabled && s.url);

  const getPlatformIcon = (platform: string) => {
    const p = SOCIAL_PLATFORMS.find(sp => sp.key === platform);
    return p?.icon;
  };

  const getPlatformColor = (platform: string) => {
    const p = SOCIAL_PLATFORMS.find(sp => sp.key === platform);
    return p?.color || 'text-slate-500';
  };

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8 sm:mb-12 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2">Settings.</h1>
        <p className="text-slate-400 font-black uppercase text-[8px] sm:text-[10px] tracking-[0.3em]">Workspace Management</p>
      </div>

      <div className="space-y-8 sm:space-y-12">
        {/* Profile Card */}
        <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
          <h3 className="text-xl font-black uppercase mb-10 text-center sm:text-left">Identity Profile</h3>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-12">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full relative group overflow-hidden cursor-pointer bg-slate-100 border border-slate-200/50 shadow-md flex items-center justify-center"
              title="Change Profile Photo"
            >
              {currentUserAvatar ? (
                <img
                  src={currentUserAvatar}
                  alt="My Profile"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-3xl font-black">
                  {initials}
                </div>
              )}

              {avatarLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <Camera size={18} className="text-white mb-1" />
                <span className="text-[8px] text-white font-bold uppercase tracking-wider">Change Photo</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  type="text"
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio / About</label>
              <textarea
                rows={4}
                className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            {showSuccess ? (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-in zoom-in">
                <CheckCircle2 size={16} /> Verified & Saved
              </div>
            ) : <div />}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
            >
              {isSaving ? 'Processing...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Social Media Links Section */}
        {currentUser?.role === 'mentor' && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Globe size={20} className="text-indigo-600" />
              <h3 className="text-xl font-black uppercase text-slate-900">Social Media Links</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-10 leading-relaxed">
              Manage your social media links displayed in the website footer. Toggle each link on/off and edit the URLs.
            </p>

            <div className="space-y-4">
              {socialLinks.map((sl, idx) => {
                const platform = SOCIAL_PLATFORMS.find(p => p.key === sl.platform);
                const PlatformIcon = platform?.icon;
                const err = validationErrors[sl.platform];
                return (
                  <div key={sl.platform} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${platform?.color || 'text-slate-500'}`}>
                      {PlatformIcon && <PlatformIcon size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{sl.platform}</p>
                      <input
                        type="url"
                        value={sl.url}
                        onChange={(e) => {
                          const updated = [...socialLinks];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          setSocialLinks(updated);
                          if (validationErrors[sl.platform]) {
                            const newErrors = { ...validationErrors };
                            delete newErrors[sl.platform];
                            setValidationErrors(newErrors);
                          }
                        }}
                        placeholder={platform?.placeholder || `https://${sl.platform.toLowerCase()}.com/...`}
                        className={`w-full px-4 py-2.5 bg-white border rounded-2xl text-xs font-medium outline-none transition-all placeholder:text-slate-400 ${
                          err ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {err && <p className="text-[9px] text-red-500 mt-1 font-medium">{err}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...socialLinks];
                        updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                        setSocialLinks(updated);
                      }}
                      className={`p-3 rounded-2xl border transition-all shrink-0 ${
                        sl.enabled
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      title={sl.enabled ? 'Visible on website' : 'Hidden on website'}
                    >
                      {sl.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSocialLinks}
                disabled={socialSaving}
                className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
              >
                {socialSaving ? 'Saving...' : socialSaved ? 'Saved!' : 'Save Social Links'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Preview */}
        {currentUser?.role === 'mentor' && enabledSocialLinks.length > 0 && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Eye size={20} className="text-indigo-600" />
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase text-slate-900">Website Footer Preview</h3>
                <p className="text-slate-500 text-xs font-medium mt-1">How visitors will see your social links on the website footer</p>
              </div>
              <button
                onClick={() => setShowFooterPreview(!showFooterPreview)}
                className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                  showFooterPreview ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {showFooterPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {showFooterPreview && (
              <div className="bg-slate-900 rounded-[32px] p-8 animate-in fade-in duration-300">
                {/* Simulated Footer Preview */}
                <div className="border-b border-white/10 pb-8 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-xs font-black italic">M</div>
                    <span className="text-lg font-black uppercase tracking-tighter text-white">{websiteSettings?.site_name || 'Mentorino'}.</span>
                  </div>
                  <p className="text-slate-400 text-xs font-medium max-w-xs">
                    {websiteSettings?.footer_text || 'We build the trajectory you were meant to follow.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {enabledSocialLinks.map((sl) => {
                    const Icon = getPlatformIcon(sl.platform);
                    return (
                      <a
                        key={sl.platform}
                        href={sl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all"
                      >
                        {Icon && <Icon size={16} />}
                      </a>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 mt-8 pt-8 text-center">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {websiteSettings?.copyright || '© 2026 MEntorino ALL RIGHTS RESERVED'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Website Settings */}
        {currentUser?.role === 'mentor' && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Globe2 size={20} className="text-indigo-600" />
              <h3 className="text-xl font-black uppercase text-slate-900">Website Settings</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-10 leading-relaxed">
              Configure your public website branding, contact information, and footer content.
            </p>

            {websiteSettings ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Name</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                      value={websiteSettings.site_name}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, site_name: e.target.value })}
                      placeholder="Mentorino"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tagline</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                      value={websiteSettings.tagline}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, tagline: e.target.value })}
                      placeholder="Clarity in career, schooling, and life."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="email"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                        value={websiteSettings.contact_email}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, contact_email: e.target.value })}
                        placeholder="contact@mentorino.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                        value={websiteSettings.contact_phone}
                        onChange={(e) => setWebsiteSettings({ ...websiteSettings, contact_phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-4" />
                    <textarea
                      rows={2}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all resize-none"
                      value={websiteSettings.address}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, address: e.target.value })}
                      placeholder="123 Main Street, City, State"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Footer Text</label>
                  <textarea
                    rows={2}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all resize-none"
                    value={websiteSettings.footer_text}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, footer_text: e.target.value })}
                    placeholder="We build the trajectory you were meant to follow."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Copyright Text</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-black transition-all"
                    value={websiteSettings.copyright}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, copyright: e.target.value })}
                    placeholder="© 2026 MEntorino ALL RIGHTS RESERVED"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveWebsiteSettings}
                    disabled={wsSaving}
                    className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
                  >
                    {wsSaving ? 'Saving...' : wsSaved ? 'Saved!' : 'Save Website Settings'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>
        )}

        {/* AI Features */}
        {currentUser?.role === 'mentor' && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
            <h3 className="text-xl font-black uppercase mb-8 text-center sm:text-left">AI Features</h3>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
              Enable or disable AI-powered features across your mentor dashboard.
            </p>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">AI Mentor Assistant</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Show AI chat, insights, and the dedicated AI tab</p>
                </div>
                <button
                  onClick={() => {
                    const next = !aiEnabled;
                    setAiEnabled(next);
                    profileService.updateProfileSettings(currentUser.id, { ai_enabled: next });
                    window.dispatchEvent(new CustomEvent('ai-enabled-changed', { detail: { aiEnabled: next } }));
                  }}
                  className={`w-12 h-7 rounded-full transition-all relative ${aiEnabled ? 'bg-[#00a884]' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${aiEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messaging Preferences */}
        <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
          <h3 className="text-xl font-black uppercase mb-8 text-center sm:text-left">Messaging Preferences</h3>
          <div className="space-y-6">
            {[
              { key: 'read_receipts', label: 'Read Receipts', desc: 'Let others see when you\'ve read their messages', val: readReceipts, set: setReadReceipts },
              { key: 'message_notifications', label: 'Push Notifications', desc: 'Get notified when you receive a new message', val: messageNotifications, set: setMessageNotifications },
              { key: 'message_sound', label: 'Message Sound', desc: 'Play a sound when a new message arrives', val: messageSound, set: setMessageSound },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !item.val;
                    item.set(next);
                    profileService.updateProfileSettings(currentUser.id, { [item.key]: next });
                  }}
                  className={`w-12 h-7 rounded-full transition-all relative ${item.val ? 'bg-[#00a884]' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-all ${item.val ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logout Section */}
        <div className="flex justify-center pt-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-8 py-5 rounded-full text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all border border-red-100/50 shadow-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
