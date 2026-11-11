import React, { useState } from 'react';
import { PriorityAssessment, PriorityOverride, PriorityLevel } from '../../types';
import { PriorityBadge } from '../ui/PriorityBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { CheckCircle2, AlertCircle, HelpCircle, RefreshCw, ShieldAlert, History } from 'lucide-react';

interface PriorityExplainPanelProps {
  currentPriority: PriorityLevel;
  currentScore: number;
  assessment?: PriorityAssessment;
  overrides?: PriorityOverride[];
  onReassess?: () => Promise<void>;
  onOverride?: (newLevel: PriorityLevel, newScore: number, reason: string) => Promise<void>;
  canOverride?: boolean;
}

export const PriorityExplainPanel: React.FC<PriorityExplainPanelProps> = ({
  currentPriority,
  currentScore,
  assessment,
  overrides = [],
  onReassess,
  onOverride,
  canOverride = false,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<PriorityLevel>('HIGH');
  const [overrideScore, setOverrideScore] = useState(80);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReassessing, setIsReassessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason || overrideReason.trim().length < 10) {
      setErrorMsg('A detailed justification reason (minimum 10 characters) is required to override.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (onOverride) {
        await onOverride(overrideLevel, overrideScore, overrideReason);
        setShowOverrideModal(false);
        setOverrideReason('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit priority override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassessClick = async () => {
    if (!onReassess) return;
    setIsReassessing(true);
    try {
      await onReassess();
    } finally {
      setIsReassessing(false);
    }
  };

  const firedRules = assessment?.fired_rules || [];
  const missingInfo = assessment?.missing_information
    ? assessment.missing_information.split(';').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader
        title="Explainable Priority Assessment"
        subtitle={`Deterministic scoring engine v${assessment?.engine_version || '1.0.0'}`}
        action={
          <div className="flex items-center gap-2">
            {canOverride && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOverrideModal(true)}
                className="text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Override Priority
              </Button>
            )}
            {onReassess && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReassessClick}
                isLoading={isReassessing}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reassess
              </Button>
            )}
          </div>
        }
      />

      <CardContent className="space-y-5">
        {/* Priority Score Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Computed Severity Status</div>
            <div className="flex items-center gap-3 mt-1.5">
              <PriorityBadge level={currentPriority} score={currentScore} />
              <span className="text-sm text-slate-600">
                Score: <strong className="text-slate-900">{currentScore}</strong> / 100
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 max-w-md md:text-right">
            {assessment?.summary || 'Assessed via deterministic rule engine. No black-box guesses.'}
          </div>
        </div>

        {/* Individual Fired Rules */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Triggered Explainability Rules ({firedRules.length})
          </h4>
          {firedRules.length === 0 ? (
            <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-100">
              No specific hazard rules triggered. Baseline municipal queue score applied.
            </p>
          ) : (
            <div className="space-y-2.5">
              {firedRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-md shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{rule.name}</span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                        +{rule.points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{rule.explanation}</p>
                    <div className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded inline-block font-mono">
                      Signal evidence: {rule.evidence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Information / Uncertainty Flags */}
        {missingInfo.length > 0 && (
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md">
            <h5 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Missing Information / Uncertainty Notes
            </h5>
            <ul className="list-disc list-inside text-xs text-amber-900 space-y-0.5">
              {missingInfo.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Override History if any */}
        {overrides.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Officer Override Audit History ({overrides.length})
            </h4>
            <div className="space-y-2">
              {overrides.map((ov, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="flex items-center justify-between font-medium text-slate-800">
                    <span>
                      Changed from <strong className="text-slate-600">{ov.previous_level}</strong> to{' '}
                      <strong className="text-red-700">{ov.new_level}</strong> ({ov.new_score}/100)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(ov.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 italic">"{ov.reason}"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">By: {ov.actor_name || 'Authorized Officer'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Override Assessment Priority
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Officers may override automated suggestions based on field verification. An immutable audit record with your
              reason will be saved.
            </p>

            <form onSubmit={handleOverrideSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Priority Level</label>
                <select
                  value={overrideLevel}
                  onChange={(e) => {
                    const lvl = e.target.value as PriorityLevel;
                    setOverrideLevel(lvl);
                    if (lvl === 'HIGH') setOverrideScore(85);
                    else if (lvl === 'MEDIUM') setOverrideScore(55);
                    else setOverrideScore(25);
                  }}
                  className="w-full text-sm border border-slate-300 rounded px-3 py-2 bg-white"
                >
                  <option value="HIGH">HIGH (Urgent / Critical)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Impact)</option>
                  <option value="LOW">LOW (Standard Civic Queue)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Score: <span className="font-mono text-slate-900">{overrideScore}/100</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-full accent-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Justification Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State ground evidence, site inspection results, or public urgency factors..."
                  className="w-full text-xs border border-slate-300 rounded p-2.5"
                  required
                />
              </div>

              {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverrideModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Confirm Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
