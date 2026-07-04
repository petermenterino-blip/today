import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, Users, BookOpen, GraduationCap, Download, Eye,
  Heart, CheckCircle2, Loader2, TrendingUp, Calendar, ArrowUpDown,
  Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Resource } from '../../types/resources';

interface ResourceAnalyticsPanelProps {
  resources: Resource[];
  isLoading: boolean;
}

interface StudentMetric {
  id: string;
  name: string;
  email: string;
  assigned: number;
  viewed: number;
  downloaded: number;
  favorited: number;
  completed: number;
  completionRate: number;
  lastActive: string;
}

interface ProgramMetric {
  id: string;
  name: string;
  resourcesShared: number;
  totalViews: number;
  totalDownloads: number;
  totalFavorites: number;
  studentCount: number;
  avgCompletion: number;
}

interface MentorMetric {
  id: string;
  name: string;
  resourcesUploaded: number;
  totalViews: number;
  totalDownloads: number;
  totalFavorites: number;
  totalCompletions: number;
}

type Tab = 'students' | 'programs' | 'mentors';

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

const ResourceAnalyticsPanel: React.FC<ResourceAnalyticsPanelProps> = ({ resources, isLoading }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('students');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('completionRate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loadingData, setLoadingData] = useState(true);

  // Raw data
  const [students, setStudents] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;
    const load = async () => {
      setLoadingData(true);
      try {
        const [
          stRes, vRes, dRes, fRes, cRes, aRes, mRes
        ] = await Promise.all([
          supabase.from('profiles').select('id, name:full_name, email').eq('role', 'student'),
          supabase.from('resource_views').select('user_id, resource_id'),
          supabase.from('resource_downloads').select('user_id, resource_id'),
          supabase.from('resource_favorites').select('user_id, resource_id'),
          supabase.from('resource_completions').select('user_id, resource_id'),
          supabase.from('resource_assignments').select('student_id, resource_id, program_id'),
          supabase.from('profiles').select('id, name:full_name, email').eq('role', 'mentor'),
        ]);
        if (stRes.data) setStudents(stRes.data);
        if (vRes.data) setViews(vRes.data);
        if (dRes.data) setDownloads(dRes.data);
        if (fRes.data) setFavorites(fRes.data);
        if (cRes.data) setCompletions(cRes.data);
        if (aRes.data) setAssignments(aRes.data);
        if (mRes.data) setMentors(mRes.data);
      } catch {
        // silent
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [isLoading]);

  const resourceIds = useMemo(() => new Set(resources.map(r => r.id)), [resources]);

  // Per-student metrics
  const studentMetrics: StudentMetric[] = useMemo(() => {
    if (loadingData) return [];
    return students.map(s => {
      const assigned = assignments.filter(a => a.student_id === s.id && resourceIds.has(a.resource_id)).length;
      const viewed = views.filter(v => v.user_id === s.id && resourceIds.has(v.resource_id)).length;
      const downloaded = downloads.filter(d => d.user_id === s.id && resourceIds.has(d.resource_id)).length;
      const favorited = favorites.filter(f => f.user_id === s.id && resourceIds.has(f.resource_id)).length;
      const completed = completions.filter(c => c.user_id === s.id && resourceIds.has(c.resource_id)).length;
      return {
        id: s.id,
        name: s.name || 'Unknown',
        email: s.email || '',
        assigned,
        viewed,
        downloaded,
        favorited,
        completed,
        completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        lastActive: '',
      };
    }).filter(s => s.assigned > 0 || s.viewed > 0);
  }, [students, assignments, views, downloads, favorites, completions, resourceIds, loadingData]);

  // Per-program metrics
  interface ProgramLookup { id: string; title: string; }
  const programMetrics: ProgramMetric[] = useMemo(() => {
    if (loadingData) return [];
    const programMap = new Map<string, { name: string; students: Set<string>; resourceIds: Set<string> }>();

    for (const a of assignments) {
      if (!a.program_id) continue;
      if (!programMap.has(a.program_id)) {
        programMap.set(a.program_id, { name: a.program_id, students: new Set(), resourceIds: new Set() });
      }
      const p = programMap.get(a.program_id)!;
      p.students.add(a.student_id);
      if (resourceIds.has(a.resource_id)) p.resourceIds.add(a.resource_id);
    }

    return Array.from(programMap.entries()).map(([id, data]) => {
      let totalViews = 0, totalDownloads = 0, totalFavorites = 0, totalCompletions = 0;
      for (const rid of data.resourceIds) {
        totalViews += views.filter(v => v.resource_id === rid).length;
        totalDownloads += downloads.filter(d => d.resource_id === rid).length;
        totalFavorites += favorites.filter(f => f.resource_id === rid).length;
        totalCompletions += completions.filter(c => c.resource_id === rid).length;
      }
      const studentCount = data.students.size;
      return {
        id,
        name: id,
        resourcesShared: data.resourceIds.size,
        totalViews,
        totalDownloads,
        totalFavorites,
        studentCount,
        avgCompletion: studentCount > 0 ? Math.round(totalCompletions / studentCount) : 0,
      };
    });
  }, [assignments, views, downloads, favorites, completions, resourceIds, loadingData]);

  // Per-mentor metrics
  const mentorMetrics: MentorMetric[] = useMemo(() => {
    if (loadingData) return [];
    const mentorMap = new Map<string, { name: string; resources: string[] }>();
    for (const r of resources) {
      if (!r.created_by) continue;
      if (!mentorMap.has(r.created_by)) {
        const mentor = mentors.find(m => m.id === r.created_by);
        mentorMap.set(r.created_by, { name: mentor?.name || 'Unknown', resources: [] });
      }
      mentorMap.get(r.created_by)!.resources.push(r.id);
    }

    return Array.from(mentorMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      resourcesUploaded: data.resources.length,
      totalViews: views.filter(v => data.resources.includes(v.resource_id)).length,
      totalDownloads: downloads.filter(d => data.resources.includes(d.resource_id)).length,
      totalFavorites: favorites.filter(f => data.resources.includes(f.resource_id)).length,
      totalCompletions: completions.filter(c => data.resources.includes(c.resource_id)).length,
    }));
  }, [resources, mentors, views, downloads, favorites, completions, loadingData]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
      {label}
      {sortField === field && (
        <ArrowUpDown size={10} className={`${sortDir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
      )}
    </button>
  );

  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{resources.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Resources</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{studentMetrics.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Students</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {completions.length > 0 && resources.length > 0
              ? Math.round((completions.length / (resources.length * Math.max(studentMetrics.length, 1))) * 100)
              : 0}%
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Completion Rate</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatNumber(views.length)}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Views</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 pb-1">
        {(['students', 'programs', 'mentors'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
              tab === t ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'students' && <Users size={13} />}
            {t === 'programs' && <GraduationCap size={13} />}
            {t === 'mentors' && <BookOpen size={13} />}
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {tab === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 py-3 text-left"><SortHeader field="name" label="Student" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="assigned" label="Assigned" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="viewed" label="Views" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="downloaded" label="Downloads" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="completed" label="Completed" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="completionRate" label="Rate" /></th>
                </tr>
              </thead>
              <tbody>
                {studentMetrics
                  .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => {
                    const key = sortField as keyof typeof a;
                    const val = a[key] ?? 0;
                    const valB = b[key] ?? 0;
                    return sortDir === 'asc'
                      ? (val > valB ? 1 : -1)
                      : (val < valB ? 1 : -1);
                  })
                  .map(s => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-indigo-600">{s.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{s.assigned}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{s.viewed}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{s.downloaded}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-emerald-600">{s.completed}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.completionRate >= 80 ? 'bg-emerald-500' : s.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${s.completionRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{s.completionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                {studentMetrics.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No student data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'programs' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 py-3 text-left"><SortHeader field="name" label="Program" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="resourcesShared" label="Resources" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="studentCount" label="Students" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalViews" label="Views" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalDownloads" label="Downloads" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="avgCompletion" label="Avg Completion" /></th>
                </tr>
              </thead>
              <tbody>
                {programMetrics
                  .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => {
                    const key = sortField as keyof typeof a;
                    const val = a[key] ?? 0;
                    const valB = b[key] ?? 0;
                    return sortDir === 'asc' ? (val > valB ? 1 : -1) : (val < valB ? 1 : -1);
                  })
                  .map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{p.resourcesShared}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{p.studentCount}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{formatNumber(p.totalViews)}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{formatNumber(p.totalDownloads)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold text-slate-800">{p.avgCompletion}%</span>
                      </td>
                    </tr>
                  ))}
                {programMetrics.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No program data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'mentors' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-4 py-3 text-left"><SortHeader field="name" label="Mentor" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="resourcesUploaded" label="Uploaded" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalViews" label="Views" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalDownloads" label="Downloads" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalFavorites" label="Favorites" /></th>
                  <th className="px-4 py-3 text-center"><SortHeader field="totalCompletions" label="Completions" /></th>
                </tr>
              </thead>
              <tbody>
                {mentorMetrics
                  .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => {
                    const key = sortField as keyof typeof a;
                    const val = a[key] ?? 0;
                    const valB = b[key] ?? 0;
                    return sortDir === 'asc' ? (val > valB ? 1 : -1) : (val < valB ? 1 : -1);
                  })
                  .map(m => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-purple-600">{m.name[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-800">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{m.resourcesUploaded}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{formatNumber(m.totalViews)}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{formatNumber(m.totalDownloads)}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{formatNumber(m.totalFavorites)}</td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-slate-800">{m.totalCompletions}</td>
                    </tr>
                  ))}
                {mentorMetrics.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No mentor data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceAnalyticsPanel;
