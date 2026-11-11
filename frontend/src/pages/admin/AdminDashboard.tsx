import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { AnalyticsSummary } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Users,
  Building,
  Sliders,
  ShieldCheck,
  BrainCircuit,
  Inbox,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/analytics/summary'),
      api.request<any>('/admin/users'),
      api.request<any>('/departments'),
      api.request<any>('/priority/rules'),
    ])
      .then(([sRes, uRes, dRes, rRes]) => {
        setSummary(sRes.data);
        setUserCount(uRes.data?.total || 0);
        setDeptCount(dRes.data?.length || 0);
        setRuleCount(rRes.data?.length || 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const adminModules = [
    {
      title: 'User Management',
      desc: 'Provision officer and administrator accounts, assign departments, and manage access roles.',
      to: '/admin/users',
      icon: Users,
      count: `${userCount} Accounts`,
    },
    {
      title: 'Department & Taxonomy',
      desc: 'Configure municipal departments, complaint categories, keywords, and statutory SLA hours.',
      to: '/admin/departments',
      icon: Building,
      count: `${deptCount} Depts`,
    },
    {
      title: 'Configurable Priority Rules',
      desc: 'Modify explainable scoring weights (+30 emergency, +20 essential facility) and test live.',
      to: '/admin/rules',
      icon: Sliders,
      count: `${ruleCount} Rules`,
    },
    {
      title: 'Security Audit Logs',
      desc: 'Inspect tamper-evident log records of logins, assignments, status changes, and priority overrides.',
      to: '/admin/audit-logs',
      icon: ShieldCheck,
      count: 'Auditable',
    },
    {
      title: 'ML Model Evaluation',
      desc: 'Inspect TF-IDF + Logistic Regression category classifier accuracy, F1-scores, and confusion matrices.',
      to: '/admin/model-evaluation',
      icon: BrainCircuit,
      count: 'Evaluated',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Administration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          CivicResolve AI central governance, algorithm parameters, and operational integrity oversight
        </p>
      </div>

      {/* High-level system vitals */}
      {isLoading ? (
        <LoadingSkeleton count={4} className="h-24" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Total System Complaints</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.total_complaints || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-medium">Resolution Success</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.resolution_rate_percent || 0}%</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs text-amber-600 font-medium">Overdue Complaints</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{summary?.overdue_count || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs text-red-600 font-medium">High Emergency Flags</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{summary?.priority_breakdown?.HIGH || 0}</div>
          </div>
        </div>
      )}

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link
              key={i}
              to={m.to}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-sky-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-sky-50 transition-colors">
                    <Icon className="w-5 h-5 text-slate-700 group-hover:text-sky-600" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {m.count}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </div>

              <div className="text-xs font-semibold text-sky-600 flex items-center gap-1 pt-2 border-t border-slate-100">
                Manage Module <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
