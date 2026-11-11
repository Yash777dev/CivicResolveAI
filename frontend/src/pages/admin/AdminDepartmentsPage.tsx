import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Department, Category } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Building2, Plus, Clock, Tag } from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Department modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catCode, setCatCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catDeptId, setCatDeptId] = useState<number | ''>('');
  const [catSla, setCatSla] = useState(48);
  const [catKeywords, setCatKeywords] = useState('');

  const fetchAll = () => {
    setIsLoading(true);
    Promise.all([api.request<any>('/departments'), api.request<any>('/categories')])
      .then(([dRes, cRes]) => {
        setDepartments(dRes.data || []);
        setCategories(cRes.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/departments', {
        method: 'POST',
        body: JSON.stringify({ code: deptCode, name: deptName, description: deptDesc }),
      });
      setShowDeptModal(false);
      setDeptCode('');
      setDeptName('');
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create department.');
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const kwList = catKeywords.split(',').map((s) => s.trim()).filter(Boolean);
      await api.request('/categories', {
        method: 'POST',
        body: JSON.stringify({
          code: catCode,
          name: catName,
          department_id: Number(catDeptId),
          default_sla_hours: Number(catSla),
          keywords: kwList,
        }),
      });
      setShowCatModal(false);
      setCatCode('');
      setCatName('');
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Departments & Service Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure municipal authorities, category mappings, and statutory SLA resolution hours
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowDeptModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Department
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowCatModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="space-y-6">
          {departments.map((dept) => {
            const deptCats = categories.filter((c) => c.department_id === dept.id);
            return (
              <Card key={dept.id} className="shadow-xs overflow-hidden">
                <CardHeader
                  title={dept.name}
                  subtitle={dept.description || 'Municipal Department'}
                  action={
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                  }
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="px-5 py-2.5">Category Name</th>
                          <th className="px-5 py-2.5">Code</th>
                          <th className="px-5 py-2.5">Default SLA</th>
                          <th className="px-5 py-2.5">Multilingual Keywords</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deptCats.map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="px-5 py-2.5 font-bold text-slate-900">{cat.name}</td>
                            <td className="px-5 py-2.5 font-mono text-slate-500">{cat.code}</td>
                            <td className="px-5 py-2.5 font-mono font-bold text-emerald-700">
                              {cat.default_sla_hours} Hours
                            </td>
                            <td className="px-5 py-2.5 text-slate-500">
                              {cat.keywords.slice(0, 4).join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Department</h3>
            <form onSubmit={handleCreateDept} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code (Uppercase)</label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  placeholder="E.g., PARKS_DEPT"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Parks & Recreation Authority"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add Category</h3>
            <form onSubmit={handleCreateCat} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department</label>
                <select
                  value={catDeptId}
                  onChange={(e) => setCatDeptId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  required
                >
                  <option value="">-- Select department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code</label>
                <input
                  type="text"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="PARK_BENCHES"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Park Benches & Equipment"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default SLA (Hours)</label>
                <input
                  type="number"
                  value={catSla}
                  onChange={(e) => setCatSla(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Multilingual Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={catKeywords}
                  onChange={(e) => setCatKeywords(e.target.value)}
                  placeholder="park, bench, swing, பூங்கா"
                  className="w-full text-xs border border-slate-300 rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCatModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
