import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon, 
  CheckCircle2, 
  LogOut, 
  Camera, 
  Plus, 
  Sparkles, 
  MapPin, 
  Upload, 
  Image as ImageIcon,
  X,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../../types';
import { notifyError, notifySuccess } from '../../utils/toast';
import { profileService } from '../../services/profileService';

const DEFAULT_GALLERY = [
  {
    id: 'g-1',
    title: "CompTIA Certification Celebration",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    category: "Ceremonies",
    date: "May 2026",
    location: "Hoboken Tech Labs",
    description: "Celebrating our latest cohort graduating and passing their CompTIA A+ and Security+ exams. Five students obtained employment prior to graduation."
  },
  {
    id: 'g-2',
    title: "IT Career Trajectory Masterclass",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
    category: "Careers",
    date: "October 2025",
    location: "Manhattan Creative Hub",
    description: "Over 80 college students joined us for an intensive 1-day deep dive into CV engineering, LinkedIn optimization, and live technical mock interviews."
  },
  {
    id: 'g-3',
    title: "Hybrid Life Strategy Roundtable",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800",
    category: "Academic",
    date: "January 2026",
    location: "Virtual Campus",
    description: "An interactive, hybrid roundtable discussion focusing on overcoming career overthinking, dealing with academic pressures, and mastering the 3-Daily-Goals system."
  },
  {
    id: 'g-4',
    title: "Fireside Chat with Industry Leaders",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
    category: "Careers",
    date: "March 2026",
    location: "Jersey City Incubator",
    description: "Former alumni now serving as Lead Security Operations managers and Cloud Architects joined us to share raw, un-hyped advice on entering the job market today."
  }
];

const HIDDEN_PRESETS_KEY = 'gallery_hidden_presets';
const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800", // Team meeting
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800", // Workshop
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800", // Collaboration
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800", // Presentation
];

interface SettingsPageProps {
  onLogout: () => void;
  currentUser: any;
}

interface SocialLinkItem {
  platform: string;
  url: string;
  enabled: boolean;
}

