import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { Button } from '../../components/ui/Button';
import {
  ShieldCheck,
  Zap,
  Clock,
  Search,
  FileText,
  Building2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Droplet,
  Flame,
  Truck,
  HeartPulse
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { t } = useI18n();

  const corePillars = [
    {
      icon: <Zap className="w-6 h-6 text-sky-600" />,
      title: 'Explainable Priority Engine',
      desc: 'Transparent, deterministic rule scoring. Fired rules and exact point contributions are visible for complete public auditability.',
    },
    {
      icon: <Clock className="w-6 h-6 text-indigo-600" />,
      title: 'Enforced SLA Targets',
      desc: 'Automated deadline tracking per category. Breached targets escalate directly to departmental supervisors.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: 'Human-in-the-Loop Overrides',
      desc: 'AI and rules assist, but authorized officers verify. Every manual override requires written justification and creates an immutable audit trail.',
    },
  ];

  const categories = [
    { name: 'Water Resources & Supply', icon: <Droplet className="w-5 h-5 text-blue-500" />, sla: '48h SLA' },
    { name: 'Power & Streetlighting', icon: <Flame className="w-5 h-5 text-amber-500" />, sla: '24h SLA' },
    { name: 'Roads & Infrastructure', icon: <Truck className="w-5 h-5 text-slate-600" />, sla: '72h SLA' },
    { name: 'Public Health & Sanitation', icon: <HeartPulse className="w-5 h-5 text-rose-500" />, sla: '24h SLA' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-6">
          <Building2 className="w-4 h-4 text-sky-600" />
          {t('hero.badge')}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          {t('hero.title')}
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/citizen/complaints/new">
            <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-sm font-semibold shadow-md">
              <FileText className="w-4 h-4 mr-2" />
              {t('hero.cta_submit')}
            </Button>
          </Link>
          <Link to="/track">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-sm font-semibold">
              <Search className="w-4 h-4 mr-2" />
              {t('hero.cta_track')}
            </Button>
          </Link>
        </div>

        {/* Live Safety Guarantee Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Immediate danger cases (sparks, open manholes) receive elevated triage flags.</span>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Engineered for Public Trust</h2>
          <p className="text-sm text-slate-500 mt-1">
            Built to academic standards of algorithmic explainability and administrative governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {corePillars.map((p, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                {p.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Supported Departments & SLAs */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Supported Civic Lifelines</h2>
              <p className="text-xs text-slate-500 mt-1">Standardized redressal workflows across municipal divisions.</p>
            </div>
            <Link to="/services" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View all 10 service categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">{c.icon}</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold">{c.sla}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">4-Step Citizen Resolution Lifecycle</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-900">Citizen Submission</h4>
            <p className="text-xs text-slate-500">File with facts, optional map pin, and photo evidence.</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-900">Explainable Triage</h4>
            <p className="text-xs text-slate-500">Deterministic scoring computes priority with clear fired rules.</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-900">Officer Action</h4>
            <p className="text-xs text-slate-500">Department officer inspects, updates status, and enters field notes.</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mx-auto">
              4
            </div>
            <h4 className="text-sm font-bold text-slate-900">Verified Resolution</h4>
            <p className="text-xs text-slate-500">Written resolution summary recorded. Citizen rates or requests reopen.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
