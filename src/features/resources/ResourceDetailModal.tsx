import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Heart, Share2, ExternalLink, Loader2, FileText,
  Image, Video, Music, File, AlertCircle, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, BookOpen, MessageSquare, Clock, Activity,
  UserPlus, CheckCircle2, Users, Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../hooks/useResources';
import { resourceService } from '../../services/resourceService';
import CommentsSection from './CommentsSection';
import VersionHistoryPanel from './VersionHistoryPanel';
import AssignResourceModal from './AssignResourceModal';
import { notifySuccess } from '../../utils/toast';
import type { Resource, ResourceActivity as ResourceActivityType } from '../../types/resources';

interface ResourceDetailModalProps {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
  onDownload: (r: Resource) => void;
  onFavorite: (r: Resource) => void;
  relatedResources?: Resource[];
  onNavigate?: (r: Resource) => void;
}

type Tab = 'details' | 'comments' | 'versions' | 'activity' | 'assignments';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: Info },
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'versions', label: 'Versions', icon: Clock },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'assignments', label: 'Assignments', icon: Users },
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource, open, onClose, onDownload, onFavorite, relatedResources, onNavigate
}) => {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const { markComplete, trackRecentlyViewed, service: svc } = useResources();

  const [tab, setTab] = useState<Tab>('details');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  // Tab data
  const [comments, setComments] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [completed, setCompleted] = useState(resource?.is_completed || false);

  useEffect(() => {
    if (!resource || !open) { setFileUrl(null); setError(null); return; }

    // Track view and recently viewed
    if (user) {
      resourceService.trackView(resource.id, user.id).catch(() => {});
      resourceService.trackRecentlyViewed(resource.id, user.id).catch(() => {});
    }

    if (resource.file_path) {
      setLoading(true);
      storageService.getSignedUrl('mentor-resources', resource.file_path, 300)
        .then(url => { setFileUrl(url); setLoading(false); })
        .catch(() => {
          const { data } = storageService.getPublicUrl('mentor-resources', resource.file_path);
          if (data) { setFileUrl(data.publicUrl); setLoading(false); }
          else { setError('Failed to load file'); setLoading(false); }
        });
    } else if (resource.external_url) {
      setFileUrl(resource.external_url);
    } else if (resource.url) {
      setFileUrl(resource.url);
    }
  }, [resource, open, user?.id]);

  // Load tab data
  useEffect(() => {
    if (!resource || !open) return;
    setTabLoading(true);

    const load = async () => {
      try {
        const [cRes, vRes, aRes, asRes] = await Promise.all([
          svc.getComments(resource.id),
          svc.getVersions(resource.id),
          svc.getActivity(resource.id),
          svc.getResourceAssignments(resource.id),
        ]);
        if (cRes.data) setComments(cRes.data);
        if (vRes.data) setVersions(vRes.data);
        if (aRes.data) setActivities(aRes.data);
        if (asRes.data) setAssignments(asRes.data);
      } catch (e) {
        // silent
      } finally {
        setTabLoading(false);
      }
    };
    load();
  }, [resource?.id, open]);

  if (!resource) return null;

  const isImage = resource.file_type && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(resource.file_type);
  const isVideo = resource.file_type && ['mp4', 'webm', 'mov'].includes(resource.file_type);
  const isAudio = resource.file_type && ['mp3', 'wav', 'ogg'].includes(resource.file_type);
  const isPdf = resource.file_type === 'pdf';
  const isLink = resource.source_type && resource.source_type !== 'upload';

  const handleRefreshTab = useCallback(async () => {
    if (!resource) return;
    try {
      if (tab === 'comments') {
        const { data } = await svc.getComments(resource.id);
        if (data) setComments(data);
      } else if (tab === 'versions') {
        const { data } = await svc.getVersions(resource.id);
        if (data) setVersions(data);
      } else if (tab === 'activity') {
        const { data } = await svc.getActivity(resource.id);
        if (data) setActivities(data);
      } else if (tab === 'assignments') {
        const { data } = await svc.getResourceAssignments(resource.id);
        if (data) setAssignments(data);
      }
    } catch (e) {
      // silent
    }
  }, [resource?.id, tab]);

  const handleFavorite = () => {
    onFavorite(resource);
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      await markComplete(resource.id);
      setCompleted(true);
      notifySuccess('Marked as completed!');
    } catch {}
  };

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
          className={`${isFullscreen ? 'w-full h-full object-contain' : 'max-w-full max-h-[60vh] object-contain'} rounded-xl`}
        />
      ) : fileUrl && isVideo ? (
        <video src={fileUrl} controls className="w-full max-h-[60vh] rounded-xl" controlsList="nodownload" />
      ) : fileUrl && isAudio ? (
        <div className="p-12 text-center">
          <Music size={48} className="mx-auto text-slate-300 mb-4" />
          <audio src={fileUrl} controls className="w-full max-w-md" controlsList="nodownload" />
        </div>
      ) : fileUrl && isPdf ? (
        <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-[60vh] rounded-xl" title={resource.title} />
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
          <button onClick={() => onDownload(resource)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">
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

  const StatBadge = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );

  const renderTabContent = () => {
    if (isFullscreen) return null;

    switch (tab) {
      case 'details':
        return (
          <div className="space-y-5">
            {resource.description && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{resource.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {resource.category && (
                <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">{resource.category}</span>
              )}
              {resource.file_type && (
                <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">{resource.file_type.toUpperCase()}</span>
              )}
              {resource.source_type && (
                <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">{resource.source_type}</span>
              )}
            </div>

            {resource.tags && resource.tags.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-indigo-50 text-[10px] font-semibold text-indigo-600 rounded-lg">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge label="Views" value={resource.views_count || 0} />
              <StatBadge label="Downloads" value={resource.downloads_count || 0} />
              <StatBadge label="Favorites" value={resource.favorites_count || 0} />
              <StatBadge label="Version" value={`v${resource.version || 1}`} />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap">
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

            {/* Action buttons for students */}
            {!isMentor && !completed && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 size={14} /> Mark as Completed
              </button>
            )}
            {completed && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 size={14} /> Completed
              </div>
            )}
          </div>
        );

      case 'comments':
        return (
          <CommentsSection
            resourceId={resource.id}
            comments={comments}
            isLoading={tabLoading}
            onRefresh={handleRefreshTab}
          />
        );

      case 'versions':
        return (
          <VersionHistoryPanel
            resourceId={resource.id}
            versions={versions}
            isLoading={tabLoading}
            currentVersion={resource.version || 1}
            onRefresh={handleRefreshTab}
          />
        );

      case 'activity':
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">Activity Log ({activities.length})</h3>
            </div>
            {tabLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((a: ResourceActivityType) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-indigo-600">{a.action[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 capitalize">{a.action}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(a.created_at)}</span>
                      </div>
                      {a.details && (
                        <p className="text-xs text-slate-500 mt-0.5">{typeof a.details === 'object' ? JSON.stringify(a.details) : a.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'assignments':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800">Assignments ({assignments.length})</h3>
              </div>
              {isMentor && (
                <button
                  onClick={() => setShowAssign(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                >
                  <UserPlus className="w-3 h-3" /> Assign
                </button>
              )}
            </div>
            {tabLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Not assigned to anyone yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600">
                          {(a.student_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.student_name || 'Student'}</p>
                        <p className="text-[10px] text-slate-400">{a.student_email || ''}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">Assigned {formatDate(a.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
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
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                    {resource.file_type === 'pdf' ? <FileText size={16} className="text-red-500" /> :
                     isImage ? <Image size={16} className="text-pink-500" /> :
                     isVideo ? <Video size={16} className="text-indigo-500" /> :
                     isAudio ? <Music size={16} className="text-amber-500" /> :
                     resource.source_type === 'youtube' ? <ExternalLink size={16} className="text-red-500" /> :
                     resource.source_type === 'github' ? <ExternalLink size={16} className="text-slate-700" /> :
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
                  {!isMentor && (
                    <button
                      onClick={() => resourceService.toggleFavorite(resource.id, user?.id || '').then(() => onFavorite(resource))}
                      className={`p-2 rounded-xl transition-colors ${resource.is_favorited ? 'bg-red-50 text-red-500' : 'hover:bg-slate-50 text-slate-400'}`}
                    >
                      <Heart size={15} fill={resource.is_favorited ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>
                  <button onClick={() => window.open(fileUrl || resource.external_url || resource.url || '', '_blank')}
                    disabled={!fileUrl && !resource.external_url && !resource.url}
                    className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30"
                  >
                    <ExternalLink size={15} />
                  </button>
                  {resource.file_path && (
                    <button onClick={() => onDownload(resource)} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
                      <Download size={15} />
                    </button>
                  )}
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors ml-1">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Preview area */}
              <div className={`${isFullscreen ? 'flex-1' : ''} overflow-y-auto`}>
                <div className={isFullscreen ? '' : 'p-6'}>
                  {getPreviewContent()}

                  {!isFullscreen && (
                    <>
                      {/* Tabs */}
                      <div className="flex gap-1 mt-6 mb-6 border-b border-slate-100 pb-1 overflow-x-auto">
                        {TABS.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                              tab === t.id
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <t.icon size={13} />
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab content */}
                      {renderTabContent()}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AssignResourceModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        resourceIds={[resource.id]}
        resourceTitle={resource.title}
      />
    </>
  );
};

export default ResourceDetailModal;
