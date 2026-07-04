import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Calendar, MapPin, Sparkles, Trash2, Image as ImageIcon, Upload, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGallery } from '../hooks/useGallery';
import { GalleryItem, GalleryCategory } from '../interfaces/gallery.interface';
import { galleryService } from '../services/galleryService';
import { VisitorHeader } from '../components/shared/VisitorHeader';
import Footer from '../components/shared/Footer';
import { notifySuccess, notifyError } from '../utils/toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const GalleryPage: React.FC = () => {
  const { role, user } = useAuth();
  const isMentor = role === 'mentor';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, loading, addItem, updateItem, deleteItem, incrementView } = useGallery({ visibility: 'published' });

  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory | 'All'>('All');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GalleryCategory>('Careers');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<string | null>(null);

  const categories: (GalleryCategory | 'All')[] = ['All', 'Careers', 'Academic', 'Ceremonies', 'Virtual'];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(item => item.category === selectedCategory);

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('Careers');
    setNewDate('');
    setNewLocation('');
    setNewDesc('');
    setNewImage('');
    setEditingItem(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notifyError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const url = await galleryService.uploadImage(user?.id || 'anonymous', file);
      setNewImage(url);
      notifySuccess('Image uploaded');
    } catch {
      notifyError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openAddForm = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditForm = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTitle(item.title);
    setNewCategory(item.category);
    setNewDate(item.event_date);
    setNewLocation(item.location);
    setNewDesc(item.description);
    setNewImage(item.image_url);
    setEditingItem(item);
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newLocation || !newDesc) {
      notifyError('Please fill in all details.');
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          title: newTitle,
          category: newCategory,
          event_date: newDate,
          location: newLocation,
          description: newDesc,
          image_url: newImage,
        });
        notifySuccess('Gallery event updated!');
      } else {
        await addItem({
          title: newTitle,
          category: newCategory,
          event_date: newDate,
          location: newLocation,
          description: newDesc,
          image_url: newImage,
          visibility: 'published',
        });
        notifySuccess('New gallery event photo successfully added!');
      }
      resetForm();
      setIsAddOpen(false);
    } catch {
      notifyError(editingItem ? 'Failed to update gallery event' : 'Failed to add gallery event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteEvent(id);
  };

  const executeDeleteItem = async () => {
    if (!confirmDeleteEvent) return;
    try {
      await deleteItem(confirmDeleteEvent);
      notifySuccess('Event deleted from the gallery.');
      if (selectedItem?.id === confirmDeleteEvent) {
        setSelectedItem(null);
      }
    } catch {
      notifyError('Failed to delete event');
    }
    setConfirmDeleteEvent(null);
  };

  return (
    <div className="bg-transparent font-['Inter'] antialiased min-h-screen flex flex-col pt-24 md:pt-32">
      <VisitorHeader />

      <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-indigo-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Journey In Photos</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none text-black">
              EVENT <span className="text-indigo-600 italic">GALLERY.</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">
              Explore past events, workshop lectures, Bootcamps, and certification milestones conducted by Peter Mannarino.
            </p>
          </div>

          {isMentor && (
            <button
              onClick={openAddForm}
              className="btn-normal bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-2 rounded-full self-start md:self-end"
            >
              <Plus size={16} />
              <span>Add Event Photo</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-12 border-b border-slate-100 pb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                selectedCategory === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-slate-100">
            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
            <ImageIcon size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-400 font-medium text-sm">No events found in this category.</p>
          </div>
        ) : (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => { setSelectedItem(item); incrementView(item.id); }}
                className="group bg-white border border-slate-100 rounded-[36px] overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                  <img
                    src={item.image_url || '/images/event-placeholder.svg'}
                    alt={item.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-black px-3.5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-black/5">
                    {item.category}
                  </div>

                  {isMentor && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={(e) => openEditForm(item, e)}
                        className="bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 p-2.5 rounded-full shadow-md border border-slate-100 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 p-2.5 rounded-full border border-red-100/30 transition-all"
                        title="Delete from Gallery"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.event_date}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} /> {item.location}</span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black transition-colors">
                    <span>View details</span>
                    <span>→</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col md:flex-row relative"
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>

              <div className="md:w-1/2 bg-slate-900 min-h-[300px] relative">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover min-h-[300px] md:h-full"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-6 left-6 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">
                  {selectedItem.category}
                </div>
              </div>

              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 pb-4">
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {selectedItem.event_date}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {selectedItem.location}</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 leading-snug">
                    {selectedItem.title}
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Coaching Trajectory</span>
                  </div>
                  <div className="flex gap-2">
                    {isMentor && (
                      <>
                        <button
                          onClick={(e) => { setSelectedItem(null); openEditForm(selectedItem, e as any); }}
                          className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-black"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] p-8 md:p-10 max-w-lg w-full relative shadow-2xl border border-slate-100"
            >
              <button
                onClick={() => { setIsAddOpen(false); resetForm(); }}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-black rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-black uppercase tracking-tight mb-6 text-black flex items-center gap-2">
                {editingItem ? <Edit2 size={24} className="text-indigo-600" /> : <Plus size={24} className="text-indigo-600" />}
                <span>{editingItem ? 'Edit Gallery Event' : 'Add Gallery Event'}</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cybersecurity Career Summit"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors text-black placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as GalleryCategory)}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors text-black"
                    >
                      <option value="Careers">Careers</option>
                      <option value="Academic">Academic</option>
                      <option value="Ceremonies">Ceremonies</option>
                      <option value="Virtual">Virtual</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</label>
                    <input
                      type="text"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      placeholder="e.g. June 2026"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors text-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Location</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Hoboken Innovation Lab"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Select Event Photo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {newImage && (
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden border-2 border-indigo-600">
                        <img src={newImage} className="w-full h-full object-cover" alt="" loading="lazy" />
                        <button
                          type="button"
                          onClick={() => setNewImage('')}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={`aspect-video rounded-lg border-2 border-dashed hover:border-indigo-500 bg-slate-50 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 ${newImage ? 'border-slate-300 w-24' : 'border-indigo-400 w-full max-w-[120px]'}`}
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={14} className="text-slate-400" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide a short description of the conducted event..."
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors text-black placeholder:text-slate-400 resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); resetForm(); }}
                    className="btn-normal bg-slate-100 text-slate-700 hover:bg-slate-200 flex-1 text-center justify-center flex"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-normal bg-black text-white hover:bg-slate-800 flex-1 text-center justify-center flex disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Gallery'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDeleteEvent}
        title="Delete Gallery Event"
        message="Are you sure you want to delete this event from the gallery?"
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={executeDeleteItem}
        onCancel={() => setConfirmDeleteEvent(null)}
      />

      <Footer />
    </div>
  );
};

export default GalleryPage;
