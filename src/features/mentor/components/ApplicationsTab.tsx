import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, CheckCircle, XCircle, Clock, FileText, ChevronRight,
  ArrowLeft, MessageSquare, ExternalLink, Filter, Loader2
} from 'lucide-react';
import { Application } from '../../../types';
import { applicationService } from '../../../services/applicationService';
import { storageService } from '../../../services/storageService';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface ApplicationsTabProps {
  applications: Application[];
  pendingApplications: Application[];
  appSearch: string;
  setAppSearch: (v: string) => void;
  appStatus: string;
  setAppStatus: (v: string) => void;
  appDiscipline: string;
  setAppDiscipline: (v: string) => void;
  appSortBy: string;
  setAppSortBy: (v: string) => void;
  appSortOrder: string;
  setAppSortOrder: (v: string) => void;
  appPage: number;
  setAppPage: (v: number) => void;
  appLimit: number;
  setAppLimit: (v: number) => void;
  modalTab: string;
  setModalTab: (v: 'details' | 'notes' | 'timeline') => void;
  applicationDetails: any;
  detailsLoading: boolean;
  newNoteText: string;
  setNewNoteText: (v: string) => void;
  editingNoteId: string | null;
  setEditingNoteId: (v: string | null) => void;
  editingNoteText: string;
  setEditingNoteText: (v: string) => void;
  requestInfoText: string;
  setRequestInfoText: (v: string) => void;
  isRequestingInfo: boolean;
  setIsRequestingInfo: (v: boolean) => void;
  isRejecting: boolean;
  setIsRejecting: (v: boolean) => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  rejectionFeedback: string;
  setRejectionFeedback: (v: string) => void;
  selectedApplication: Application | null;
  setSelectedApplication: (v: Application | null) => void;
  handleApplicationAction: (id: string, status: 'approved' | 'rejected', options?: { reason?: string; feedback?: string }) => Promise<void>;
  refreshApps: (params?: any) => Promise<void>;
  updateAppStatus: (id: string, status: 'approved' | 'rejected') => Promise<any>;
  filteredAppsForTab: Application[];
}

const ResumeDownloadButton: React.FC<{ path: string }> = ({ path }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    storageService.getPublicUrlFromPath('student-documents', path, 3600)
      .then(setUrl)
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [path]);

  if (loading) return <span className="text-xs text-slate-400">Loading...</span>;
  if (!url) return <span className="text-xs text-red-400">Unavailable</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all">
      <FileText size={14} /> View Resume
    </a>
  );
};

