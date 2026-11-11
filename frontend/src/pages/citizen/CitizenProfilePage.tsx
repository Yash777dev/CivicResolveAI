import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import { api } from '../../lib/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Phone, Globe, Mail, CheckCircle2 } from 'lucide-react';

export const CitizenProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage } = useI18n();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ta'>(user?.preferred_language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await api.request('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          preferred_language: preferredLang,
        }),
      });
      setLanguage(preferredLang);
      await refreshUser();
      setSuccessMsg('Profile and preferences updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Citizen Profile & Preferences</h1>

      <Card className="shadow-xs">
        <CardHeader title="Account Details" subtitle="Manage your contact information and bilingual settings" />
        <CardContent className="pt-4">
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400">Account identifier cannot be altered.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Language</label>
              <div className="flex gap-4 text-xs font-medium text-slate-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="profile_lang"
                    checked={preferredLang === 'en'}
                    onChange={() => setPreferredLang('en')}
                    className="accent-slate-900"
                  />
                  English
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="profile_lang"
                    checked={preferredLang === 'ta'}
                    onChange={() => setPreferredLang('ta')}
                    className="accent-slate-900"
                  />
                  தமிழ் (Tamil)
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
