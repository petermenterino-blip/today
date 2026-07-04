import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Download, Eye, Heart, Bookmark, Star, MoreVertical, Edit3, Trash2,
  Copy, Archive, Link2, Share2, FileText, File, Image, Video, Music,
  FileArchive, ExternalLink, ChevronDown, Globe, Github, Figma, Youtube,
  BookOpen, CheckCircle2, X, Pin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Resource } from '../../types/resources';

interface ResourceCardProps {
  resource: Resource;
  onPreview: (r: Resource) => void;
  onDownload: (r: Resource) => void;
  onFavorite: (r: Resource) => void;
  onEdit?: (r: Resource) => void;
  onDelete?: (r: Resource) => void;
  onDuplicate?: (r: Resource) => void;
  onArchive?: (r: Resource) => void;
  onRestore?: (r: Resource) => void;
  onShare?: (r: Resource) => void;
  onCopyLink?: (r: Resource) => void;
  onAssign?: (r: Resource) => void;
  onPin?: (r: Resource) => void;
  onMarkComplete?: (r: Resource) => void;
  selected?: boolean;
  onSelect?: (r: Resource) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  pdf: FileText, doc: FileText, docx: FileText,
  ppt: FileText, pptx: FileText, xls: FileText, xlsx: FileText,
  zip: FileArchive, rar: FileArchive,
  png: Image, jpg: Image, jpeg: Image, webp: Image, gif: Image, svg: Image,
  mp4: Video, webm: Video, mov: Video,
  mp3: Music, wav: Music, ogg: Music,
  link: Link2, other: File,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  doc: 'bg-blue-50 text-blue-600', docx: 'bg-blue-50 text-blue-600',
  ppt: 'bg-orange-50 text-orange-600', pptx: 'bg-orange-50 text-orange-600',
  xls: 'bg-emerald-50 text-emerald-600', xlsx: 'bg-emerald-50 text-emerald-600',
  zip: 'bg-purple-50 text-purple-600',
  png: 'bg-pink-50 text-pink-600', jpg: 'bg-pink-50 text-pink-600', jpeg: 'bg-pink-50 text-pink-600',
  mp4: 'bg-indigo-50 text-indigo-600',
  mp3: 'bg-amber-50 text-amber-600',
  link: 'bg-cyan-50 text-cyan-600',
};

const sourceIcons: Record<string, React.ElementType> = {
  youtube: Youtube, github: Github, figma: Figma, website: Globe,
  googledrive: ExternalLink, notion: BookOpen, canva: ExternalLink,
};

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit++; }
  return `${size.toFixed(1)} ${units[unit]}`;
}

function getFileTypeIcon(type?: string | null): React.ElementType {
  if (!type) return File;
  return typeIcons[type.toLowerCase()] || File;
}

function getFileTypeColor(type?: string | null): string {
  if (!type) return 'bg-slate-50 text-slate-600';
  return typeColors[type.toLowerCase()] || 'bg-slate-50 text-slate-600';
}

function getSourceIcon(source?: string | null): React.ElementType | null {
  if (!source) return null;
  return sourceIcons[source] || null;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource, onPreview, onDownload, onFavorite, onEdit, onDelete,
  onDuplicate, onArchive, onRestore, onShare, onCopyLink, onAssign,
  onPin, onMarkComplete, selected, onSelect,
}) => {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [showMenu, setShowMenu] = useState(false);

  const Icon = getFileTypeIcon(resource.file_type);
  const colorClass = getFileTypeColor(resource.file_type);
  const SourceIcon = resource.source_type ? getSourceIcon(resource.source_type) : null;

  const menuItems = [
    ...(isMentor && onEdit ? [{ label: 'Edit', icon: Edit3, action: () => onEdit(resource) }] : []),
    { label: 'Preview', icon: Eye, action: () => onPreview(resource) },
    ...(resource.file_path ? [{ label: 'Download', icon: Download, action: () => onDownload(resource) }] : []),
    ...(resource.external_url ? [{ label: 'Open Link', icon: ExternalLink, action: () => window.open(resource.external_url!, '_blank') }] : []),
    ...(isMentor && onDuplicate ? [{ label: 'Duplicate', icon: Copy, action: () => onDuplicate(resource) }] : []),
    ...(isMentor && onAssign ? [{ label: 'Assign', icon: Share2, action: () => onAssign(resource) }] : []),
    ...(onShare ? [{ label: 'Share', icon: Share2, action: () => onShare(resource) }] : []),
    ...(onCopyLink ? [{ label: 'Copy Link', icon: Link2, action: () => onCopyLink(resource) }] : []),
    ...(isMentor && onPin ? [{ label: resource.is_pinned ? 'Unpin' : 'Pin', icon: Pin, action: () => onPin(resource) }] : []),
    ...(isMentor && resource.is_archived && onRestore ? [{ label: 'Restore', icon: Archive, action: () => onRestore(resource) }] : []),
    ...(isMentor && !resource.is_archived && onArchive ? [{ label: 'Archive', icon: Archive, action: () => onArchive(resource) }] : []),
    ...(isMentor && onDelete ? [{ label: 'Delete', icon: Trash2, action: () => onDelete(resource) }] : []),
    ...(!isMentor && onMarkComplete ? [{ label: 'Mark Complete', icon: CheckCircle2, action: () => onMarkComplete(resource) }] : []),
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-white rounded-2xl border ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100'} shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all duration-300 overflow-hidden cursor-pointer ${resource.is_pinned ? 'ring-1 ring-amber-200' : ''}`}
      onClick={() => { onPreview(resource); if (onSelect) onSelect(resource); }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shrink-0 shadow-sm`}>
            {SourceIcon ? <SourceIcon size={18} /> : <Icon size={18} />}
          </div>
          <div className="flex items-center gap-1">
            {resource.is_pinned && (
              <span className="text-amber-500"><Pin size={12} /></span>
            )}
            {resource.featured && (
              <span className="text-amber-500"><Star size={12} fill="currentColor" /></span>
            )}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                    {menuItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); item.action(); setShowMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <item.icon size={14} className="text-slate-400" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug">
          {resource.title}
        </h3>

        {resource.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {resource.category && (
            <span className="px-2.5 py-1 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider rounded-lg">
              {resource.category}
            </span>
          )}
          {resource.file_type && (
            <span className="px-2.5 py-1 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider rounded-lg">
              {resource.file_type.toUpperCase()}
            </span>
          )}
        </div>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-[9px] font-semibold text-indigo-600 rounded-md">
                #{tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[9px] text-slate-400 font-medium self-center">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
          {resource.file_size > 0 && (
            <span>{formatFileSize(resource.file_size)}</span>
          )}
          <span className="flex items-center gap-1">
            <Eye size={11} /> {resource.views_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Download size={11} /> {resource.downloads_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} /> {resource.favorites_count || 0}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          {resource.creator?.name ? (
            <span>{resource.creator.name}</span>
          ) : null}
          <span>{new Date(resource.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          {!resource.is_favorited ? (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(resource); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Heart size={12} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(resource); }}
              className="p-1.5 rounded-lg bg-red-50 text-red-500 transition-colors"
            >
              <Heart size={12} fill="currentColor" />
            </button>
          )}
          {!isMentor && onMarkComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkComplete(resource); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-colors"
            >
              <CheckCircle2 size={12} />
            </button>
          )}
          {resource.external_url && (
            <a
              href={resource.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-colors"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceCard;
