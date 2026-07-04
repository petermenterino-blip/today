import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Plus, Trash2, GripVertical, Link, Download } from 'lucide-react';
import { NetworkEvent, EventType, AgendaItem, EventSpeaker, EventFile } from '../../types';
import { usePrograms } from '../../hooks/usePrograms';

const EVENT_TYPES: EventType[] = ['Workshop', 'Webinar', 'Bootcamp', 'AMA Session', 'Group Mentoring', 'Networking Event', 'Office Hours', 'Interview Session', 'Career Talk', 'Alumni Talk', 'Live Coding', 'Mock Interview', 'Hackathon', 'Assessment', 'Guest Lecture', 'Community Meetup'];

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'America/Halifax', 'America/Phoenix', 'America/Toronto', 'America/Vancouver',
  'Pacific/Honolulu', 'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Guam',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen', 'Europe/Zurich',
  'Europe/Moscow', 'Europe/Istanbul', 'Europe/Dublin', 'Europe/Lisbon', 'Europe/Prague',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul',
  'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Bangkok', 'Asia/Kuala_Lumpur', 'Asia/Manila',
  'Asia/Jakarta', 'Asia/Karachi', 'Asia/Dhaka', 'Asia/Colombo', 'Asia/Kathmandu',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Brisbane',
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'America/Mexico_City', 'America/Bogota',
  'America/Santiago', 'America/Lima', 'America/Caracas', 'America/Puerto_Rico',
];

const MEETING_PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Offline', 'Other'];

const PLATFORM_LINK_GENERATORS: Record<string, string> = {
  Zoom: 'https://zoom.us/j/',
  'Google Meet': 'https://meet.google.com/',
  'Microsoft Teams': 'https://teams.microsoft.com/l/meetup-join/',
};

const FILE_TYPES: { value: EventFile['type']; label: string }[] = [
  { value: 'slides', label: 'Slides' },
  { value: 'pdf', label: 'PDF' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'resource', label: 'Resource' },
  { value: 'video', label: 'Video' },
  { value: 'template', label: 'Template' },
  { value: 'github', label: 'GitHub' },
  { value: 'figma', label: 'Figma' },
  { value: 'googledrive', label: 'Google Drive' },
];

const FORM_TYPE_OPTIONS = [
  { value: 'registration', label: 'Registration Form' },
  { value: 'feedback', label: 'Feedback Form' },
  { value: 'assessment', label: 'Assessment Form' },
  { value: 'survey', label: 'Survey Form' },
];

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<NetworkEvent>) => Promise<void>;
  editingEvent?: NetworkEvent | null;
  isSaving?: boolean;
  currentUserName?: string;
}

