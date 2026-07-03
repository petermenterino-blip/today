import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApplications } from '../../../hooks/useApplications';
import { applicationService } from '../../../services/applicationService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { User, Application } from '../../../types';

export function useApplicationReview(currentUser: User | null) {
  const { applications, refresh: refreshApps, updateStatus: updateAppStatus } = useApplications();

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [appDiscipline, setAppDiscipline] = useState('');
  const [appSortBy, setAppSortBy] = useState('created_at');
  const [appSortOrder, setAppSortOrder] = useState('desc');
  const [appPage, setAppPage] = useState(1);
  const [appLimit, setAppLimit] = useState(10);

  const [modalTab, setModalTab] = useState<'details' | 'notes' | 'timeline'>('details');
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [requestInfoText, setRequestInfoText] = useState('');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  const pendingApplications = applications.filter(app => app.status === 'pending');

  const filteredAppsForTab = useMemo(() => {
    let result = [...applications];

    if (appSearch) {
      const q = appSearch.toLowerCase();
      result = result.filter(app =>
        app.full_name.toLowerCase().includes(q) ||
        app.user_email.toLowerCase().includes(q) ||
        (app.phone && app.phone.toLowerCase().includes(q))
      );
    }

    if (appStatus) {
      result = result.filter(app => app.status === appStatus);
    }

    if (appDiscipline) {
      result = result.filter(app =>
        app.focus_area === appDiscipline || app.mentor_type === appDiscipline
      );
    }

    result.sort((a, b) => {
      const dir = appSortOrder === 'asc' ? 1 : -1;
      if (appSortBy === 'full_name') {
        return dir * a.full_name.localeCompare(b.full_name);
      }
      if (appSortBy === 'updated_at') {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dir * (aDate - bDate);
      }
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return dir * (aDate - bDate);
    });

    return result;
  }, [applications, appSearch, appStatus, appDiscipline, appSortBy, appSortOrder]);

  const loadApplicationDetails = useCallback(async (appId: string) => {
    setDetailsLoading(true);
    const { data, error } = await applicationService.fetchDetails(appId);
    if (!error && data) {
      setApplicationDetails(data);
    }
    setDetailsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedApplication) {
      loadApplicationDetails(selectedApplication.id);
    } else {
      setApplicationDetails(null);
    }
  }, [selectedApplication, loadApplicationDetails]);

  const handleApplicationAction = async (id: string, status: 'approved' | 'rejected', options?: { reason?: string, feedback?: string }) => {
    try {
      if (status === 'approved') {
        const res = await applicationService.approveApplication(id);
        if (res.error) throw new Error(res.error);

        const app = applications.find(a => a.id === id);
        const credEmail = app?.user_email || res.data?.email || '';
        notifySuccess(`Application approved! Invitation sent to ${credEmail}. They can sign in using the credentials provided in the email.`);
      } else {
        const res = await applicationService.rejectApplication(id, options?.reason || "Application declined after assessment.", options?.feedback);
        if (res.error) throw new Error(res.error);
        notifySuccess("Application rejected and email notification sent.");
      }

      setRejectionReason('');
      setRejectionFeedback('');
      setIsRejecting(false);
      setSelectedApplication(null);
      await refreshApps();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update application');
    }
  };

  return {
    selectedApplication, setSelectedApplication,
    appSearch, setAppSearch,
    appStatus, setAppStatus,
    appDiscipline, setAppDiscipline,
    appSortBy, setAppSortBy,
    appSortOrder, setAppSortOrder,
    appPage, setAppPage,
    appLimit, setAppLimit,
    modalTab, setModalTab,
    applicationDetails, setApplicationDetails,
    detailsLoading, setDetailsLoading,
    newNoteText, setNewNoteText,
    editingNoteId, setEditingNoteId,
    editingNoteText, setEditingNoteText,
    requestInfoText, setRequestInfoText,
    isRequestingInfo, setIsRequestingInfo,
    isRejecting, setIsRejecting,
    rejectionReason, setRejectionReason,
    rejectionFeedback, setRejectionFeedback,
    pendingApplications,
    filteredAppsForTab,
    handleApplicationAction,
    loadApplicationDetails,
    refreshApps,
    applications,
    updateAppStatus,
  };
}
