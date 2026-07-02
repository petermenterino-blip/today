import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Calendar, MapPin, Sparkles, Trash2, Image as ImageIcon, Edit2, ExternalLink, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../../utils/toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: 'Careers' | 'Academic' | 'Ceremonies' | 'Virtual';
  date: string;
  location: string;
  description: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'g-1',
    title: "Career Counselling Session",
    image: "/images/event-1.jpeg",
    category: "Careers",
    date: "May 2026",
    location: "Hoboken Tech Labs",
    description: "One-on-one career counselling sessions guiding students through certification pathways, resume strategy, and professional growth planning."
  },
  {
    id: 'g-4',
    title: "Student Professional Presence Event",
    image: "/images/event-4.jpg",
    category: "Academic",
    date: "March 2026",
    location: "Jersey City Incubator",
    description: "Former alumni serving as Lead Security Operations managers and Cloud Architects shared raw career advice."
  }
];

const PRESET_IMAGES = [
  "/images/event-1.jpeg",
  "/images/event-2.jpeg",
  "/images/event-3.jpeg",
  "/images/event-4.jpg",
];

const UPLOADED_IMAGES_KEY = 'gallery_uploaded_images';
const HIDDEN_PRESETS_KEY = 'gallery_hidden_presets';

const GalleryManagement: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GalleryItem['category']>('Careers');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState(PRESET_IMAGES[0]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hiddenPresets, setHiddenPresets] = useState<number[]>([]);
  const [confirmDeleteUpload, setConfirmDeleteUpload] = useState<number | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gallery_items_v1');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      localStorage.setItem('gallery_items_v1', JSON.stringify(DEFAULT_GALLERY));
      setItems(DEFAULT_GALLERY);
    }
    const savedUploads = localStorage.getItem(UPLOADED_IMAGES_KEY);
    if (savedUploads) {
      setUploadedImages(JSON.parse(savedUploads));
    }
    const savedHidden = localStorage.getItem(HIDDEN_PRESETS_KEY);
    if (savedHidden) {
      setHiddenPresets(JSON.parse(savedHidden));
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      notifyError('Please select an image file (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Image must be under 5MB');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = [...uploadedImages, dataUrl];
      setUploadedImages(updated);
      localStorage.setItem(UPLOADED_IMAGES_KEY, JSON.stringify(updated));
      setNewImage(dataUrl);
      setUploading(false);
      notifySuccess('Image uploaded');
    };
    reader.onerror = () => {
      notifyError('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteUploadedImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteUpload(index);
  };

  const executeDeleteUpload = () => {
    if (confirmDeleteUpload === null) return;
    const updated = uploadedImages.filter((_, i) => i !== confirmDeleteUpload);
    setUploadedImages(updated);
    localStorage.setItem(UPLOADED_IMAGES_KEY, JSON.stringify(updated));
    if (newImage === uploadedImages[confirmDeleteUpload]) {
      setNewImage(PRESET_IMAGES[0]);
    }
    notifySuccess('Image deleted');
    setConfirmDeleteUpload(null);
  };

  const handleHidePreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...hiddenPresets, index];
    setHiddenPresets(updated);
    localStorage.setItem(HIDDEN_PRESETS_KEY, JSON.stringify(updated));
    if (newImage === PRESET_IMAGES[index]) {
      const remaining = PRESET_IMAGES.filter((_, i) => !updated.includes(i));
      setNewImage(remaining[0] || (uploadedImages.length > 0 ? uploadedImages[0] : ''));
    }
  };

  const visiblePresets = PRESET_IMAGES.filter((_, i) => !hiddenPresets.includes(i));

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('Careers');
    setNewDate('');
    setNewLocation('');
    setNewDesc('');
    setNewImage(PRESET_IMAGES[0]);
    setEditingItem(null);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTitle(item.title);
    setNewCategory(item.category);
    setNewDate(item.date);
    setNewLocation(item.location);
    setNewDesc(item.description);
    setNewImage(item.image);
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newLocation || !newDesc) {
      notifyError('Please fill in all details.');
      return;
    }

    if (editingItem) {
      const updated = items.map(i =>
        i.id === editingItem.id
          ? { ...i, title: newTitle, category: newCategory, date: newDate, location: newLocation, description: newDesc, image: newImage }
          : i
      );
      setItems(updated);
      localStorage.setItem('gallery_items_v1', JSON.stringify(updated));
      notifySuccess('Gallery event updated!');
    } else {
      const newItem: GalleryItem = {
        id: 'g-' + Date.now(),
        title: newTitle,
        image: newImage,
        category: newCategory,
        date: newDate,
        location: newLocation,
        description: newDesc
      };
      const updated = [newItem, ...items];
      setItems(updated);
      localStorage.setItem('gallery_items_v1', JSON.stringify(updated));
      notifySuccess('New gallery event added!');
    }

    resetForm();
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteEvent(id);
  };

  const executeDelete = () => {
    if (!confirmDeleteEvent) return;
    const updated = items.filter(i => i.id !== confirmDeleteEvent);
    setItems(updated);
    localStorage.setItem('gallery_items_v1', JSON.stringify(updated));
    notifySuccess('Event deleted.');
    if (selectedItem?.id === confirmDeleteEvent) setSelectedItem(null);
    setConfirmDeleteEvent(null);
  };

  const categories = ['All', 'Careers', 'Academic', 'Ceremonies', 'Virtual'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Event Gallery</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage photos and event entries shown on the public gallery page</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/gallery')}
            className="px-5 py-2.5 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-500 flex items-center justify-center gap-2"
          >
            <ExternalLink size={12} /> View Public Page
          </button>
          <button
            onClick={openAddForm}
            className="px-5 py-2.5 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Event Photo
          </button>
        </div>
      </div>

      {/* Categories filter */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
              selectedCategory === cat
                ? 'bg-black text-white border-black'
                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
          <ImageIcon size={48} className="mx-auto text-slate-300" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No events in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedItem(item)}
              className="group bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-black/5">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={(e) => openEditForm(item, e)}
                    className="bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 p-2 rounded-full shadow-md border border-slate-100 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 p-2 rounded-full shadow-md border border-slate-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {item.date}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} /> {item.location}</span>
                </div>
                <h4 className="text-base font-black uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 flex-1">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
              <div className="md:w-1/2 bg-slate-900 min-h-[250px]">
                <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-full object-cover min-h-[250px]" referrerPolicy="no-referrer" loading="lazy" />
                <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  {selectedItem.category}
                </div>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {selectedItem.date}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {selectedItem.location}</span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{selectedItem.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{selectedItem.description}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={(e) => { setSelectedItem(null); openEditForm(selectedItem, e as any); }}
                    className="flex-1 py-2.5 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all text-center"
                  >
                    <Edit2 size={12} className="inline mr-1.5" /> Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedItem.id, e)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-center"
                  >
                    <Trash2 size={12} className="inline mr-1.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-lg w-full relative shadow-2xl border border-slate-100"
            >
              <button
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="absolute top-5 right-5 w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-black rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-black uppercase tracking-tight mb-6 text-black flex items-center gap-2">
                <Plus size={22} className="text-indigo-600" />
                <span>{editingItem ? 'Edit Event' : 'Add Gallery Event'}</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Title</label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Cybersecurity Career Summit"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as GalleryItem['category'])}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors"
                    >
                      <option value="Careers">Careers</option>
                      <option value="Academic">Academic</option>
                      <option value="Ceremonies">Ceremonies</option>
                      <option value="Virtual">Virtual</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date</label>
                    <input type="text" required value={newDate} onChange={e => setNewDate(e.target.value)}
                      placeholder="e.g. June 2026"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Location</label>
                  <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)}
                    placeholder="e.g. Hoboken Innovation Lab"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Photo</label>
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
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {visiblePresets.map((img, idx) => {
                      const realIdx = PRESET_IMAGES.indexOf(img);
                      return (
                        <div key={realIdx} className="relative">
                          <button type="button" onClick={() => setNewImage(img)}
                            className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              newImage === img ? 'border-indigo-600 scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" loading="lazy" />
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
                        className="aspect-video rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50 flex flex-col items-center justify-center gap-1 transition-all"
                        title="Restore removed presets"
                      >
                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-500 leading-tight text-center px-1">Restore</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
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
                  {uploadedImages.length > 0 && (
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Your Uploads</p>
                      <div className="grid grid-cols-4 gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <button
                              type="button"
                              onClick={() => setNewImage(img)}
                              className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                                newImage === img ? 'border-indigo-600 scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={img} className="w-full h-full object-cover" alt="Uploaded" loading="lazy" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteUploadedImage(idx, e)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="Delete image"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea required rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="Short description of the event..."
                    className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-medium focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }}
                    className="btn-normal bg-slate-100 text-slate-700 hover:bg-slate-200 flex-1 text-center justify-center flex"
                  >
                    Cancel
                  </button>
                  <button type="submit"
                    className="btn-normal bg-black text-white hover:bg-slate-800 flex-1 text-center justify-center flex"
                  >
                    {editingItem ? 'Save Changes' : 'Add to Gallery'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDeleteUpload !== null}
        title="Delete Uploaded Image"
        message="Delete this uploaded image permanently?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDeleteUpload}
        onCancel={() => setConfirmDeleteUpload(null)}
      />

      <ConfirmDialog
        open={!!confirmDeleteEvent}
        title="Delete Gallery Event"
        message="Delete this event from the gallery?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteEvent(null)}
      />
    </div>
  );
};

export default GalleryManagement;
