import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { AnalyticsSummary, Complaint } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Eye,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const OfficerDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [assignedCases, setAssignedCases] = useState<Complaint[]>([]);
  const [highPriorityCases, setHighPriorityCases] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/analytics/summary'),
      api.request<any>('/complaints?scope=assigned_only&per_page=5'),
      api.request<any>('/complaints?priority=HIGH&per_page=5'),
    ])
      .then(([summaryRes, assignedRes, highRes]) => {
        setSummary(summaryRes.data);
        setAssignedCases(assignedRes.data?.items || []);
        setHighPriorityCases(highRes.data?.items || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const priorityChartData = [
    { name: 'High Priority', count: summary?.priority_breakdown?.HIGH || 0, color: '#dc2626' },
    { name: 'Medium Priority', count: summary?.priority_breakdown?.MEDIUM || 0, color: '#d97706' },
    { name: 'Standard Priority', count: summary?.priority_breakdown?.LOW || 0, color: '#64748b' },
  ];

  return (
    <div className="space-y-8">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Departmental Workstation</h1>
          <p className="text-xs text-slate-500 mt-1">Live database analytics, assigned case queue, and urgent SLA deadlines</p>
        </div>
        <div className="flex gap-2">
          <Link to="/officer/complaints">
            <Button variant="primary" size="md" className="font-semibold shadow-xs">
              <Inbox className="w-4 h-4 mr-2" /> Full Case Queue
            </Button>
          </Link>
          <Link to="/officer/analytics">
            <Button variant="outline" size="md" className="font-semibold">
              <TrendingUp className="w-4 h-4 mr-2" /> Analytics & Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Department Cases</span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {summary?.total_complaints || 0}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-600">High Severity Flags</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-extrabold text-red-600 mt-2">
              {summary?.priority_breakdown?.HIGH || 0}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600">SLA Overdue Cases</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">
              {summary?.overdue_count || 0}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600">Resolution Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-2">
              {summary?.resolution_rate_percent || 0}%
            </div>
          </div>
        </div>
      )}

      {/* Charts & Queue Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Assigned Work & High Priority Warnings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent / High Priority Notice Queue */}
          <Card className="shadow-xs border-red-200">
            <CardHeader
              title="Urgent Public Safety & Emergency Cases"
              subtitle="Grievances with live spark, open manhole, or critical facility signals"
              action={
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {highPriorityCases.length} Cases
                </span>
              }
            />
            <CardContent className="p-0">
              {highPriorityCases.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No active high-priority emergencies reported.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {highPriorityCases.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            {c.reference_number}
                          </span>
                          <StatusBadge status={c.status} />
                          <PriorityBadge level={c.current_priority} score={c.priority_score} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mt-1">{c.title}</h4>
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.approx_location || 'Location unspecified'} • Filed {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Link to={`/officer/complaints/${c.id}`} className="shrink-0">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Case
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned to Me Queue */}
          <Card className="shadow-xs">
            <CardHeader
              title="Directly Assigned to You"
              subtitle="Grievances allocated for your inspection and status updates"
              action={
                <Link to="/officer/complaints" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0">
              {assignedCases.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  You currently have no unhandled cases assigned directly to your desk.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignedCases.map((c) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {c.reference_number}
                          </span>
                          <StatusBadge status={c.status} />
                          <PriorityBadge level={c.current_priority} score={c.priority_score} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate mt-1">{c.title}</h4>
                        <div className="text-[11px] text-slate-500 truncate">
                          Due: {c.due_at ? new Date(c.due_at).toLocaleDateString() : 'N/A'} • {c.category_name}
                        </div>
                      </div>
                      <Link to={`/officer/complaints/${c.id}`} className="shrink-0">
                        <Button variant="outline" size="sm" className="text-xs">
                          Manage Case
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Priority Breakdown Chart */}
        <div>
          <Card className="shadow-xs">
            <CardHeader title="Priority Distribution" subtitle="Actual breakdown across all department cases" />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Median Ack Time:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {summary?.median_acknowledgement_hours !== null && summary?.median_acknowledgement_hours !== undefined
                      ? `${summary.median_acknowledgement_hours} Hours`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Median Resolution:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {summary?.median_resolution_hours !== null && summary?.median_resolution_hours !== undefined
                      ? `${summary.median_resolution_hours} Hours`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
