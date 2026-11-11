import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Building2, User, Mail, Lock, Phone, Globe, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ta'>('en');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        phone,
        preferred_language: preferredLang,
      });
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">Citizen Portal Registration</h2>
        <p className="text-xs text-slate-500 mt-1">Create an account to submit and track municipal grievances</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anita Sharma"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anita@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Used for grievance verification and SMS status updates.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language</label>
              <div className="flex gap-4 text-xs font-medium text-slate-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lang"
                    checked={preferredLang === 'en'}
                    onChange={() => setPreferredLang('en')}
                    className="accent-slate-900"
                  />
                  English
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lang"
                    checked={preferredLang === 'ta'}
                    onChange={() => setPreferredLang('ta')}
                    className="accent-slate-900"
                  />
                  தமிழ் (Tamil)
                </label>
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full text-sm font-semibold" isLoading={isLoading}>
              Create Citizen Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