const ApplicationCard: React.FC<{
  app: Application;
  onSelect: (app: Application) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ app, onSelect, onApprove, onReject }) => {
  const statusIcon = app.status === 'pending' ? <Clock size={14} className="text-amber-500" />
    : app.status === 'approved' ? <CheckCircle size={14} className="text-emerald-500" />
    : <XCircle size={14} className="text-red-500" />;

  const statusBg = app.status === 'pending' ? 'bg-amber-50 border-amber-200'
    : app.status === 'approved' ? 'bg-emerald-50 border-emerald-200'
    : 'bg-red-50 border-red-200';

  const statusLabel = app.status === 'pending' ? 'Pending'
    : app.status === 'approved' ? 'Approved'
    : 'Rejected';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group" onClick={() => onSelect(app)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 border border-slate-200 shrink-0">
            {app.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{app.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{app.user_email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${statusBg}`}>
                {statusIcon}{statusLabel}
              </span>
              {app.mentor_type && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{app.mentor_type}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {app.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(app.id); }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-all active:scale-95"
                title="Approve"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReject(app.id); }}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-all active:scale-95"
                title="Reject"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>
      {app.goal && (
        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">{app.goal}</p>
      )}
    </div>
  );
};

const ApplicationDetailModal: React.FC<{
  application: Application;
  details: any;
  loading: boolean;
  activeTab: string;
  setActiveTab: (v: 'details' | 'notes' | 'timeline') => void;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string, feedback?: string) => void;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  rejectionFeedback: string;
  setRejectionFeedback: (v: string) => void;
  isRejecting: boolean;
  setIsRejecting: (v: boolean) => void;
}> = ({ application, details, loading, activeTab, setActiveTab, onClose, onApprove, onReject, rejectionReason, setRejectionReason, rejectionFeedback, setRejectionFeedback, isRejecting, setIsRejecting }) => {
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirm = () => {
    if (confirmAction === 'approve') {
      onApprove(application.id);
    } else if (confirmAction === 'reject') {
      onReject(application.id, rejectionReason, rejectionFeedback);
    }
    setConfirmAction(null);
    setShowConfirmDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-600 border border-slate-200 shrink-0">
              {application.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{application.full_name}</h2>
              <p className="text-sm text-slate-500 mt-1">{application.user_email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-600">
                  {application.mentor_type || 'General'}
                </span>
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                  application.status === 'pending' ? 'bg-amber-50 text-amber-700'
                  : application.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
                }`}>
                  {application.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-6 sm:px-8 shrink-0">
          {(['details', 'notes', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-slate-300" size={32} />
              </div>
            ) : activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{application.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Meeting Preference</p>
                    <p className="text-sm font-semibold text-slate-900">{application.meeting_preference || 'Virtual'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Frequency</p>
                    <p className="text-sm font-semibold text-slate-900">{application.frequency || 'Weekly'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Focus Area</p>
                    <p className="text-sm font-semibold text-slate-900">{application.focus_area || 'General'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">LinkedIn</p>
                    <p className="text-sm font-semibold text-blue-600 truncate">{application.linkedin_url ? <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1"><ExternalLink size={12} />Profile</a> : 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Applied</p>
                    <p className="text-sm font-semibold text-slate-900">{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Seriousness</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full transition-all" style={{ width: `${((application.seriousness || 5) / 10) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{application.seriousness || 5}/10</span>
                    </div>
                  </div>
                  {application.portfolio_url && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Portfolio</p>
                      <p className="text-sm font-semibold text-blue-600 truncate">
                        <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                          <ExternalLink size={12} />View Portfolio
                        </a>
                      </p>
                    </div>
                  )}
                  {application.resume_link && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resume</p>
                      <ResumeDownloadButton path={application.resume_link} />
                    </div>
                  )}
                </div>
                {application.goal && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Goal</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{application.goal}</p>
                  </div>
                )}
                {application.message_to_mentor && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Message to Mentor</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{application.message_to_mentor}</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'notes' ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-8">Notes feature coming soon</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-8">Timeline feature coming soon</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 border-t border-slate-100 shrink-0">
          {application.status === 'pending' && !confirmAction && !showConfirmDialog && (
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmAction('reject'); setShowConfirmDialog(true); }}
                className="flex-1 py-3 border border-red-200 bg-red-50 text-red-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={14} /> Reject Application
              </button>
              <button
                onClick={() => { setConfirmAction('approve'); setShowConfirmDialog(true); }}
                className="flex-1 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Approve Application
              </button>
            </div>
          )}

          {application.status === 'pending' && confirmAction === 'reject' && showConfirmDialog && (
            <div className="space-y-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-sm outline-none focus:border-red-500"
                rows={2}
                placeholder="Rejection reason (required)..."
              />
              <textarea
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-black"
                rows={2}
                placeholder="Optional feedback for the applicant..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmAction(null); setShowConfirmDialog(false); setIsRejecting(false); }}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setIsRejecting(true); onReject(application.id, rejectionReason, rejectionFeedback); }}
                  disabled={!rejectionReason.trim() || isRejecting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {application.status === 'pending' && confirmAction === 'approve' && showConfirmDialog && (
            <div className="space-y-4 p-4 bg-emerald-50 rounded-3xl border border-emerald-200">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Confirm Approval</p>
              <p className="text-sm text-emerald-800">This will create an account and send an invitation email to {application.user_email}.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmAction(null); setShowConfirmDialog(false); }}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onApprove(application.id)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} /> Confirm Approval
                </button>
              </div>
            </div>
          )}

          {application.status !== 'pending' && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-3">
              This application has been {application.status}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  applications, pendingApplications,
  appSearch, setAppSearch,
  appStatus, setAppStatus,
  appDiscipline, setAppDiscipline,
  appSortBy, setAppSortBy,
  appSortOrder, setAppSortOrder,
  appPage, setAppPage,
  appLimit, setAppLimit,
  modalTab, setModalTab,
  applicationDetails, detailsLoading,
  newNoteText, setNewNoteText,
  editingNoteId, setEditingNoteId,
  editingNoteText, setEditingNoteText,
  requestInfoText, setRequestInfoText,
  isRequestingInfo, setIsRequestingInfo,
  isRejecting, setIsRejecting,
  rejectionReason, setRejectionReason,
  rejectionFeedback, setRejectionFeedback,
  selectedApplication, setSelectedApplication,
  handleApplicationAction,
  refreshApps,
  updateAppStatus,
  filteredAppsForTab,
}) => {
  const totalCount = applications.length;
  const pendingCount = pendingApplications.length;

  const handleApprove = async (id: string) => {
    await handleApplicationAction(id, 'approved');
    setSelectedApplication(null);
  };

  const handleReject = async (id: string, reason: string, feedback?: string) => {
    await handleApplicationAction(id, 'rejected', { reason, feedback });
    setIsRejecting(false);
    setSelectedApplication(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Applications</h1>
            {pendingCount > 0 && (
              <span className="relative flex">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-[9px] font-black rounded-full">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {totalCount} total &middot; {pendingCount} pending review
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
            />
            {appSearch && (
              <button onClick={() => setAppSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={appStatus}
            onChange={(e) => setAppStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={appDiscipline}
            onChange={(e) => setAppDiscipline(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all appearance-none cursor-pointer"
          >
            <option value="">All Focus Areas</option>
            <option value="Career Strategist">Career Strategist</option>
            <option value="Academic Guide">Academic Guide</option>
            <option value="Research Mentor">Research Mentor</option>
            <option value="Industry Expert">Industry Expert</option>
            <option value="Life Coach">Life Coach</option>
            <option value="Product Strategy">Product Strategy</option>
            <option value="Software Architecture">Software Architecture</option>
          </select>
          <select
            value={`${appSortBy}-${appSortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setAppSortBy(sortBy);
              setAppSortOrder(sortOrder);
            }}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all appearance-none cursor-pointer"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="full_name-asc">Alphabetical (A-Z)</option>
            <option value="full_name-desc">Alphabetical (Z-A)</option>
            <option value="updated_at-desc">Recently Updated</option>
          </select>
        </div>

        <div className="space-y-4">
          {filteredAppsForTab.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">No applications found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            filteredAppsForTab.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onSelect={setSelectedApplication}
                onApprove={handleApprove}
                onReject={(id) => {
                  setSelectedApplication(app);
                }}
              />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedApplication && (
          <ApplicationDetailModal
            application={selectedApplication}
            details={applicationDetails}
            loading={detailsLoading}
            activeTab={modalTab}
            setActiveTab={setModalTab}
            onClose={() => setSelectedApplication(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            rejectionFeedback={setRejectionFeedback}
            isRejecting={isRejecting}
            setIsRejecting={setIsRejecting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
