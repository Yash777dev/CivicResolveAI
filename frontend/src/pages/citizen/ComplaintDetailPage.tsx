import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PriorityExplainPanel } from '../../components/explainability/PriorityExplainPanel';
import { ComplaintMap } from '../../components/maps/ComplaintMap';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  Send
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchComplaint = async () => {
    try {
      const res: any = await api.request(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load complaint details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await api.request(`/complaints/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: newNote.trim(), note_type: 'public' }),
      });
      setNewNote('');
      fetchComplaint();
    } catch (err: any) {
      alert(err.message || 'Failed to add follow-up note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={4} className="h-40" />;
  }

  if (errorMsg || !complaint) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Case Access Error</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'Complaint record could not be found.'}</p>
        <Link to="/citizen/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button and title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/citizen/dashboard" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Grievances
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
              {complaint.reference_number}
            </span>
            <StatusBadge status={complaint.status} size="md" />
            <PriorityBadge level={complaint.current_priority} score={complaint.priority_score} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{complaint.title}</h1>
        </div>

        {(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
          <Link to={`/citizen/feedback/${complaint.id}`}>
            <Button variant="secondary" size="md" className="font-semibold shadow-xs">
              Resolution Feedback / Reopen
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Complaint Details and Explainability */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Complaint Overview */}
          <Card className="shadow-xs">
            <CardHeader title="Grievance Details" subtitle={`Filed on ${new Date(complaint.created_at).toLocaleString()}`} />
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50/60 p-3.5 rounded border border-slate-100">
                  {complaint.description}
                </p>
              </div>

              {/* Department & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Department</span>
                  <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {complaint.department_name || 'General Municipal Administration'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Category</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                    {complaint.category_name}
                  </span>
                </div>
                {complaint.approx_location && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block font-medium">Reported Location</span>
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {complaint.approx_location}
                    </span>
                  </div>
                )}
              </div>

              {/* Resolution Summary banner */}
              {complaint.resolution_summary && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Official Resolution Summary
                  </h4>
                  <p className="text-xs text-emerald-950 leading-relaxed">{complaint.resolution_summary}</p>
                  <span className="text-[11px] text-emerald-700 block mt-1 font-mono">
                    Resolved at: {new Date(complaint.resolved_at!).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explainability Panel */}
          <PriorityExplainPanel
            currentPriority={complaint.current_priority}
            currentScore={complaint.priority_score}
            assessment={complaint.priority_assessment}
            overrides={complaint.priority_overrides}
            canOverride={false}
          />

          {/* Submitted Evidence Gallery */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <Card className="shadow-xs">
              <CardHeader title={`Attached Evidence Files (${complaint.evidence.length})`} />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complaint.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 truncate">
                        <div className="font-semibold text-slate-800 truncate">{ev.original_filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(ev.byte_size / 1024).toFixed(0)} KB • SHA-256: {ev.checksum.substring(0, 10)}...
                        </div>
                      </div>
                      <a
                        href={`/api/v1/complaints/${complaint.id}/evidence/${ev.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white rounded border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 transition-colors"
                        title="Download Evidence"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Citizen Follow-Up Notes Section */}
          <Card className="shadow-xs">
            <CardHeader title="Citizen Case Notes & Inquiries" subtitle="Visible to assigned departmental officers" />
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {complaint.notes?.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{n.author_name} ({n.author_role || 'Citizen'})</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Add an inquiry or update</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter factual follow-up details..."
                    className="flex-1 text-xs border border-slate-300 rounded px-3 py-2"
                  />
                  <Button type="submit" size="sm" variant="primary" isLoading={isSubmittingNote}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status Timeline & Location Map */}
        <div className="space-y-6">
          {/* Status Progression Timeline */}
          <Card className="shadow-xs">
            <CardHeader title="Status Timeline" />
            <CardContent>
              <div className="relative border-l-2 border-slate-200 ml-2 space-y-5">
                {complaint.status_history?.map((step) => (
                  <div key={step.id} className="relative pl-5">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-200" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={step.new_status} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {new Date(step.created_at).toLocaleString()}
                      </span>
                      {step.public_note && (
                        <p className="text-xs text-slate-600 mt-1 leading-normal">{step.public_note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Map if coordinates available */}
          {complaint.latitude && complaint.longitude && (
            <Card className="shadow-xs">
              <CardHeader title="Reported Location Map" />
              <CardContent>
                <ComplaintMap
                  initialLat={complaint.latitude}
                  initialLng={complaint.longitude}
                  title={complaint.reference_number}
                  className="h-48 w-full rounded border border-slate-200"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