const EventCreateModal: React.FC<EventCreateModalProps> = ({ isOpen, onClose, onSave, editingEvent, isSaving, currentUserName }) => {
  const [form, setForm] = useState<Partial<NetworkEvent>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [speakers, setSpeakers] = useState<Partial<EventSpeaker>[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<Partial<EventFile>[]>([]);
  const [attachedFormIds, setAttachedFormIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('basic');

  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<EventFile['type']>('resource');
  const [newFileUrl, setNewFileUrl] = useState('');

  const [selectedFormType, setSelectedFormType] = useState('registration');

  const { programs } = usePrograms();

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title || '',
        description: editingEvent.description || '',
        eventType: editingEvent.eventType || editingEvent.category || 'Workshop',
        date: editingEvent.date || '',
        time: editingEvent.time || '',
        endTime: editingEvent.endTime || '',
        timezone: editingEvent.timezone || 'America/New_York',
        location: editingEvent.location || 'Zoom',
        meetingPlatform: editingEvent.meetingPlatform || '',
        meetingLink: editingEvent.meetingLink || '',
        venue: editingEvent.venue || '',
        image: editingEvent.image || '',
        coverImage: editingEvent.coverImage || '',
        capacity: editingEvent.capacity || 50,
        registrationDeadline: editingEvent.registrationDeadline || '',
        speaker: editingEvent.speaker || '',
        visibility: editingEvent.visibility || 'public',
        status: editingEvent.status || 'published',
        tags: editingEvent.tags || '',
        duration: editingEvent.duration || '',
        waitlistLimit: editingEvent.waitlistLimit || 0,
        resourceFiles: editingEvent.resourceFiles || '',
        requirements: editingEvent.requirements || '',
        eventColor: editingEvent.eventColor || '#6366f1',
        programId: editingEvent.programId || '',
        featured: editingEvent.featured || false,
        notes: editingEvent.notes || '',
        allowRegistrationApproval: editingEvent.allowRegistrationApproval || false,
        reminderSettings: editingEvent.reminderSettings || { '24h': false, '1h': false },
      });
      setAgendaItems(editingEvent.agenda || []);
      setSpeakers(editingEvent.speakers || []);
      setAttachedFiles(editingEvent.files || []);
      setAttachedFormIds(editingEvent.formIds || []);
    } else {
      resetForm();
    }
  }, [editingEvent, isOpen]);

  const resetForm = () => {
    setForm({
      title: '', description: '', eventType: 'Workshop', date: '',
      time: '', endTime: '', timezone: 'America/New_York', location: 'Zoom',
      meetingPlatform: '', meetingLink: '', venue: '', image: '', coverImage: '',
      capacity: 50, registrationDeadline: '', speaker: currentUserName || '',
      visibility: 'public', status: 'published', tags: '', duration: '',
      waitlistLimit: 0, resourceFiles: '', requirements: '', eventColor: '#6366f1',
      programId: '', featured: false, notes: '', allowRegistrationApproval: false,
      reminderSettings: { '24h': false, '1h': false },
    });
    setAgendaItems([]);
    setSpeakers([]);
    setAttachedFiles([]);
    setAttachedFormIds([]);
    setNewFileName('');
    setNewFileType('resource');
    setNewFileUrl('');
    setSelectedFormType('registration');
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.description?.trim()) errs.description = 'Description is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.time) errs.time = 'Time is required';
    if (!form.location) errs.location = 'Location/Platform is required';
    if (form.capacity !== undefined && form.capacity < 0) errs.capacity = 'Capacity cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await onSave({
      ...form,
      agenda: agendaItems.length > 0 ? agendaItems : undefined,
      speakers: speakers.length > 0 ? speakers : undefined,
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
      formIds: attachedFormIds.length > 0 ? attachedFormIds : undefined,
      eventType: form.eventType,
      category: form.eventType,
    });
  };

  const handleGenerateLink = () => {
    if (form.location && form.location !== 'Offline' && form.location !== 'Other') {
      const base = PLATFORM_LINK_GENERATORS[form.location];
      if (base) {
        const id = crypto.randomUUID().slice(0, 8);
        setForm(prev => ({ ...prev, meetingLink: `${base}${id}`, meetingPlatform: form.location }));
      }
    }
  };

  const addAgendaItem = () => {
    setAgendaItems(prev => [...prev, { time: '', title: '', description: '', speaker: '' }]);
  };

  const removeAgendaItem = (idx: number) => {
    setAgendaItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateAgendaItem = (idx: number, field: keyof AgendaItem, value: string) => {
    setAgendaItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addSpeaker = () => {
    setSpeakers(prev => [...prev, { name: '', title: '', bio: '', company: '', linkedinUrl: '', avatarUrl: '' }]);
  };

  const removeSpeaker = (idx: number) => {
    setSpeakers(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSpeaker = (idx: number, field: string, value: string) => {
    setSpeakers(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleAddFile = () => {
    if (!newFileName.trim() || !newFileUrl.trim()) return;
    setAttachedFiles(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newFileName.trim(),
      type: newFileType,
      url: newFileUrl.trim(),
      uploadedAt: new Date().toISOString(),
    }]);
    setNewFileName('');
    setNewFileUrl('');
    setNewFileType('resource');
  };

  const handleRemoveFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddForm = () => {
    if (attachedFormIds.includes(selectedFormType)) return;
    setAttachedFormIds(prev => [...prev, selectedFormType]);
  };

  const handleRemoveForm = (id: string) => {
    setAttachedFormIds(prev => prev.filter(fid => fid !== id));
  };

  const toggleReminder = (key: '24h' | '1h') => {
    setForm(prev => ({
      ...prev,
      reminderSettings: {
        ...(prev.reminderSettings || {}),
        [key]: !((prev.reminderSettings as any)?.[key]),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[40px] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
      >
        <div className="shrink-0 px-10 pt-10 pb-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{editingEvent ? 'Modify event details' : 'Schedule a new workshop or event'}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-1 mt-6 bg-slate-50 rounded-2xl p-1 overflow-x-auto">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'schedule', label: 'Schedule' },
              { id: 'details', label: 'Details' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'speakers', label: 'Speakers' },
              { id: 'files', label: 'Files & Resources' },
              { id: 'forms', label: 'Forms' },
              { id: 'registration', label: 'Registration' },
              { id: 'tags', label: 'Tags & Notes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex-1 py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  currentTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          {/* BASIC INFO */}
          {currentTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Title *</label>
                  <input type="text" placeholder="e.g. UX Design Portfolio Review Workshop" value={form.title || ''} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.title ? 'border-red-400' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                  {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.title}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description *</label>
                  <textarea rows={4} placeholder="Provide details about the event, what students will learn, etc." value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.description ? 'border-red-400' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all resize-none`} />
                  {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Type *</label>
                  <select value={form.eventType || 'Workshop'} onChange={e => setForm(prev => ({ ...prev, eventType: e.target.value as EventType }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Banner Image URL</label>
                  <input type="text" placeholder="https://images.unsplash.com/..." value={form.image || ''} onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                  {form.image && <img src={form.image} alt="" className="mt-2 h-24 w-full object-cover rounded-2xl border border-slate-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program</label>
                  <select value={form.programId || ''} onChange={e => setForm(prev => ({ ...prev, programId: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                    <option value="">No Program</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE */}
          {currentTab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date *</label>
                <input type="date" value={form.date || ''} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.date ? 'border-red-400' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                {errors.date && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Start Time *</label>
                <input type="time" value={form.time || ''} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                  className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.time ? 'border-red-400' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                {errors.time && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.time}</p>}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">End Time</label>
                <input type="time" value={form.endTime || ''} onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Timezone</label>
                <select value={form.timezone || 'America/New_York'} onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Duration</label>
                <input type="text" placeholder="e.g. 90 minutes" value={form.duration || ''} onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Registration Deadline</label>
                <input type="date" value={form.registrationDeadline || ''} onChange={e => setForm(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
            </div>
          )}

          {/* DETAILS */}
          {currentTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Meeting Platform *</label>
                  <select value={form.location || 'Zoom'} onChange={e => setForm(prev => ({ ...prev, location: e.target.value, meetingPlatform: e.target.value === 'Offline' || e.target.value === 'Other' ? '' : e.target.value }))}
                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.location ? 'border-red-400' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`}>
                    {MEETING_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.location && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Meeting / Venue</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder={form.location === 'Offline' ? 'e.g. NYC Innovation Hub' : form.location === 'Other' ? 'Paste meeting link' : 'https://zoom.us/j/...'} value={form.location === 'Offline' ? (form.venue || '') : (form.meetingLink || '')}
                      onChange={e => {
                        if (form.location === 'Offline') setForm(prev => ({ ...prev, venue: e.target.value }));
                        else setForm(prev => ({ ...prev, meetingLink: e.target.value }));
                      }}
                      className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                    {form.location !== 'Offline' && form.location !== 'Other' && (
                      <button type="button" onClick={handleGenerateLink} className="px-4 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all shrink-0">
                        Generate
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Speaker / Host</label>
                  <input type="text" placeholder="e.g. Sarah Connor" value={form.speaker || ''} onChange={e => setForm(prev => ({ ...prev, speaker: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Capacity *</label>
                  <input type="number" min={0} value={form.capacity ?? 50} onChange={e => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Waitlist Limit</label>
                  <input type="number" min={0} value={form.waitlistLimit ?? 0} onChange={e => setForm(prev => ({ ...prev, waitlistLimit: parseInt(e.target.value) || 0 }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {currentTab === 'agenda' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Agenda</label>
                <button onClick={addAgendaItem} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5">
                  <Plus size={12} /> Add Item
                </button>
              </div>
              {agendaItems.length === 0 && (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[24px]">No agenda items added yet</p>
              )}
              <div className="space-y-3">
                {agendaItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-2 text-slate-300"><GripVertical size={14} /></div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input type="time" value={item.time} onChange={e => updateAgendaItem(idx, 'time', e.target.value)} placeholder="Time"
                          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                        <input type="text" value={item.title} onChange={e => updateAgendaItem(idx, 'title', e.target.value)} placeholder="Session title"
                          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                        <input type="text" value={item.speaker || ''} onChange={e => updateAgendaItem(idx, 'speaker', e.target.value)} placeholder="Speaker"
                          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                        <button onClick={() => removeAgendaItem(idx)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all self-start">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea value={item.description || ''} onChange={e => updateAgendaItem(idx, 'description', e.target.value)} placeholder="Description (optional)" rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all resize-none" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SPEAKERS */}
          {currentTab === 'speakers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Speakers</label>
                <button onClick={addSpeaker} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5">
                  <Plus size={12} /> Add Speaker
                </button>
              </div>
              {speakers.length === 0 && (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[24px]">No speakers added</p>
              )}
              <div className="space-y-3">
                {speakers.map((speaker, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Speaker {idx + 1}</span>
                      <button onClick={() => removeSpeaker(idx)} className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={13} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" placeholder="Full Name *" value={speaker.name || ''} onChange={e => updateSpeaker(idx, 'name', e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                      <input type="text" placeholder="Title / Role" value={speaker.title || ''} onChange={e => updateSpeaker(idx, 'title', e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                      <input type="text" placeholder="Company" value={speaker.company || ''} onChange={e => updateSpeaker(idx, 'company', e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                      <input type="url" placeholder="LinkedIn URL" value={speaker.linkedinUrl || ''} onChange={e => updateSpeaker(idx, 'linkedinUrl', e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                      <input type="url" placeholder="Avatar Image URL" value={speaker.avatarUrl || ''} onChange={e => updateSpeaker(idx, 'avatarUrl', e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                      <div className="md:col-span-2">
                        <textarea rows={2} placeholder="Short bio" value={speaker.bio || ''} onChange={e => updateSpeaker(idx, 'bio', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILES & RESOURCES */}
          {currentTab === 'files' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Add File / Resource</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="File name" value={newFileName} onChange={e => setNewFileName(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                  <select value={newFileType} onChange={e => setNewFileType(e.target.value as EventFile['type'])}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all">
                    {FILE_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                  </select>
                  <input type="url" placeholder="File URL" value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all" />
                  <button onClick={handleAddFile} disabled={!newFileName.trim() || !newFileUrl.trim()} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                    <Upload size={12} /> Upload
                  </button>
                </div>
              </div>
              {attachedFiles.length === 0 ? (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[24px]">No files attached yet</p>
              ) : (
                <div className="space-y-2">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{file.type}</p>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all">
                        <Download size={14} />
                      </a>
                      <button onClick={() => handleRemoveFile(idx)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FORMS */}
          {currentTab === 'forms' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Attach Form</label>
                <div className="flex gap-3">
                  <select value={selectedFormType} onChange={e => setSelectedFormType(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-black transition-all">
                    {FORM_TYPE_OPTIONS.map(fo => <option key={fo.value} value={fo.value}>{fo.label}</option>)}
                  </select>
                  <button onClick={handleAddForm} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5 shrink-0">
                    <Plus size={12} /> Attach
                  </button>
                </div>
              </div>
              {attachedFormIds.length === 0 ? (
                <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[24px]">No forms attached</p>
              ) : (
                <div className="space-y-2">
                  {attachedFormIds.map((fid) => {
                    const formOpt = FORM_TYPE_OPTIONS.find(fo => fo.value === fid);
                    return (
                      <div key={fid} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Link size={14} className="text-indigo-500" />
                          </div>
                          <span className="text-sm font-bold">{formOpt?.label || fid}</span>
                        </div>
                        <button onClick={() => handleRemoveForm(fid)} className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REGISTRATION & VISIBILITY */}
          {currentTab === 'registration' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Visibility</label>
                  <select value={form.visibility || 'public'} onChange={e => setForm(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                    <option value="public">Public - Visible to all students</option>
                    <option value="private">Private - Visible to assigned students only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status</label>
                  <select value={form.status || 'published'} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.featured || false} onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Featured Event</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.allowRegistrationApproval || false} onChange={e => setForm(prev => ({ ...prev, allowRegistrationApproval: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Require Approval</span>
                </label>
              </div>
              <div className="pt-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Reminder Settings</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={(form.reminderSettings as any)?.['24h'] || false} onChange={() => toggleReminder('24h')}
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">24 hours before</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={(form.reminderSettings as any)?.['1h'] || false} onChange={() => toggleReminder('1h')}
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">1 hour before</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAGS & NOTES */}
          {currentTab === 'tags' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tags (comma separated)</label>
                  <input type="text" placeholder="Portfolio, Resume, Interview" value={form.tags || ''} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Accent Color</label>
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <input type="color" className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" value={form.eventColor || '#6366f1'} onChange={e => setForm(prev => ({ ...prev, eventColor: e.target.value }))} />
                    <span className="text-xs font-mono font-bold uppercase">{form.eventColor || '#6366f1'}</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Requirements / Prerequisites</label>
                  <input type="text" placeholder="e.g. Basic understanding of Figma, completed Module 1" value={form.requirements || ''} onChange={e => setForm(prev => ({ ...prev, requirements: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Internal Notes</label>
                  <textarea rows={3} placeholder="Private notes only visible to mentors" value={form.notes || ''} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-black transition-all resize-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-10 py-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <button onClick={onClose} className="px-8 py-3.5 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-3.5 bg-brand-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EventCreateModal;
