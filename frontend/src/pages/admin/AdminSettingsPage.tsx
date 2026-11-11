import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Settings, RefreshCw, CheckCircle2, ShieldCheck, Database, Server } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [isCheckingSla, setIsCheckingSla] = useState(false);
  const [slaResult, setSlaResult] = useState<string | null>(null);

  const handleTriggerSla = async () => {
    setIsCheckingSla(true);
    setSlaResult(null);
    try {
      const res: any = await api.request('/workflow/check-sla', { method: 'POST' });
      setSlaResult(res.message || 'SLA evaluation completed successfully.');
    } catch (err: any) {
      setSlaResult(`Error triggering SLA check: ${err.message}`);
    } finally {
      setIsCheckingSla(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration & Maintenance</h1>
        <p className="text-xs text-slate-500 mt-0.5">Runtime parameters, scheduled job triggers, and database diagnostics</p>
      </div>

      {slaResult && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded text-xs text-sky-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{slaResult}</span>
        </div>
      )}

      {/* SLA Maintenance trigger */}
      <Card className="shadow-xs">
        <CardHeader
          title="On-Demand SLA Escalation Job"
          subtitle="Manually trigger evaluation of overdue complaints past 24-hour breach threshold"
        />
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-600">
            Cases exceeding resolution targets by more than 24 hours will automatically advance to ESCALATED status
            and notify assigned departmental supervisors.
          </p>
          <Button size="sm" variant="primary" onClick={handleTriggerSla} isLoading={isCheckingSla}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run SLA Escalation Check
          </Button>
        </CardContent>
      </Card>

      {/* Runtime Environment Info */}
      <Card className="shadow-xs">
        <CardHeader title="Runtime Diagnostics & Environment" />
        <CardContent>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Application Environment</span>
              <span className="font-mono font-bold text-slate-900">development / academic</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Explainable Priority Engine</span>
              <span className="font-mono font-bold text-emerald-700">v1.0.0 (Deterministic)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Database Adapter</span>
              <span className="font-mono font-bold text-slate-900">SQLite Local Storage / PostgreSQL Ready</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">File Evidence Storage</span>
              <span className="font-mono font-bold text-slate-900">storage/uploads (Random UUIDs + SHA-256)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Supported Languages</span>
              <span className="font-mono font-bold text-slate-900">English (en) • தமிழ் (ta)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
