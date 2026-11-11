import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AuditLogItem } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ShieldCheck, Search, ChevronLeft, ChevronRight, Terminal } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    let params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '25');
    if (actionFilter) params.set('action', actionFilter);

    api.request<any>(`/admin/audit-logs?${params.toString()}`)
      .then((res) => {
        setLogs(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident system activity records for administrative, status, and algorithmic events
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded">
          Total Log Entries: {total}
        </div>
      </div>

      {/* Filter */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex gap-3 text-xs">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-300 rounded px-3 py-1.5 bg-white"
          >
            <option value="">All Actions</option>
            <option value="user_login">User Logins</option>
            <option value="complaint_created">Complaint Submissions</option>
            <option value="status_updated">Status Changes</option>
            <option value="assignment_updated">Staff Assignments</option>
            <option value="priority_override">Priority Overrides</option>
            <option value="priority_reassessed">Priority Reassessments</option>
            <option value="priority_rule_updated">Rule Edits</option>
          </select>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={6} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No audit logs matching selection.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Actor</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target Resource</th>
                    <th className="px-5 py-3">Sanitized Metadata</th>
                    <th className="px-5 py-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-[11px] whitespace-nowrap text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actor_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{log.actor_email}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono font-bold text-sky-800">
                        {log.action}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                        {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}
                      </td>
                      <td className="px-5 py-3 max-w-xs font-mono text-[10px] text-slate-500 truncate">
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 25 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Page {page}</span>
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
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.length < 25}
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
