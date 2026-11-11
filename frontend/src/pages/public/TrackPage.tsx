import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Search, ShieldAlert, CheckCircle2, Clock, MapPin, Building, AlertCircle } from 'lucide-react';

export const TrackPage: React.FC = () => {
  const [reference, setReference] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);

    if (!reference.trim()) {
      setErrorMsg('Please enter a valid reference number (e.g., CR-20261025-XXXX).');
      return;
    }

    if (!phoneLast4.trim() && !email.trim()) {
      setErrorMsg('Verification required: please provide either the last 4 digits of your phone or your email.');
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await api.request(`/complaints/track/${reference.trim().toUpperCase()}`, {
        method: 'POST',
        body: JSON.stringify({
          phone_last4: phoneLast4.trim(),
          email: email.trim(),
        }),
      });
      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Grievance not found or verification credentials did not match.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Secure Grievance Tracking</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Enter your reference ID and matching verification detail to inspect live departmental actions and audit timelines.
        </p>
      </div>

      {/* Tracker Search Form */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grievance Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="CR-20261025-A7K9"
                className="w-full font-mono text-sm uppercase px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last 4 Digits of Phone Number
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value)}
                  placeholder="3210"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Citizen Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="md" className="w-full font-semibold" isLoading={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Verify & Track Status
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tracking Result View */}
      {result && (
        <Card className="border-slate-200 shadow-md">
          <CardHeader
            title={result.title}
            subtitle={`Ref: ${result.reference_number}`}
            action={<StatusBadge status={result.status} size="md" />}
          />
          <CardContent className="space-y-6">
            {/* Meta tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Assigned Department</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {result.department || 'Under Triage'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{result.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Submission Timestamp</span>
                <span className="font-semibold text-slate-800 font-mono mt-0.5 block">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Resolution summary if resolved */}
            {result.resolution_summary && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Official Departmental Resolution Summary
                </h4>
                <p className="text-xs text-emerald-950 leading-relaxed">{result.resolution_summary}</p>
                {result.resolved_at && (
                  <span className="text-[11px] text-emerald-700 block mt-1 font-mono">
                    Resolved at: {new Date(result.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Audit Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Public Case Progression Timeline
              </h4>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {result.timeline?.map((step: any, i: number) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-200" />
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={step.status} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(step.date).toLocaleString()}
                        </span>
                      </div>
                      {step.note && <p className="text-xs text-slate-600 mt-1">{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
