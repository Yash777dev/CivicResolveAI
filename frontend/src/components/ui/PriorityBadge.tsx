import React from 'react';
import { PriorityLevel } from '../../types';
import { useI18n } from '../../i18n';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  level: PriorityLevel;
  score?: number;
  showScore?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, score, showScore = true }) => {
  const { t } = useI18n();

  const getStyle = () => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Info className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${style.bg}`}
    >
      {style.icon}
      <span>{t(`priority.${level}`) || level}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[11px] opacity-80">({score}/100)</span>
      )}
    </span>
  );
};
