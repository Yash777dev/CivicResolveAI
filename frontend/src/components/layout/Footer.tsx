import React from 'react';
import { Building2, ShieldCheck, HeartHandshake, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Building2 className="w-5 h-5 text-sky-400" />
              CivicResolve AI
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              An explainable, deterministic public grievance management platform designed for municipal services.
              Prioritizes citizen complaints using transparent rule scoring, auditable officer overrides, and real SLA accountability.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Academic CSE Final-Year Capstone Project Implementation
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Public Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  Municipal Categories
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Grievance Status
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Citizen FAQ & Rights
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Officer & Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic Transparency Note */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Academic Transparency</h4>
            <div className="p-3 bg-slate-800/80 rounded border border-slate-700/60 text-[11px] leading-relaxed text-slate-300 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-sky-400">
                <Info className="w-3.5 h-3.5" /> Demo System
              </div>
              <p>
                This system automates administrative triage and SLA tracking. For life-threatening emergencies, citizens must dial 112 / 100 directly.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CivicResolve AI. Designed for CSE Capstone Demonstration.</p>
          <div className="flex gap-4">
            <Link to="/help" className="hover:text-slate-400">
              Privacy & Retention Policy
            </Link>
            <Link to="/help" className="hover:text-slate-400">
              SLA Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
