import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { User, Department } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { UserPlus, Search, Shield, Building, Mail, CheckCircle2, X } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('officer');
  const [newDeptId, setNewDeptId] = useState<number | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = () => {
    setIsLoading(true);
    let params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', '15');
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);

    api.request<any>(`/admin/users?${params.toString()}`)
      .then((res) => {
        setUsers(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    api.request<any>('/departments')
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsCreating(true);
    try {
      await api.request('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          department_id: newDeptId !== '' ? Number(newDeptId) : undefined,
        }),
      });
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.account_status === 'active' ? 'suspended' : 'active';
    await api.request(`/admin/users/${user.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ account_status: nextStatus }),
    });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Account Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage administrative roles, department postings, and account status</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="font-semibold shadow-xs"
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> Provision Account
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 text-xs bg-white"
            >
              <option value="">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="officer">Department Officer</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrator</option>
            </select>
            <Button size="sm" variant="outline" onClick={fetchUsers}>
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {u.department_name || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                            u.account_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.account_status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                          className="text-xs"
                        >
                          {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              Provision Account
            </h3>
            <p className="text-xs text-slate-500 mt-1">Create an authorized officer or administrative account.</p>

            {modalError && <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">{modalError}</p>}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2"
                  required
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  >
                    <option value="officer">Officer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrator</option>
                    <option value="citizen">Citizen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs border border-slate-300 rounded p-2 bg-white"
                  >
                    <option value="">-- None / General --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
