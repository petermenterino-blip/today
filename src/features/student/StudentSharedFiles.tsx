import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileIcon, Download, X, FileText, Image, FileArchive, ChevronLeft } from 'lucide-react';
import { sharedFilesService, type SharedFileRecord } from '../../services/sharedFilesService';
import { useNavigate } from 'react-router-dom';
import { notifyError } from '../../utils/toast';

interface StudentSharedFilesProps {
  userId: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText size={16} />,
  DOCX: <FileText size={16} />,
  PPTX: <FileText size={16} />,
  IMAGE: <Image size={16} />,
  ZIP: <FileArchive size={16} />,
};

const StudentSharedFiles: React.FC<StudentSharedFilesProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<SharedFileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    sharedFilesService.getByUserId(userId)
      .then(setFiles)
      .catch(() => notifyError('Failed to load files'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/student')}
        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to dashboard
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Shared Files</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
      </div>

      {files.length === 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 text-center">
          <FileIcon size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-300">No files shared yet</p>
        </div>
      )}

      <div className="grid gap-3">
        {files.map(file => (
          <motion.a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group"
            whileHover={{ y: -1 }}
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
              {TYPE_ICONS[file.type] || <FileIcon size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{file.type}</span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ''}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(file.shared_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Download size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default StudentSharedFiles;
