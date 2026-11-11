import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import {
  LayoutDashboard,
  FilePlus,
  ListOrdered,
  Bell,
  User,
  Inbox,
  BarChart3,
  Building,
  Sliders,
  Users,
  ShieldCheck,
  BrainCircuit,
  Settings,
  HelpCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role, user } = useAuth();
  const { t } = useI18n();

  const getLinks = () => {
    if (role === 'admin') {
      return [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'System Overview' },
        { to: '/admin/users', icon: Users, label: 'User Accounts' },
        { to: '/admin/departments', icon: Building, label: 'Departments & Taxonomy' },
        { to: '/admin/rules', icon: Sliders, label: 'Priority Rules' },
        { to: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Logs' },
        { to: '/admin/model-evaluation', icon: BrainCircuit, label: 'ML Evaluation' },
        { to: '/admin/settings', icon: Settings, label: 'App Settings' },
      ];
    }

    if (role === 'officer' || role === 'supervisor') {
      return [
        { to: '/officer/dashboard', icon: LayoutDashboard, label: 'Workstation' },
        { to: '/officer/complaints', icon: Inbox, label: 'Grievance Queue' },
        { to: '/officer/analytics', icon: BarChart3, label: 'SLA Analytics' },
        { to: '/officer/department', icon: Building, label: 'Department Staff' },
      ];
    }

    // Citizen
    return [
      { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
      { to: '/citizen/complaints/new', icon: FilePlus, label: 'File Grievance' },
      { to: '/citizen/notifications', icon: Bell, label: 'Notifications' },
      { to: '/citizen/profile', icon: User, label: 'Profile & Language' },
    ];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* User Card */}
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
          <div className="text-xs text-slate-400 font-medium">Logged in as</div>
          <div className="text-sm font-bold text-white truncate mt-0.5">{user?.name}</div>
          <div className="text-[11px] text-sky-400 font-mono flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="uppercase">{user?.role}</span>
            {user?.department_name && <span className="text-slate-400 truncate">({user.department_name})</span>}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span>Engine v1.0.0</span>
          <NavLink to="/help" className="hover:text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> FAQ
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
