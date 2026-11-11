import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Complaint, User, Department, PriorityLevel, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { PriorityExplainPanel } from '../../components/explainability/PriorityExplainPanel';
import { ComplaintMap } from '../../components/maps/ComplaintMap';
import {
  ArrowLeft,
  Building2,
  User as UserIcon,
  Phone,
  Clock,
  Calendar,
  MapPin,
  FileText,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
  Users,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export const OfficerCasePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departmentOfficers, setDepartmentOfficers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [transitions, setTransitions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOfficerId, setAssignOfficerId] = useState<number | ''>('');
  const [transferDeptId, setTransferDeptId] = useState<number | ''>('');
  const [assignReason, setAssignReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Notes state
  const [noteBody, setNoteBody] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'public'>('internal');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchCase = async () => {
    try {
      const res: any = await api.request(`/complaints/${id}`);
      const caseData: Complaint = res.data;
      setComplaint(caseData);

      // Fetch officers in this department
      if (caseData.department_id) {
        api.request<any>(`/assignments/department-officers/${caseData.department_id}`)
          .then((oRes) => setDepartmentOfficers(oRes.data || []))
          .catch(() => {});
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load case data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();

    // Fetch allowed workflow transitions
    api.request<any>('/workflow/transitions')
      .then((tRes) => setTransitions(tRes.data?.transitions || {}))
      .catch(() => {});

    // Fetch departments for transfers
    api.request<any>('/departments')
      .then((dRes) => setDepartments(dRes.data || []))
      .catch(() => {});
  }, [id]);

  const allowedNextStatuses = complaint ? transitions[complaint.status] || [] : [];

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.request(`/complaints/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: targetStatus,
          public_note: publicNote.trim() || undefined,
          internal_note: internalNote.trim() || undefined,
          resolution_summary: targetStatus === 'RESOLVED' ? resolutionSummary.trim() : undefined,
        }),
      });
      setTargetStatus('');
      setPublicNote('');
      setInternalNote('');
      setResolutionSummary('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to update case status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      await api.request(`/complaints/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          officer_id: assignOfficerId !== '' ? Number(assignOfficerId) : undefined,
          department_id: transferDeptId !== '' ? Number(transferDeptId) : undefined,
          reason: assignReason.trim(),
        }),
      });
      setShowAssignModal(false);
      setAssignReason('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePriorityOverride = async (newLevel: PriorityLevel, newScore: number, reason: string) => {
    await api.request(`/complaints/${id}/override-priority`, {
      method: 'POST',
      body: JSON.stringify({ new_level: newLevel, new_score: newScore, reason }),
    });
    fetchCase();
  };

  const handleReassess = async () => {
    await api.request(`/complaints/${id}/reassess`, { method: 'POST' });
    fetchCase();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setIsAddingNote(true);
    try {
      await api.request(`/complaints/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: noteBody.trim(), note_type: noteType }),
      });
      setNoteBody('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to add note.');
    } finally {
      setIsAddingNote(false);
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
        <p className="text-xs text-slate-500">{errorMsg || 'Complaint record not accessible.'}</p>
        <Link to="/officer/complaints">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Reference, Status, & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/officer/complaints" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Queue
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
              {complaint.reference_number}
            </span>
            <StatusBadge status={complaint.status} size="md" />
            <PriorityBadge level={complaint.current_priority} score={complaint.priority_score} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">{complaint.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssignModal(true)}
            className="text-xs font-semibold"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Assign / Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview & Citizen Contact */}
          <Card className="shadow-xs">
            <CardHeader
              title="Citizen Submission Information"
              subtitle={`Submitted by ${complaint.citizen_name || 'Citizen'} on ${new Date(complaint.created_at).toLocaleString()}`}
            />
            <CardContent className="space-y-4">
              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {complaint.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Department</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{complaint.department_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Category</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{complaint.category_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Citizen Contact Phone</span>
                  <span className="font-semibold text-slate-900 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {complaint.contact_phone || 'Unspecified'}
                  </span>
                </div>
                {complaint.approx_location && (
                  <div className="sm:col-span-3">
                    <span className="text-slate-500 block font-medium">Reported Location</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {complaint.approx_location}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Explainability Engine Panel */}
          <PriorityExplainPanel
            currentPriority={complaint.current_priority}
            currentScore={complaint.priority_score}
            assessment={complaint.priority_assessment}
            overrides={complaint.priority_overrides}
            onReassess={handleReassess}
            onOverride={handlePriorityOverride}
            canOverride={true}
          />

          {/* Evidence Files */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <Card className="shadow-xs">
              <CardHeader title={`Case Evidence & Attachments (${complaint.evidence.length})`} />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complaint.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">{ev.original_filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(ev.byte_size / 1024).toFixed(0)} KB • Checksum: {ev.checksum.substring(0, 10)}...
                        </div>
                      </div>
                      <a
                        href={`/api/v1/complaints/${complaint.id}/evidence/${ev.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white rounded border border-slate-200 text-slate-600 hover:text-sky-600"
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

          {/* Similar Complaints Suggested by TF-IDF / Geolocation */}
          {complaint.similar_cases && complaint.similar_cases.length > 0 && (
            <Card className="shadow-xs border-amber-200">
              <CardHeader
                title={`Potentially Related / Duplicate Cases (${complaint.similar_cases.length})`}
                subtitle="Suggested for officer review. Not automatically merged or suppressed."
              />
              <CardContent>
                <div className="space-y-3">
                  {complaint.similar_cases.map((sim) => (
                    <div
                      key={sim.id}
                      className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-900">{sim.reference_number}</span>
                          <StatusBadge status={sim.status} />
                          <PriorityBadge level={sim.priority} />
                        </div>
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {Math.round(sim.similarity_score * 100)}% match
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900">{sim.title}</h5>
                      <p className="text-slate-600 italic">"{sim.reason}"</p>
                      <div className="flex items-center justify-between pt-1">
                        <Link
                          to={`/officer/complaints/${sim.similar_complaint_id}`}
                          className="text-sky-600 hover:text-sky-700 font-semibold"
                        >
                          Inspect Related Case →
                        </Link>
                        <span className="text-[11px] text-slate-500">
                          Status: <strong className="uppercase">{sim.relationship_status}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Officer & Citizen Notes Workspace */}
          <Card className="shadow-xs">
            <CardHeader title="Case Notes & Field Log" subtitle="Record internal officer notes or public updates" />
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {complaint.notes?.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      n.note_type === 'internal'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className={n.note_type === 'internal' ? 'text-amber-900' : 'text-slate-800'}>
                        {n.author_name} ({n.note_type === 'internal' ? 'Internal Officer Note' : 'Public Note'})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="note_scope"
                      checked={noteType === 'internal'}
                      onChange={() => setNoteType('internal')}
                      className="accent-slate-900"
                    />
                    Internal Only (Hidden from Citizen)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="note_scope"
                      checked={noteType === 'public'}
                      onChange={() => setNoteType('public')}
                      className="accent-slate-900"
                    />
                    Public Note (Visible to Citizen)
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Record site inspection results, contractor contact, or public remark..."
                  className="w-full text-xs border border-slate-300 rounded p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
                <Button type="submit" variant="primary" size="sm" isLoading={isAddingNote}>
                  <Send className="w-3.5 h-3.5 mr-1" /> Post Note
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Workflow Transition Action & Metadata */}
        <div className="space-y-6">
          {/* Action Box: Transition Workflow Status */}
          <Card className="shadow-xs border-sky-200 bg-sky-50/20">
            <CardHeader title="Advance Case Lifecycle" subtitle="Valid state machine transitions" />
            <CardContent>
              {allowedNextStatuses.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
                  Case is in final state '{complaint.status}'. Reopen required to transition.
                </div>
              ) : (
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Next Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                      required
                    >
                      <option value="">-- Select next status --</option>
                      {allowedNextStatuses.map((st) => (
                        <option key={st} value={st}>
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetStatus === 'RESOLVED' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Resolution Summary (Mandatory) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        placeholder="Detail the exact corrective actions taken, contractor work, or inspection result..."
                        className="w-full text-xs border border-emerald-300 rounded p-2 bg-white"
                        required
                        minLength={10}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Public Update Note (Sent to Citizen)
                    </label>
                    <input
                      type="text"
                      value={publicNote}
                      onChange={(e) => setPublicNote(e.target.value)}
                      placeholder="E.g., Inspection team on-site..."
                      className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full font-semibold"
                    isLoading={isUpdatingStatus}
                    disabled={!targetStatus}
                  >
                    Execute Status Transition
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Current Assignment Card */}
          <Card className="shadow-xs">
            <CardHeader title="Current Assignment" />
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-900 block mt-0.5">{complaint.department_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Officer</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {complaint.assigned_officer_name || <span className="text-slate-400 italic">Unassigned</span>}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignModal(true)}
                className="w-full text-xs mt-2"
              >
                Reassign Officer / Department
              </Button>
            </CardContent>
          </Card>

          {/* Location Map */}
          {complaint.latitude && complaint.longitude && (
            <Card className="shadow-xs">
              <CardHeader title="Location Map" />
              <CardContent>
                <ComplaintMap
                  initialLat={complaint.latitude}
                  initialLng={complaint.longitude}
                  title={complaint.reference_number}
                  className="h-44 w-full rounded border border-slate-200"
                />
              </CardContent>
            </Card>
          )}

          {/* Status Progression Timeline */}
          <Card className="shadow-xs">
            <CardHeader title="Lifecycle Audit Trail" />
            <CardContent>
              <div className="relative border-l-2 border-slate-200 ml-2 space-y-4">
                {complaint.status_history?.map((h) => (
                  <div key={h.id} className="relative pl-5">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-white" />
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={h.new_status} />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">By: {h.actor_name}</div>
                      {h.public_note && <p className="text-slate-700 mt-0.5">{h.public_note}</p>}
                      {h.internal_note && (
                        <p className="text-amber-800 bg-amber-50 p-1.5 rounded mt-1 text-[11px]">
                          [Internal]: {h.internal_note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment / Department Transfer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              Assign Officer or Transfer Department
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an officer within the department or transfer jurisdiction to another municipal authority.
            </p>

            <form onSubmit={handleAssignmentSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Officer ({complaint.department_name})
                </label>
                <select
                  value={assignOfficerId}
                  onChange={(e) => setAssignOfficerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="">-- Keep Current / Unassigned --</option>
                  {departmentOfficers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Transfer to Another Department
                </label>
                <select
                  value={transferDeptId}
                  onChange={(e) => setTransferDeptId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="">-- No Department Transfer --</option>
                  {departments
                    .filter((d) => d.id !== complaint.department_id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Transfer / Assignment
                </label>
                <textarea
                  rows={2}
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="State operational reason or jurisdiction handoff details..."
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignModal(false)}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isAssigning}>
                  Save Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
