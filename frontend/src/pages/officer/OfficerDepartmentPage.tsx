import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../features/auth/AuthContext';
import { User, Department } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Building2, Users, Mail, Shield, CheckCircle } from 'lucide-react';

export const OfficerDepartmentPage: React.FC = () => {
  const { user } = useAuth();
  const [officers, setOfficers] = useState<User[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.department_id) {
      Promise.all([
        api.request<any>(`/departments/${user.department_id}`),
        api.request<any>(`/assignments/department-officers/${user.department_id}`),
      ])
        .then(([deptRes, offRes]) => {
          setDepartment(deptRes.data);
          setOfficers(offRes.data || []);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Jurisdiction & Staff</h1>
        <p className="text-xs text-slate-500 mt-0.5">Officers, operational scopes, and departmental staff roster</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="space-y-6">
          {department && (
            <Card className="shadow-xs bg-white">
              <CardHeader
                title={department.name}
                subtitle={`Operational Code: ${department.code}`}
                action={
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Authority
                  </span>
                }
              />
              <CardContent className="text-xs text-slate-600 leading-relaxed">
                {department.description || 'Designated municipal authority for public service infrastructure.'}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xs overflow-hidden">
            <CardHeader title={`Department Officers Roster (${officers.length})`} />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {officers.map((off) => (
                  <div key={off.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {off.name}
                        {off.id === user?.id && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {off.email}
                      </div>
                    </div>
                    <span className="font-mono uppercase text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {off.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
