import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import type { SchedulerSettings, CalendarTag } from './calendarUtils';
import { DEFAULT_TAGS } from './calendarUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchedulerSettings;
  onSave: (settings: SchedulerSettings) => void;
  timezones: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  timezones,
}) => {
  const [workingDays, setWorkingDays] = useState<string[]>(settings.workingDays);
  const [hoursStart, setHoursStart] = useState(settings.workingHoursStart);
  const [hoursEnd, setHoursEnd] = useState(settings.workingHoursEnd);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [duration, setDuration] = useState(settings.defaultDuration);
  const [platform, setPlatform] = useState(settings.defaultPlatform);
  const [buffer, setBuffer] = useState(settings.bufferBetweenSessions);
  const [autoMeet, setAutoMeet] = useState(settings.autoMeetLink);
  const [autoZoom, setAutoZoom] = useState(settings.autoZoomLink);
  const [autoRecording, setAutoRecording] = useState(settings.autoRecording ?? false);
  const [weekendAvailable, setWeekendAvailable] = useState(settings.weekendAvailable ?? false);
  const [sync, setSync] = useState(settings.calendarSync);
  const [tags, setTags] = useState<CalendarTag[]>(settings.calendarTags || DEFAULT_TAGS);

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWorkingDays(settings.workingDays);
      setHoursStart(settings.workingHoursStart);
      setHoursEnd(settings.workingHoursEnd);
      setTimezone(settings.timezone);
      setDuration(settings.defaultDuration);
      setPlatform(settings.defaultPlatform);
      setBuffer(settings.bufferBetweenSessions);
      setAutoMeet(settings.autoMeetLink);
      setAutoZoom(settings.autoZoomLink);
      setAutoRecording(settings.autoRecording ?? false);
      setWeekendAvailable(settings.weekendAvailable ?? false);
      setSync(settings.calendarSync);
      setTags(settings.calendarTags || DEFAULT_TAGS);
    }
  }, [isOpen, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      workingDays,
      workingHoursStart: hoursStart,
      workingHoursEnd: hoursEnd,
      timezone,
      defaultDuration: duration,
      defaultPlatform: platform,
      bufferBetweenSessions: buffer,
      autoMeetLink: autoMeet,
      autoZoomLink: autoZoom,
      autoRecording,
      weekendAvailable,
      calendarSync: sync,
      calendarTags: tags,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-1.5">
                <Settings className="text-slate-600" size={20} />
                Scheduler Settings
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Configure global scheduling constraints</p>
            </div>
            <button onClick={onClose} className="p-2.5 bg-white hover:bg-slate-100 rounded-full transition-all border border-slate-100">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[480px] overflow-y-auto">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Working Days</p>
              <div className="flex flex-wrap gap-2">
                {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => {
                  const active = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setWorkingDays(prev => prev.filter(d => d !== day));
                        } else {
                          setWorkingDays(prev => [...prev, day]);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:text-black'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Hours Start Time</p>
                <input
                  type="time"
                  value={hoursStart}
                  onChange={(e) => setHoursStart(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Hours End Time</p>
                <input
                  type="time"
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Default Duration</p>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Buffer Between Sessions</p>
                <select
                  value={buffer}
                  onChange={(e) => setBuffer(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                >
                  <option value="0">No buffer</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Default Platform</p>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Timezone</p>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Calendar Tags</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide mb-3">Customize category names, colors, and visibility on the calendar.</p>

              <div className="space-y-2.5">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tag.visible}
                        onChange={() => {
                          setTags(prev => prev.map(t => t.id === tag.id ? { ...t, visible: !t.visible } : t));
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
                      />
                      {editingTagId === tag.id ? (
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-black max-w-[120px]"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-700">{tag.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={tag.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setTags(prev => prev.map(t => t.id === tag.id ? { ...t, color: newColor } : t));
                        }}
                        className="w-6 h-6 rounded-full border border-white cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                        style={{ WebkitAppearance: 'none' as any }}
                      />

                      {editingTagId === tag.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingTagName.trim()) {
                                setTags(prev => prev.map(t => t.id === tag.id ? { ...t, name: editingTagName.trim() } : t));
                              }
                              setEditingTagId(null);
                            }}
                            className="px-2.5 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTagId(null)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(tag.id);
                              setEditingTagName(tag.name);
                            }}
                            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg"
                            title="Edit Tag Name"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTags(prev => prev.filter(t => t.id !== tag.id));
                            }}
                            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg"
                            title="Delete Tag"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {isAddingTag ? (
                  <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tag Name (e.g. Brainstorm)"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                      />
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-8 h-8 rounded-xl border border-white cursor-pointer overflow-hidden p-0 bg-transparent flex-shrink-0"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTag(false);
                          setNewTagName('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newTagName.trim()) {
                            const newTag: CalendarTag = {
                              id: 'tag_' + Date.now(),
                              name: newTagName.trim(),
                              color: newTagColor,
                              visible: true,
                            };
                            setTags(prev => [...prev, newTag]);
                            setNewTagName('');
                            setIsAddingTag(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="w-full py-2.5 border border-dashed border-slate-300 text-slate-500 hover:text-black hover:border-black rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add Custom Tag
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Weekend Availability</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Allow scheduling on Saturday & Sunday</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={weekendAvailable} onChange={(e) => setWeekendAvailable(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Auto-Record Sessions</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Enable auto-recording for all sessions</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={autoRecording} onChange={(e) => setAutoRecording(e.target.checked)} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Auto Generate Meet Link</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Generate Google Meet link for every session automatically</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMeet}
                    onChange={(e) => setAutoMeet(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Auto Generate Zoom Link</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Generate Zoom Video link for every session automatically</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoZoom}
                    onChange={(e) => setAutoZoom(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700">Calendar Sync</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Synchronize scheduled sessions back to Google Calendar</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sync}
                    onChange={(e) => setSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-black hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md"
              >
                <Check size={12} /> Save Settings
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