const SOCIAL_PLATFORMS = [
  { key: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { key: 'Twitter', icon: Twitter, color: 'text-sky-500' },
  { key: 'Linkedin', icon: Linkedin, color: 'text-blue-600' },
  { key: 'Youtube', icon: Youtube, color: 'text-red-500' },
];

const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  { platform: 'Instagram', url: '', enabled: true },
  { platform: 'Twitter', url: '', enabled: true },
  { platform: 'Linkedin', url: '', enabled: true },
  { platform: 'Youtube', url: '', enabled: true },
];

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Social Media Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(DEFAULT_SOCIAL_LINKS);
  const [socialSaved, setSocialSaved] = useState(false);

  // Profile fields state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  // Load profile and settings on mount / user change
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

    const loadProfileAndSettings = async () => {
      // Load persisted profile data
      const profileRes = await profileService.getProfile(currentUser.id);
      if (profileRes.data) {
        const p = profileRes.data;
        if (p.first_name || p.last_name) setName(`${p.first_name || ''} ${p.last_name || ''}`.trim());
        if (p.email) setEmail(p.email);
        if (p.phone_number) setPhone(p.phone_number);
        if (p.bio) setBio(p.bio);
        if (p.avatar_url) setCurrentUserAvatar(p.avatar_url);
      }
      // Load additional settings
      const res = await profileService.getProfileSettings(currentUser.id);
      if (res.data) {
        if (res.data.username) setUsername(res.data.username);
      }
    };
    loadProfileAndSettings();

    const savedHidden = localStorage.getItem(HIDDEN_PRESETS_KEY);
    if (savedHidden) setHiddenPresets(JSON.parse(savedHidden));

    const savedSocial = localStorage.getItem('mentor_social_links');
    if (savedSocial) {
      try { setSocialLinks(JSON.parse(savedSocial)); } catch {}
    }
  }, [currentUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError("Image must be less than 5MB.");
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
        notifySuccess("Profile photo updated successfully!");
      }
    } catch (err: any) {
      notifyError("Error uploading avatar.");
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
        // Update profile settings
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

  // New Gallery Photo States (for Mentors)
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'Careers' | 'Academic' | 'Ceremonies' | 'Virtual'>('Careers');
  const [galleryDate, setGalleryDate] = useState('');
  const [galleryLocation, setGalleryLocation] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryImage, setGalleryImage] = useState(PRESET_IMAGES[0]);
  const [customGalleryImage, setCustomGalleryImage] = useState<string>('');
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [hiddenPresets, setHiddenPresets] = useState<number[]>([]);

  const handleGalleryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError("Please select an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      notifyError("Image must be less than 3MB.");
      return;
    }

    setIsGalleryUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomGalleryImage(result);
      setGalleryImage(result); // Use the custom uploaded image
      setIsGalleryUploading(false);
      notifySuccess("Event photo loaded successfully!");
    };
    reader.onerror = () => {
      setIsGalleryUploading(false);
      notifyError("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleHidePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = [...hiddenPresets, index];
    setHiddenPresets(updated);
    localStorage.setItem(HIDDEN_PRESETS_KEY, JSON.stringify(updated));
    if (galleryImage === PRESET_IMAGES[index]) {
      const remaining = PRESET_IMAGES.filter((_, i) => !updated.includes(i));
      setGalleryImage(remaining[0] || '');
      if (!remaining.length) setCustomGalleryImage(galleryImage);
    }
  };

  const visiblePresets = PRESET_IMAGES.filter((_, i) => !hiddenPresets.includes(i));

  const handleAddGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle.trim() || !galleryDate.trim() || !galleryLocation.trim() || !galleryDescription.trim()) {
      notifyError("Please fill in all event details.");
      return;
    }

    setIsAddingGallery(true);

    try {
      // Load current gallery items
      const saved = localStorage.getItem('gallery_items_v1');
      const currentItems = saved ? JSON.parse(saved) : DEFAULT_GALLERY;

      const newItem = {
        id: 'g-' + Date.now(),
        title: galleryTitle,
        image: galleryImage,
        category: galleryCategory,
        date: galleryDate,
        location: galleryLocation,
        description: galleryDescription
      };

      const updated = [newItem, ...currentItems];
      localStorage.setItem('gallery_items_v1', JSON.stringify(updated));
      notifySuccess("New event photo added to the gallery successfully!");

      // Reset form fields
      setGalleryTitle('');
      setGalleryCategory('Careers');
      setGalleryDate('');
      setGalleryLocation('');
      setGalleryDescription('');
      setGalleryImage(PRESET_IMAGES[0]);
      setCustomGalleryImage('');
    } catch (err) {
      console.error(err);
      notifyError("Failed to add photo to the gallery.");
    } finally {
      setIsAddingGallery(false);
    }
  };

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : (currentUser?.name ? currentUser.name[0] : 'U');

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
              accept="image/*"
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

              {/* Loading Spinner overlay */}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Change Photo hover overlay */}
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
              {/* Full Name */}
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

              {/* Username */}
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

              {/* Email */}
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

              {/* Phone Number */}
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

            {/* Bio/About */}
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

        {/* Gallery Photo Upload Form for Mentors */}
        {currentUser?.role === 'mentor' && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles size={20} className="text-indigo-600" />
              <h3 className="text-xl font-black uppercase text-slate-900">Add Photo to Event Gallery</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-10 leading-relaxed">
              Manually add showcase events, workshop sessions, or cohort celebration photos directly to the public event gallery.
            </p>

            <form onSubmit={handleAddGalleryItem} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Title */}
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-indigo-600 transition-all text-black" 
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="e.g. CompTIA Celebration Meetup"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-indigo-600 transition-all text-black"
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value as any)}
                  >
                    <option value="Careers">Careers</option>
                    <option value="Academic">Academic</option>
                    <option value="Ceremonies">Ceremonies</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-indigo-600 transition-all text-black" 
                    value={galleryDate}
                    onChange={(e) => setGalleryDate(e.target.value)}
                    placeholder="e.g. June 2026"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-indigo-600 transition-all text-black" 
                    value={galleryLocation}
                    onChange={(e) => setGalleryLocation(e.target.value)}
                    placeholder="e.g. Hoboken Tech Labs"
                  />
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium outline-none focus:border-indigo-600 transition-all resize-none text-black" 
                  value={galleryDescription}
                  onChange={(e) => setGalleryDescription(e.target.value)}
                  placeholder="Detail the key highlights, achievements, or milestones from this event..."
                />
              </div>

              {/* Choose Preset Image or Upload Photo */}
              <div className="space-y-4">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Choose Preset Photo or Upload a Custom Image</label>
                
                {/* File Upload Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <input 
                    type="file"
                    ref={galleryImageInputRef}
                    onChange={handleGalleryPhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryImageInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-black rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0"
                  >
                    <Upload size={14} className="text-slate-500" />
                    <span>Upload Custom Image</span>
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isGalleryUploading ? 'Processing upload...' : 'Supports PNG, JPG, or GIF up to 3MB.'}
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-2">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider ml-1">Preset Options</span>
                  <div className="grid grid-cols-4 gap-4">
                    {visiblePresets.map((img) => {
                      const realIdx = PRESET_IMAGES.indexOf(img);
                      return (
                        <div key={realIdx} className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryImage(img);
                              setCustomGalleryImage('');
                            }}
                            className={`w-full aspect-video rounded-2xl overflow-hidden border-2 transition-all ${
                              galleryImage === img && !customGalleryImage ? 'border-indigo-600 scale-[0.98] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={`Preset ${realIdx + 1}`} loading="lazy" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleHidePreset(realIdx, e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Remove preset"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      );
                    })}
                    {hiddenPresets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setHiddenPresets([]); localStorage.removeItem(HIDDEN_PRESETS_KEY); }}
                        className="aspect-video rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50 flex flex-col items-center justify-center gap-1 transition-all"
                        title="Show hidden presets again"
                      >
                        <span className="text-[7px] font-black uppercase tracking-widest text-blue-500 leading-tight text-center px-1">Show Hidden</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Image Preview */}
                {galleryImage && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 animate-in fade-in duration-300">
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      <img src={galleryImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Selected Preview" loading="lazy" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Current Photo Selection</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[250px] sm:max-w-md font-medium">
                        {customGalleryImage ? 'Custom Manual Photo Uploaded' : 'Preset Stock Option Selected'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="mt-12 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={isAddingGallery || isGalleryUploading}
                  className="w-full sm:w-auto px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                >
                  {isAddingGallery ? 'Adding to Gallery...' : 'Publish to Gallery'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Social Media Links Section (Mentors only) */}
        {currentUser?.role === 'mentor' && (
          <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-black/[0.03] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Globe size={20} className="text-indigo-600" />
              <h3 className="text-xl font-black uppercase text-slate-900">Social Media Links</h3>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-10 leading-relaxed">
              Manage your social media links displayed in the website footer. Toggle each link on/off and edit the URLs.
            </p>

            <div className="space-y-6">
              {socialLinks.map((sl, idx) => {
                const platform = SOCIAL_PLATFORMS.find(p => p.key === sl.platform);
                const PlatformIcon = platform?.icon;
                return (
                  <div key={sl.platform} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${platform?.color || 'text-slate-500'}`}>
                      {PlatformIcon && <PlatformIcon size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{sl.platform}</p>
                      <input
                        type="url"
                        value={sl.url}
                        onChange={(e) => {
                          const updated = [...socialLinks];
                          updated[idx].url = e.target.value;
                          setSocialLinks(updated);
                        }}
                        placeholder={`https://${sl.platform.toLowerCase()}.com/your-profile`}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 transition-all text-black placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...socialLinks];
                        updated[idx].enabled = !updated[idx].enabled;
                        setSocialLinks(updated);
                      }}
                      className={`p-3 rounded-2xl border transition-all ${
                        sl.enabled
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      title={sl.enabled ? 'Disable' : 'Enable'}
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
                onClick={() => {
                  localStorage.setItem('mentor_social_links', JSON.stringify(socialLinks));
                  setSocialSaved(true);
                  notifySuccess('Social media links saved!');
                  setTimeout(() => setSocialSaved(false), 3000);
                }}
                className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
              >
                {socialSaved ? 'Saved!' : 'Save Social Links'}
              </button>
            </div>
          </div>
        )}

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
