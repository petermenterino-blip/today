import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Heart, Share2, ExternalLink, Loader2, FileText,
  Image, Video, Music, File, AlertCircle, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import type { Resource } from '../../types/resources';

interface PreviewModalProps {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
  onDownload: (r: Resource) => void;
  onFavorite: (r: Resource) => void;
  relatedResources?: Resource[];
  onNavigate?: (r: Resource) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  resource, open, onClose, onDownload, onFavorite, relatedResources, onNavigate
}) => {
  const { user } = useAuth();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!resource || !open) { setFileUrl(null); setError(null); return; }

    if (resource.file_path) {
      setLoading(true);
      storageService.getSignedUrl('mentor-resources', resource.file_path, 300)
        .then(url => { setFileUrl(url); setLoading(false); })
        .catch(() => {
          storageService.getPublicUrlFromPath('mentor-resources', resource.file_path, 300)
            .then(url => { setFileUrl(url); setLoading(false); })
            .catch(() => { setError('Failed to load file'); setLoading(false); });
        });
    } else if (resource.external_url) {
      setFileUrl(resource.external_url);
    } else if (resource.url) {
      setFileUrl(resource.url);
    }
  }, [resource, open]);

  if (!resource) return null;

  const isImage = resource.file_type && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(resource.file_type);
  const isVideo = resource.file_type && ['mp4', 'webm', 'mov'].includes(resource.file_type);
  const isAudio = resource.file_type && ['mp3', 'wav', 'ogg'].includes(resource.file_type);
  const isPdf = resource.file_type === 'pdf';
  const isLink = resource.source_type && resource.source_type !== 'upload';

  const getPreviewContent = () => (
    <div className={`flex items-center justify-center ${isFullscreen ? 'h-full p-0' : 'min-h-[300px] max-h-[60vh]'} bg-slate-50 rounded-2xl overflow-hidden`}>
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={24} className="animate-spin text-slate-300" />
          <p className="text-xs text-slate-400 font-medium">Loading preview...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle size={24} className="text-red-300" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      ) : fileUrl && isImage ? (
        <img
          src={fileUrl}
          alt={resource.title}
          loading="lazy"
          className={`${isFullscreen ? 'w-full h-full object-contain' : 'max-w-full max-h-[60vh] object-contain'} rounded-xl`}
        />
      ) : fileUrl && isVideo ? (
        <video
          src={fileUrl}
          controls
          className="w-full max-h-[60vh] rounded-xl"
          controlsList="nodownload"
        />
      ) : fileUrl && isAudio ? (
        <div className="p-12 text-center">
          <Music size={48} className="mx-auto text-slate-300 mb-4" />
          <audio src={fileUrl} controls className="w-full max-w-md" controlsList="nodownload" />
        </div>
      ) : fileUrl && isPdf ? (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-[60vh] rounded-xl"
          title={resource.title}
        />
      ) : isLink ? (
        <div className="p-12 text-center">
          <ExternalLink size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500 mb-4">This is an external link resource</p>
          <a
            href={resource.external_url || resource.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Open Link <ExternalLink size={14} />
          </a>
        </div>
      ) : fileUrl ? (
        <div className="p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500 mb-2">Preview not available for this file type</p>
          <button
            onClick={() => onDownload(resource)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            <Download size={14} /> Download to View
          </button>
        </div>
      ) : (
        <div className="p-12 text-center">
          <File size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-400">No preview available</p>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${isFullscreen ? 'p-0' : 'p-4'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-white ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-4xl w-full rounded-3xl'} shadow-2xl flex flex-col overflow-hidden`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  {resource.file_type === 'pdf' ? <FileText size={16} className="text-red-500" /> :
                   isImage ? <Image size={16} className="text-pink-500" /> :
                   isVideo ? <Video size={16} className="text-indigo-500" /> :
                   isAudio ? <Music size={16} className="text-amber-500" /> :
                   <File size={16} className="text-slate-500" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{resource.title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    {resource.category} {resource.file_size ? `- ${(resource.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => window.open(fileUrl || resource.external_url || resource.url || '', '_blank')}
                  disabled={!fileUrl && !resource.external_url && !resource.url}
                  className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30"
                >
                  <ExternalLink size={15} />
                </button>
                <button
                  onClick={() => onFavorite(resource)}
                  className={`p-2 rounded-xl transition-colors ${resource.is_favorited ? 'bg-red-50 text-red-500' : 'hover:bg-slate-50 text-slate-400'}`}
                >
                  <Heart size={15} fill={resource.is_favorited ? 'currentColor' : 'none'} />
                </button>
                {resource.file_path && (
                  <button
                    onClick={() => onDownload(resource)}
                    className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                  >
                    <Download size={15} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors ml-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto ${isFullscreen ? '' : 'p-6'}`}>
              {getPreviewContent()}

              {!isFullscreen && (
                <div className="mt-6 space-y-4">
                  {resource.description && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{resource.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {resource.category && (
                      <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {resource.category}
                      </span>
                    )}
                    {resource.file_type && (
                      <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {resource.file_type.toUpperCase()}
                      </span>
                    )}
                    {resource.source_type && (
                      <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {resource.source_type}
                      </span>
                    )}
                  </div>

                  {resource.tags && resource.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resource.tags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 bg-indigo-50 text-[10px] font-semibold text-indigo-600 rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Downloads', value: resource.downloads_count || 0 },
                      { label: 'Views', value: resource.views_count || 0 },
                      { label: 'Favorites', value: resource.favorites_count || 0 },
                      { label: 'Version', value: `v${resource.version || 1}` },
                    ].map(stat => (
                      <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-slate-900">{stat.value}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span>Uploaded by <strong>{resource.creator?.name || 'Unknown'}</strong></span>
                    <span>on <strong>{new Date(resource.created_at).toLocaleDateString()}</strong></span>
                    {resource.updated_at !== resource.created_at && (
                      <span>Updated <strong>{new Date(resource.updated_at).toLocaleDateString()}</strong></span>
                    )}
                  </div>

                  {relatedResources && relatedResources.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Related Resources</p>
                      <div className="grid grid-cols-2 gap-2">
                        {relatedResources.map(r => (
                          <button
                            key={r.id}
                            onClick={() => onNavigate?.(r)}
                            className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                          >
                            <BookOpen size={14} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate">{r.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
