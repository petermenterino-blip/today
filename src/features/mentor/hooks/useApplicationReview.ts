import { useState, useEffect, useCallback } from 'react';
import { useApplications } from '../../../hooks/useApplications';
import { applicationService } from '../../../services/applicationService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { User, Application } from '../../../types';

export function useApplicationReview(currentUser: User | null) {
  const { applications, refresh: refreshApps, updateStatus: updateAppStatus } = useApplications();

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('pending_review');
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
  const [rejectionReason, setRejectionReason] = useState('Application declined after assessment.');
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const filteredAppsForTab = applications;

  useEffect(() => {
    if (selectedApplication) {
      refreshApps({
        search: appSearch,
        status: appStatus,
        discipline: appDiscipline,
        sortBy: appSortBy,
        sortOrder: appSortOrder,
        page: appPage,
        limit: appLimit
      });
    }
  }, [appSearch, appStatus, appDiscipline, appSortBy, appSortOrder, appPage, appLimit, refreshApps]);

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

      refreshApps({
        search: appSearch,
        status: appStatus,
        discipline: appDiscipline,
        sortBy: appSortBy,
        sortOrder: appSortOrder,
        page: appPage,
        limit: appLimit
      });
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
