import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PriorityRuleItem } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Sliders, Sparkles, Check, CheckCircle2, AlertCircle, Play } from 'lucide-react';

export const AdminRulesPage: React.FC = () => {
  const [rules, setRules] = useState<PriorityRuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Interactive Playground Test state
  const [testTitle, setTestTitle] = useState('Sparks from live electrical transformer near school');
  const [testDesc, setTestDesc] = useState('Snapped cable sparking on pavement during morning student arrival');
  const [testDanger, setTestDanger] = useState(true);
  const [testFacility, setTestFacility] = useState(true);
  const [testFacilityType, setTestFacilityType] = useState('school');
  const [testDuration, setTestDuration] = useState(3);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchRules = () => {
    api.request<any>('/priority/rules')
      .then((res) => setRules(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleStartEdit = (r: PriorityRuleItem) => {
    setEditingRuleId(r.id);
    setEditWeight(r.weight);
  };

  const handleSaveRule = async (ruleId: number) => {
    setIsSaving(true);
    setSaveSuccess('');
    try {
      await api.request(`/priority/rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ weight: editWeight }),
      });
      setEditingRuleId(null);
      setSaveSuccess('Rule weight updated successfully in active engine.');
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to update rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRuleActive = async (rule: PriorityRuleItem) => {
    await api.request(`/priority/rules/${rule.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !rule.is_active }),
    });
    fetchRules();
  };

  const handleRunPlayground = async () => {
    setIsTesting(true);
    try {
      const res: any = await api.request('/priority/test-assessment', {
        method: 'POST',
        body: JSON.stringify({
          title: testTitle,
          description: testDesc,
          immediate_danger: testDanger,
          is_essential_facility: testFacility,
          facility_type: testFacilityType,
          reported_duration_days: testDuration,
        }),
      });
      setTestResult(res.data);
    } catch (err: any) {
      alert('Test assessment failed.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explainable Priority Rules</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable scoring weights and deterministic conditions. Changes take effect immediately without opaque retraining.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Rules Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader
          title="Active Priority Weights Configuration"
          subtitle="Score sums are clamped strictly between 0 and 100: LOW (0–39), MEDIUM (40–69), HIGH (70–100)"
        />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={5} />
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3">Rule Key</th>
                  <th className="px-5 py-3">Condition & Description</th>
                  <th className="px-5 py-3 text-center">Configured Weight</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono font-bold text-sky-800">{r.rule_key}</td>
                    <td className="px-5 py-3 max-w-sm">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-[11px] text-slate-500">{r.description}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {editingRuleId === r.id ? (
                        <input
                          type="number"
                          value={editWeight}
                          onChange={(e) => setEditWeight(Number(e.target.value))}
                          className="w-16 text-center border border-slate-300 rounded p-1 font-bold font-mono text-xs"
                        />
                      ) : (
                        <span className="font-mono font-bold text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{r.weight}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editingRuleId === r.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="primary" onClick={() => handleSaveRule(r.id)} isLoading={isSaving}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRuleId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleStartEdit(r)}>
                            Edit Weight
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleRuleActive(r)}
                            className="text-xs"
                          >
                            {r.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Interactive Rules Testing Playground */}
      <Card className="shadow-xs border-indigo-200 bg-indigo-50/20">
        <CardHeader
          title="Interactive Rule Scoring Playground"
          subtitle="Test how current weights evaluate simulated grievances before applying to live cases"
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Simulated Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Simulated Description</label>
                <textarea
                  rows={2}
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testDanger}
                    onChange={(e) => setTestDanger(e.target.checked)}
                    className="accent-slate-900"
                  />
                  Immediate Danger
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testFacility}
                    onChange={(e) => setTestFacility(e.target.checked)}
                    className="accent-slate-900"
                  />
                  Essential Facility
                </label>
              </div>

              <Button size="sm" variant="primary" onClick={handleRunPlayground} isLoading={isTesting}>
                <Play className="w-3.5 h-3.5 mr-1" /> Run Evaluation
              </Button>
            </div>

            {/* Test Result Display */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-900">Computed Simulation Result</h4>
              {testResult ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Score: {testResult.score}/100
                    </span>
                    <span className="font-bold text-red-700 uppercase">{testResult.level}</span>
                  </div>
                  <p className="text-slate-600 italic">"{testResult.summary}"</p>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="font-semibold block mb-1">Fired Rules ({testResult.fired_rules?.length}):</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {testResult.fired_rules?.map((fr: any, idx: number) => (
                        <li key={idx}>
                          <strong>{fr.name}</strong> (+{fr.points} pts) — {fr.evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">Click 'Run Evaluation' to see live scoring breakdown.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
