import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Complaint } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Star, RotateCcw, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [reopenRequested, setReopenRequested] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.request<any>(`/complaints/${id}`)
      .then((res) => setComplaint(res.data))
      .catch(() => {});
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (reopenRequested && (!reopenReason || reopenReason.trim().length < 10)) {
      setErrorMsg('A detailed reason (min 10 characters) is required to request reopening.');
      return;
    }

    setIsLoading(true);
    try {
      await api.request(`/complaints/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comments: comments.trim(),
          reopen_requested: reopenRequested,
          reopen_reason: reopenRequested ? reopenReason.trim() : undefined,
        }),
      });
      navigate(`/citizen/complaints/${id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <Link to={`/citizen/complaints/${id}`} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Case Details
      </Link>

      <Card className="shadow-md">
        <CardHeader
          title="Resolution Feedback & Citizen Rights"
          subtitle={complaint ? `Ref: ${complaint.reference_number} • ${complaint.title}` : 'Rate grievance redressal'}
        />
        <CardContent className="pt-4">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 5-star rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Satisfaction with Redressal Quality
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Unacceptable'}
                </span>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Citizen Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your experience regarding departmental promptness and field inspection..."
                className="w-full text-xs border border-slate-300 rounded p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            {/* Reopening request toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reopenRequested}
                  onChange={(e) => setReopenRequested(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 accent-rose-600"
                />
                <div>
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    Request Case Reopening
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Check if the resolution was incomplete or the civic hazard has recurred.
                  </span>
                </div>
              </label>

              {reopenRequested && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Ground Reason for Reopening <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="E.g., Water pressure resumed for 1 hour but pipe burst again; street remains flooded."
                    className="w-full text-xs border border-rose-200 rounded p-2 focus:ring-2 focus:ring-rose-500 bg-white"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                Submit Feedback
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
