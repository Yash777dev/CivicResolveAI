import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Department, Category } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Building2, Clock, CheckCircle, Tag, ArrowRight } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.request<any>('/departments'),
      api.request<any>('/categories')
    ])
      .then(([deptRes, catRes]) => {
        setDepartments(deptRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Municipal Services & Grievance Taxonomy</h1>
        <p className="text-sm text-slate-500">
          Explore all recognized civic grievance categories, departmental jurisdictions, and statutory SLA resolution targets.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} className="h-32" />
      ) : (
        <div className="space-y-8">
          {departments.map((dept) => {
            const deptCats = categories.filter((c) => c.department_id === dept.id);
            return (
              <Card key={dept.id} className="shadow-xs overflow-hidden">
                <CardHeader
                  title={dept.name}
                  subtitle={dept.description || 'Public Service Operations Department'}
                  action={
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      CODE: {dept.code}
                    </span>
                  }
                />
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deptCats.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Target SLA: {cat.default_sla_hours} Hours</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {cat.keywords.slice(0, 3).map((kw, idx) => (
                              <span key={idx} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                                #{kw}
                              </span>
                            ))}
                          </div>
                          <Link to="/citizen/complaints/new">
                            <Button size="sm" variant="ghost" className="text-xs font-semibold text-sky-600 p-0 hover:bg-transparent">
                              File <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
