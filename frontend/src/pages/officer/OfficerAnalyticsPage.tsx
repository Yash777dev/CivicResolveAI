import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AnalyticsSummary } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Download,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
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
  Cell,
  Legend
} from 'recharts';

export const OfficerAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/analytics/summary'),
      api.request<any>('/analytics/categories'),
      api.request<any>('/analytics/departments'),
    ])
      .then(([sRes, cRes, dRes]) => {
        setSummary(sRes.data);
        setCategories(cRes.data || []);
        setDepartments(dRes.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportCsv = async () => {
    try {
      const token = sessionStorage.getItem('civic_access_token');
      const response = await fetch('/api/v1/analytics/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civicresolve_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to download CSV export.');
    }
  };

  const statusPieData = summary?.status_breakdown
    ? Object.entries(summary.status_breakdown).map(([st, cnt]) => ({
        name: st.replace('_', ' '),
        value: cnt,
      }))
    : [];

  const COLORS = ['#0284c7', '#6366f1', '#a855f7', '#f59e0b', '#10b981', '#64748b', '#ef4444'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SLA Performance Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database metrics calculated dynamically across municipal grievance lifecycles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv} className="font-semibold shadow-xs">
          <Download className="w-4 h-4 mr-1.5 text-sky-600" />
          Export Complaints (CSV)
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} className="h-64" />
      ) : (
        <>
          {/* Key SLA Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Complaints</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.total_complaints || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-medium">Overall Resolution Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.resolution_rate_percent || 0}%</div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-amber-600 font-medium">Overdue Rate</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{summary?.overdue_rate_percent || 0}%</div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Median Resolution Time</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {summary?.median_resolution_hours ? `${summary.median_resolution_hours}h` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card className="shadow-xs">
              <CardHeader title="Grievance Volume by Category" subtitle="Distribution across civic domains" />
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} layout="vertical" margin={{ left: 40, right: 20 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="category_name"
                        width={120}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card className="shadow-xs">
              <CardHeader title="Lifecycle Status Composition" subtitle="Current case workflow distribution" />
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Workload Table */}
          <Card className="shadow-xs overflow-hidden">
            <CardHeader title="Departmental Workload & Redressal Performance" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Department Name</th>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3 text-center">Total Volume</th>
                      <th className="px-5 py-3 text-center">Resolved Cases</th>
                      <th className="px-5 py-3 text-right">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{d.department_name}</td>
                        <td className="px-5 py-3 font-mono text-slate-500">{d.department_code}</td>
                        <td className="px-5 py-3 text-center font-bold text-slate-800">{d.total_cases}</td>
                        <td className="px-5 py-3 text-center text-emerald-700 font-bold">{d.resolved_cases}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                          {d.resolution_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
