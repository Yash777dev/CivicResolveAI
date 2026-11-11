import React from 'react';
import { ComplaintStatus } from '../../types';
import { useI18n } from '../../i18n';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<ComplaintStatus, { bg: string; text: string; dot: string }> = {
  SUBMITTED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
  TRIAGED: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  ASSIGNED: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  IN_PROGRESS: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  NEEDS_INFORMATION: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
  RESOLVED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  CLOSED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
  REOPENED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
  ESCALATED: { bg: 'bg-red-50 border-red-300', text: 'text-red-800', dot: 'bg-red-600' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const { t } = useI18n();
  const style = statusStyles[status] || statusStyles.SUBMITTED;
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${style.bg} ${style.text} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(`status.${status}`) || status.replace('_', ' ')}
    </span>
  );
};
