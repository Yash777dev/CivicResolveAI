import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 3, className = 'h-12' }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-slate-200 rounded-md ${className}`} />
      ))}
    </div>
  );
};
