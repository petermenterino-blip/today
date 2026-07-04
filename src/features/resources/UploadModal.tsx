import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Upload, File, FileText, Image, Video, Music, FileArchive,
  Link2, Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2,
  Youtube, Github, Figma, Globe, BookOpen, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { notifySuccess, notifyError } from '../../utils/toast';
import type { UploadProgress, ResourceSourceType } from '../../types/resources';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (data: any) => Promise<void>;
  categories: { name: string; slug: string }[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed',
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  'text/plain', 'text/markdown', 'text/csv', 'application/json',
];

const sourceOptions: { value: ResourceSourceType; label: string; icon: React.ElementType }[] = [
  { value: 'upload', label: 'Upload File', icon: Upload },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'googledrive', label: 'Google Drive', icon: ExternalLink },
  { value: 'notion', label: 'Notion', icon: BookOpen },
  { value: 'figma', label: 'Figma', icon: Figma },
  { value: 'canva', label: 'Canva', icon: ExternalLink },
  { value: 'website', label: 'Website', icon: Globe },
];

function getFileTypeIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip')) return FileArchive;
  if (type.includes('word') || type.includes('document')) return FileText;
  if (type.includes('presentation') || type.includes('powerpoint')) return FileText;
  if (type.includes('sheet') || type.includes('excel')) return FileText;
  return File;
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'other';
  return ext;
}

const UploadModal: React.FC<UploadModalProps> = ({ open, onClose, onUpload, categories }) => {
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<ResourceSourceType>('upload');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [programIds, setProgramIds] = useState<string[]>([]);

  const reset = () => {
    setSourceType('upload');
    setTitle('');
    setDescription('');
    setCategory('');
    setTags('');
    setExternalUrl('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadStatus('idle');
    setErrorMsg('');
    setProgramIds([]);
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return 'File exceeds 100MB limit';
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      return `File type ${file.type} is not supported`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleBrowse = () => fileInputRef.current?.click();

  const handleUpload = async () => {
    if (!title.trim()) { setErrorMsg('Title is required'); return; }
    if (sourceType === 'upload' && !selectedFile) { setErrorMsg('Please select a file'); return; }
    if (sourceType !== 'upload' && !externalUrl.trim()) { setErrorMsg('URL is required'); return; }

    setIsUploading(true);
    setUploadStatus('uploading');
    setErrorMsg('');

    try {
      let filePath: string | null = null;
      let fileType: string | null = null;
      let fileSize = 0;

      if (sourceType === 'upload' && selectedFile) {
        setUploadProgress(20);
        const pathResult = await storageService.upload('mentor-resources', user?.id || '', selectedFile);
        setUploadProgress(80);
        filePath = pathResult;
        fileType = getExtension(selectedFile.name);
        fileSize = selectedFile.size;
      }

      setUploadProgress(90);

      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      await onUpload({
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        file_type: fileType,
        file_size: fileSize,
        file_path: filePath,
        source_type: sourceType === 'upload' && selectedFile ? 'upload' : sourceType,
        external_url: sourceType !== 'upload' ? externalUrl.trim() : null,
        tags: tagArray,
        program_ids: programIds,
        created_by: user?.id,
      });

      setUploadProgress(100);
      setUploadStatus('success');
      notifySuccess('Resource uploaded successfully');
      setTimeout(() => { reset(); onClose(); }, 1500);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMsg(err?.message || 'Upload failed');
      notifyError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Upload Resource</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Add a new learning resource
                </p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {uploadStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Upload Complete!</p>
                  <p className="text-xs text-slate-400 mt-1">Your resource has been uploaded successfully.</p>
                </div>
              )}

              {uploadStatus !== 'success' && (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">Source Type</p>
                    <div className="grid grid-cols-5 gap-2">
                      {sourceOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSourceType(opt.value); setSelectedFile(null); setExternalUrl(''); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            sourceType === opt.value
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                              : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <opt.icon size={18} />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-center leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter resource title"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this resource"
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.slug} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="react, typescript, tutorial"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>

                  {sourceType === 'upload' && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={handleBrowse}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                        accept={ALLOWED_TYPES.join(',')}
                      />
                      {selectedFile ? (
                        <div className="flex items-center gap-3 justify-center">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            {React.createElement(getFileTypeIcon(selectedFile.type), { size: 20, className: 'text-indigo-600' })}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} className="mx-auto text-slate-300 mb-3" />
                          <p className="text-sm font-bold text-slate-600">
                            Drag & drop or <span className="text-indigo-600 underline">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, PPT, XLS, Images, Video, Audio, ZIP up to 100MB</p>
                        </div>
                      )}
                    </div>
                  )}

                  {sourceType !== 'upload' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">URL *</label>
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder={`Enter ${sourceType === 'youtube' ? 'YouTube' : sourceType === 'github' ? 'GitHub' : ''} URL`}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  )}

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-xs font-medium text-red-600">
                      <AlertCircle size={14} />
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleClose}
                      disabled={isUploading}
                      className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading || uploadStatus === 'success'}
                      className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload size={14} /> Upload</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
