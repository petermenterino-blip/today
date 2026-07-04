import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, RotateCcw, Download, File, FileText, FileArchive, Image,
  Video, Music, Loader2, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { notifySuccess, notifyError } from '../../utils/toast';
import type { ResourceVersion } from '../../types/resources';

interface VersionHistoryPanelProps {
  resourceId: string;
  versions: ResourceVersion[];
  isLoading: boolean;
  currentVersion: number;
  onRefresh: () => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getVersionIcon = (fileType?: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('zip') || fileType.includes('rar')) return FileArchive;
  return File;
};

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  resourceId, versions, isLoading, currentVersion, onRefresh
}) => {
  const [restoring, setRestoring] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restore this version? This will replace the current resource with this version.')) return;
    setRestoring(versionId);
    try {
      await resourceService.restoreVersion(versionId, resourceId);
      notifySuccess('Version restored');
      onRefresh();
    } catch (e: any) {
      notifyError(e?.message || 'Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">Version History ({versions.length})</h3>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No version history available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((version, index) => {
            const VersionIcon = getVersionIcon(version.file_type);
            const isCurrent = version.version_number === currentVersion;
            const isFirst = index === 0;

            return (
              <div
                key={version.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  isCurrent
                    ? 'bg-indigo-50 border border-indigo-100'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCurrent ? 'bg-indigo-100' : 'bg-white'
                  }`}>
                    <VersionIcon className={`w-4 h-4 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        v{version.version_number}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-[9px] font-bold text-indigo-600 rounded-md">
                          Current
                        </span>
                      )}
                      {isFirst && !isCurrent && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded-md">
                          Original
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(version.created_at)}
                      {version.file_size ? ` · ${formatFileSize(version.file_size)}` : ''}
                      {version.file_type ? ` · ${version.file_type.split('/').pop()}` : ''}
                    </p>
                    {version.change_notes && (
                      <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">
                        {version.change_notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    className="p-2 hover:bg-white rounded-xl transition-colors"
                    title="Download this version"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring === version.id}
                      className="p-2 hover:bg-white rounded-xl transition-colors"
                      title="Restore this version"
                    >
                      {restoring === version.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VersionHistoryPanel;
