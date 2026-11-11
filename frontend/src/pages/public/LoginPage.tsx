import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Building2, Lock, Mail, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (user.role === 'officer' || user.role === 'supervisor') navigate('/officer/dashboard', { replace: true });
        else navigate('/citizen/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: 'citizen' | 'water_officer' | 'power_officer' | 'supervisor' | 'admin') => {
    if (role === 'citizen') {
      setEmail('citizen.anita@example.com');
      setPassword('CitizenPass123!');
    } else if (role === 'water_officer') {
      setEmail('water.officer@civicresolve.gov');
      setPassword('OfficerPass123!');
    } else if (role === 'power_officer') {
      setEmail('power.officer@civicresolve.gov');
      setPassword('OfficerPass123!');
    } else if (role === 'supervisor') {
      setEmail('supervisor@civicresolve.gov');
      setPassword('SupervisorPass123!');
    } else if (role === 'admin') {
      setEmail('admin@civicresolve.gov');
      setPassword('AdminPass123!');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">Public Service Login</h2>
        <p className="text-xs text-slate-500 mt-1">Access citizen services or departmental case queues</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full text-sm font-semibold" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have a citizen account?{' '}
            <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
              Register now
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Demo Account Quick Pickers for Examiners and Reviewers */}
      <div className="mt-6 bg-slate-100 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
          <span>Demo Account Quick-Fill (Academic Viva Evaluation)</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Click any persona to auto-fill verified credentials:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDemoCredentials('citizen')}
            className="p-2 bg-white rounded border border-slate-200 text-left hover:border-sky-500 hover:bg-sky-50/50 transition-colors"
          >
            <div className="font-semibold text-slate-800">Citizen</div>
            <div className="text-[10px] text-slate-400 truncate">citizen.anita@example.com</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('water_officer')}
            className="p-2 bg-white rounded border border-slate-200 text-left hover:border-sky-500 hover:bg-sky-50/50 transition-colors"
          >
            <div className="font-semibold text-slate-800">Water Officer</div>
            <div className="text-[10px] text-slate-400 truncate">water.officer@civicresolve.gov</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('power_officer')}
            className="p-2 bg-white rounded border border-slate-200 text-left hover:border-sky-500 hover:bg-sky-50/50 transition-colors"
          >
            <div className="font-semibold text-slate-800">Power Officer</div>
            <div className="text-[10px] text-slate-400 truncate">power.officer@civicresolve.gov</div>
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('admin')}
            className="p-2 bg-white rounded border border-slate-200 text-left hover:border-sky-500 hover:bg-sky-50/50 transition-colors"
          >
            <div className="font-semibold text-slate-800">Administrator</div>
            <div className="text-[10px] text-slate-400 truncate">admin@civicresolve.gov</div>
          </button>
        </div>
      </div>
    </div>
  );
};
