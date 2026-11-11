import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Complaint } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  FilePlus,
  Inbox,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.request<any>('/complaints?per_page=20')
      .then((res) => setComplaints(res.data?.items || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'SUBMITTED' || c.status === 'TRIAGED').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  const reopened = complaints.filter((c) => c.status === 'REOPENED').length;

  return (
    <div className="space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Citizen Grievance Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Track submitted civic complaints and monitor departmental progress</p>
        </div>
        <Link to="/citizen/complaints/new">
          <Button variant="primary" size="md" className="font-semibold shadow-xs">
            <FilePlus className="w-4 h-4 mr-2" />
            File New Grievance
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Filed</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{total}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Action Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{pending}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-600">In Progress</span>
            <AlertCircle className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-600 mt-2">{inProgress}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{resolved}</div>
        </div>
      </div>

      {/* Grievances List */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader
          title="My Grievance Submissions"
          subtitle="Showing latest cases with real-time status and priority evaluations"
        />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={3} />
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">No Grievances Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have an unresolved civic issue with roads, water, power, or sanitation? File a grievance to begin.
              </p>
              <Link to="/citizen/complaints/new">
                <Button size="sm" variant="primary" className="mt-2">
                  File Your First Grievance
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {c.reference_number}
                      </span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge level={c.current_priority} score={c.priority_score} />
                      <span className="text-xs text-slate-500">
                        • {c.department_name || c.category_name}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Filed on {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      {c.due_at && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Target Due: {new Date(c.due_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/citizen/complaints/${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View Case
                      </Button>
                    </Link>
                    {(c.status === 'RESOLVED' || c.status === 'CLOSED') && (
                      <Link to={`/citizen/feedback/${c.id}`}>
                        <Button variant="secondary" size="sm" className="text-xs">
                          Feedback / Reopen
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
