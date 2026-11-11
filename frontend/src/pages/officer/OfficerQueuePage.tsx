import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Complaint, Category, ComplaintStatus, PriorityLevel } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Search, Filter, ArrowUpDown, Eye, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export const OfficerQueuePage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('priority'); // priority, due_at, created_at

  useEffect(() => {
    api.request<any>('/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const fetchQueue = () => {
    setIsLoading(true);
    let params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '15');
    if (search.trim()) params.set('search', search.trim());
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedPriority) params.set('priority', selectedPriority);
    if (selectedCategory) params.set('category_id', selectedCategory);
    params.set('sort_by', sortBy);

    api.request<any>(`/complaints?${params.toString()}`)
      .then((res) => {
        setComplaints(res.data?.items || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.total_pages || 1);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, [page, selectedStatus, selectedPriority, selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Grievance Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Departmental and assigned case inbox with multi-dimensional filtering
          </p>
        </div>
        <div className="text-xs font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-xs">
          Total Cases: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference number, title, description, or landmark..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="TRIAGED">Triaged</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="NEEDS_INFORMATION">Needs Info</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
              >
                <option value="priority">Priority Score (Highest first)</option>
                <option value="due_at">SLA Deadline (Urgent first)</option>
                <option value="created_at">Date Submitted (Newest first)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={5} />
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No cases matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Title & Location</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Assigned Officer</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sky-800 whitespace-nowrap">
                        {c.reference_number}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{c.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{c.approx_location || 'Unspecified'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                        {c.category_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge level={c.current_priority} score={c.priority_score} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {c.assigned_officer_name || <span className="italic text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                        {c.due_at ? (
                          <span className={new Date(c.due_at) < new Date() && c.status !== 'RESOLVED' && c.status !== 'CLOSED' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                            {new Date(c.due_at).toLocaleDateString()}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link to={`/officer/complaints/${c.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
