import React from 'react';
import { Search, SlidersHorizontal, Grid3X3, List, X, ChevronDown } from 'lucide-react';
import type { ResourceFilters as Filters, ResourceFileType } from '../../types/resources';

interface ResourceFiltersProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  categories: { name: string; slug: string }[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  isMentor: boolean;
}

const fileTypes: { value: string; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'DOC' },
  { value: 'docx', label: 'DOCX' },
  { value: 'ppt', label: 'PPT' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'xls', label: 'XLS' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'zip', label: 'ZIP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'mp4', label: 'Video' },
  { value: 'mp3', label: 'Audio' },
  { value: 'link', label: 'Links' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_favorited', label: 'Most Favorited' },
  { value: 'pinned', label: 'Pinned First' },
  { value: 'recently_updated', label: 'Recently Updated' },
] as const;

const ResourceFiltersComponent: React.FC<ResourceFiltersProps> = ({
  filters, onFiltersChange, categories, viewMode, onViewModeChange, isMentor
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const update = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });

  const clearFilters = () => onFiltersChange({});

  const hasActiveFilters = filters.search || filters.category || filters.type || filters.sortBy || filters.tag;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 text-slate-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
          }`}
        >
          <SlidersHorizontal size={16} />
        </button>

        <div className="flex items-center bg-white border border-slate-100 rounded-xl p-0.5 shadow-sm">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Grid3X3 size={14} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => update({ category: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">File Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => update({ type: e.target.value || undefined })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">All Types</option>
                {fileTypes.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Sort By</label>
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => update({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tag</label>
              <input
                type="text"
                value={filters.tag || ''}
                onChange={(e) => update({ tag: e.target.value || undefined })}
                placeholder="Filter by tag..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-medium">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-[9px] font-semibold text-indigo-600 rounded-lg">
                  Search: {filters.search}
                  <button onClick={() => update({ search: '' })}><X size={10} /></button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-[9px] font-semibold text-indigo-600 rounded-lg">
                  {filters.category}
                  <button onClick={() => update({ category: '' })}><X size={10} /></button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-[9px] font-semibold text-indigo-600 rounded-lg">
                  {filters.type.toUpperCase()}
                  <button onClick={() => update({ type: undefined })}><X size={10} /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-[10px] text-red-500 font-bold hover:underline ml-auto">
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceFiltersComponent;
