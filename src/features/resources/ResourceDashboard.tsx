import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Upload, Loader2, BookOpen, X, ArrowUpDown, CheckSquare, Square,
  Trash2, Archive, Download, Share2, Tags, ChevronLeft, ChevronRight,
  Layers, UserPlus, Copy, FolderInput, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePrograms } from '../../hooks/usePrograms';
import { useResources } from '../../hooks/useResources';
import ResourceCard from './ResourceCard';
import ResourceFiltersComponent from './ResourceFilters';
import ResourceStatsCards from './ResourceStatsCards';
import UploadModal from './UploadModal';
import ResourceDetailModal from './ResourceDetailModal';
import CategoryManagementModal from './CategoryManagementModal';
import AssignResourceModal from './AssignResourceModal';
import ResourceAnalyticsPanel from './ResourceAnalyticsPanel';
import { storageService } from '../../services/storageService';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { notifySuccess } from '../../utils/toast';
import type { Resource, ResourceFilters, ResourceCategory } from '../../types/resources';

interface ResourceDashboardProps {
  isMentor: boolean;
}

const ResourceDashboard: React.FC<ResourceDashboardProps> = ({ isMentor }) => {
  const { user } = useAuth();
  const {
    useResourceList, useCategories, useFavorites, useStats, useStudentResources,
    createResource, updateResource, softDeleteResource, hardDeleteResource,
    restoreResource, duplicateResource, toggleFavorite, service,
    useRecentlyViewed, useCompletions
  } = useResources();
  const { programs } = usePrograms();

  const [filters, setFilters] = useState<ResourceFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [showCategoryMgmt, setShowCategoryMgmt] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkMoveCategory, setBulkMoveCategory] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const PAGE_SIZE = 20;

  const { data: resourceResult = { data: [], count: 0 }, isLoading: resourcesLoading } = useResourceList({ ...filters, page, pageSize: PAGE_SIZE });
  const { data: categories = [] } = useCategories();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: favorites = [] } = useFavorites();
  const { data: studentResources = [], isLoading: studentLoading } = useStudentResources();
  const { data: recentlyViewed = [] } = useRecentlyViewed(5);
  const { data: completions = [] } = useCompletions();

  const resources = resourceResult.data || [];
  const totalCount = resourceResult.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const displayResources = isMentor ? resources : (studentResources.length > 0 ? studentResources : []);
  const completionIds = useMemo(() => new Set(completions.map((c: any) => c.resource_id)), [completions]);

  const favoriteIds = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((f: any) => { if (f.bookmarked) set.add(f.resource_id); });
    return set;
  }, [favorites]);

  const resourcesWithFavorites = useMemo(() =>
    displayResources.map(r => ({ ...r, is_favorited: favoriteIds.has(r.id), is_completed: completionIds.has(r.id) })),
    [displayResources, favoriteIds, completionIds]
  );

  const handleUpload = useCallback(async (data: any) => {
    await createResource(data);
  }, [createResource]);

  const handlePreview = useCallback((r: Resource) => {
    setDetailResource(r);
    if (user?.id) service.trackView(r.id, user.id);
  }, [service, user?.id]);

  const handleDownload = useCallback(async (r: Resource) => {
    if (r.file_path) {
      const url = await storageService.getPublicUrlFromPath('mentor-resources', r.file_path);
      window.open(url, '_blank');
      if (user?.id) service.trackDownload(r.id, user.id);
    } else if (r.external_url) {
      window.open(r.external_url, '_blank');
    } else if (r.url) {
      window.open(r.url, '_blank');
    }
  }, [service, user?.id]);

  const handleFavorite = useCallback(async (r: Resource) => {
    if (user?.id) await toggleFavorite(r.id);
  }, [toggleFavorite, user?.id]);

  const handleEdit = useCallback((r: Resource) => {
    setDetailResource(r);
  }, []);

  const handleDelete = useCallback((r: Resource) => {
    setDeleteTarget(r);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await hardDeleteResource(deleteTarget.id);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  }, [deleteTarget, hardDeleteResource]);

  const handleDuplicate = useCallback(async (r: Resource) => {
    await duplicateResource(r.id);
  }, [duplicateResource]);

  const handleArchive = useCallback(async (r: Resource) => {
    await softDeleteResource(r.id);
  }, [softDeleteResource]);

  const handleRestore = useCallback(async (r: Resource) => {
    await restoreResource(r.id);
  }, [restoreResource]);

  const handlePin = useCallback(async (r: Resource) => {
    await updateResource({ id: r.id, updates: { is_pinned: !r.is_pinned } });
  }, [updateResource]);

  const handleCopyLink = useCallback(async (r: Resource) => {
    const url = r.external_url || r.url || `${window.location.origin}/resources/${r.id}`;
    await navigator.clipboard.writeText(url);
    notifySuccess('Link copied to clipboard');
  }, []);

  const handleShare = useCallback(async (r: Resource) => {
    if (navigator.share) {
      navigator.share({ title: r.title, url: r.external_url || r.url || window.location.href });
    } else {
      handleCopyLink(r);
    }
  }, [handleCopyLink]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedResources) await hardDeleteResource(id);
    setSelectedResources(new Set());
  }, [selectedResources, hardDeleteResource]);

  const handleBulkArchive = useCallback(async () => {
    for (const id of selectedResources) await softDeleteResource(id);
    setSelectedResources(new Set());
  }, [selectedResources, softDeleteResource]);

  const handleBulkDuplicate = useCallback(async () => {
    for (const id of selectedResources) await duplicateResource(id);
    setSelectedResources(new Set());
  }, [selectedResources, duplicateResource]);

  const handleBulkMoveCategory = useCallback(async (category: string) => {
    for (const id of selectedResources) await updateResource({ id, updates: { category } });
    setSelectedResources(new Set());
    setBulkMoveCategory('');
    notifySuccess(`Moved ${selectedResources.size} resources to ${category}`);
  }, [selectedResources, updateResource]);

  const toggleSelect = useCallback((r: Resource) => {
    setSelectedResources(prev => {
      const next = new Set(prev);
      if (next.has(r.id)) next.delete(r.id);
      else next.add(r.id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedResources.size === resourcesWithFavorites.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(resourcesWithFavorites.map(r => r.id)));
    }
  }, [resourcesWithFavorites, selectedResources]);

  if (resourcesLoading && isMentor) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Resources</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isMentor ? 'Manage and share learning materials' : 'Access your assigned learning materials'}
          </p>
        </div>
        {isMentor && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:shadow-xl"
          >
            <Upload size={14} />
            Upload Resource
          </button>
        )}
      </div>

      <ResourceStatsCards stats={stats || null} loading={statsLoading} />

      <ResourceFiltersComponent
        filters={filters}
        onFiltersChange={(f) => { setFilters(f); setPage(1); }}
        categories={categories}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isMentor={isMentor}
      />

      {isMentor && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryMgmt(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Tags size={12} /> Manage Categories
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm ${
              showAnalytics
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={12} /> Analytics
          </button>
        </div>
      )}

      {showAnalytics && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ResourceAnalyticsPanel resources={resourcesWithFavorites} isLoading={resourcesLoading} />
        </motion.div>
      )}

      {selectedResources.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100"
        >
          <button onClick={toggleSelectAll} className="text-indigo-600">
            {selectedResources.size === resourcesWithFavorites.length ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <span className="text-xs font-bold text-indigo-700">{selectedResources.size} selected</span>
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            {isMentor && (
              <>
                <button onClick={() => setShowBulkAssign(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                  <UserPlus size={12} /> Assign
                </button>
                <button onClick={handleBulkDuplicate} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                  <Copy size={12} /> Duplicate
                </button>
                <select
                  value={bulkMoveCategory}
                  onChange={(e) => { if (e.target.value) handleBulkMoveCategory(e.target.value); }}
                  className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">Move to...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button onClick={handleBulkArchive} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                  <Archive size={12} /> Archive
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 transition-colors border border-slate-200">
                  <Trash2 size={12} /> Delete
                </button>
              </>
            )}
            <button onClick={() => setSelectedResources(new Set())} className="p-1.5 rounded-lg hover:bg-white text-slate-400">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {resourcesWithFavorites.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No resources found</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1 max-w-sm mx-auto">
            {isMentor
              ? 'Upload your first resource to share learning materials with your students.'
              : 'Resources assigned to you will appear here. Check back later or contact your mentor.'}
          </p>
          {isMentor && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <Upload size={14} /> Upload Resource
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resourcesWithFavorites.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onFavorite={handleFavorite}
              onEdit={isMentor ? handleEdit : undefined}
              onDelete={isMentor ? handleDelete : undefined}
              onDuplicate={isMentor ? handleDuplicate : undefined}
              onArchive={isMentor ? handleArchive : undefined}
              onRestore={isMentor ? handleRestore : undefined}
              onShare={handleShare}
              onCopyLink={handleCopyLink}
              onPin={isMentor ? handlePin : undefined}
              selected={selectedResources.has(resource.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {resourcesWithFavorites.map(resource => (
            <div
              key={resource.id}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => handlePreview(resource)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedResources.has(resource.id)}
                  onChange={() => toggleSelect(resource)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{resource.title}</p>
                <p className="text-[10px] text-slate-400">{resource.category} {resource.file_type && `- ${resource.file_type.toUpperCase()}`}</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Download size={11} /> {resource.downloads_count || 0}</span>
                <span className="flex items-center gap-1"><ArrowUpDown size={11} /> {resource.views_count || 0}</span>
                <span>{new Date(resource.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">{totalCount} resources</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Recently viewed — students */}
      {!isMentor && recentlyViewed.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Recently Viewed</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentlyViewed.map((rv: any) => rv.resource ? (
              <button
                key={rv.id}
                onClick={() => handlePreview(rv.resource)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <BookOpen size={12} className="text-indigo-400" />
                <span className="truncate max-w-[120px]">{rv.resource.title}</span>
              </button>
            ) : null)}
          </div>
        </div>
      )}

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
        categories={categories}
      />

      <AssignResourceModal
        open={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        resourceIds={Array.from(selectedResources)}
        resourceTitle={selectedResources.size > 0 ? `${selectedResources.size} resources` : ''}
      />

      <ResourceDetailModal
        resource={detailResource}
        open={!!detailResource}
        onClose={() => setDetailResource(null)}
        onDownload={handleDownload}
        onFavorite={handleFavorite}
      />

      <CategoryManagementModal
        open={showCategoryMgmt}
        onClose={() => setShowCategoryMgmt(false)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Resource"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
      />
    </div>
  );
};

export default ResourceDashboard;
