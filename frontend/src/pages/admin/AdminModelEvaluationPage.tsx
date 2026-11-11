import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { BrainCircuit, CheckCircle2, AlertTriangle, Layers, BarChart2 } from 'lucide-react';

export const AdminModelEvaluationPage: React.FC = () => {
  const [evalData, setEvalData] = useState<any>(null);
  const [isTrained, setIsTrained] = useState<boolean>(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.request<any>('/admin/model-evaluation')
      .then((res) => {
        setIsTrained(res.is_trained);
        setEvalData(res.data);
        setMessage(res.message || '');
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Machine Learning Classifier Evaluation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Validation metrics and confusion matrix for optional TF-IDF + Logistic Regression category classifier
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : !isTrained || !evalData ? (
        <Card className="shadow-xs p-8 text-center space-y-3">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No ML Model Evaluated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {message ||
              'Currently operating on the deterministic rule-based category taxonomy and priority engine. Run train_classifier.py in scripts/ to train a baseline model.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Status banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">{evalData.model_name}</h3>
                <span className="text-xs text-emerald-700">
                  Version {evalData.version} • Evaluated on {new Date(evalData.trained_at).toLocaleString()}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded">
              Test Set: {evalData.test_dataset_size} Samples
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Test Accuracy</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {(evalData.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Weighted Precision</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {evalData.precision.toFixed(3)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Weighted Recall</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {evalData.recall.toFixed(3)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">F1 Score</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {evalData.f1_score.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Confusion Matrix Table */}
          {evalData.confusion_matrix && evalData.confusion_matrix.length > 0 && (
            <Card className="shadow-xs overflow-hidden">
              <CardHeader
                title="Confusion Matrix"
                subtitle="Predicted vs Actual test classifications across holdout split"
              />
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="text-[11px] text-slate-500 mb-2 italic">
                    Rows: Actual categories • Columns: Model predictions
                  </div>
                  <table className="w-full text-center text-xs font-mono border border-slate-200">
                    <tbody className="divide-y divide-slate-100">
                      {evalData.confusion_matrix.map((row: number[], rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-slate-50">
                          {row.map((val: number, colIdx: number) => (
                            <td
                              key={colIdx}
                              className={`p-2 border-r border-slate-100 ${
                                rowIdx === colIdx && val > 0
                                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Academic Transparency Alert */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Academic CSE Note on Machine Learning vs Deterministic Rule Engine
            </h5>
            <p>
              In CivicResolve AI, category suggestions may utilize machine learning, but safety-critical priority scoring
              remains strictly explainable and rule-governed. This prevents opacity, hallucinated severities, and unaccountable decision-making.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
