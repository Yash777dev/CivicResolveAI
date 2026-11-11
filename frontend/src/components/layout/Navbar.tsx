import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useI18n } from '../../i18n';
import { api } from '../../lib/api';
import {
  Building2,
  Bell,
  User as UserIcon,
  LogOut,
  Globe,
  FileText,
  Search,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.request<any>('/notifications?unread_only=true')
        .then((res) => {
          if (res.data) setUnreadCount(res.data.length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'officer' || role === 'supervisor') return '/officer/dashboard';
    return '/citizen/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-md group-hover:bg-sky-500 transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">
                CivicResolve <span className="text-sky-400">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 block font-normal leading-none">
                Grievance Redressal System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/services"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/services' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t('nav.services')}
            </Link>
            <Link
              to="/track"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/track' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                {t('nav.track')}
              </span>
            </Link>
            <Link
              to="/help"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/help' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t('nav.help')}
            </Link>
          </nav>

          {/* Right Controls: Language & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-md p-1 border border-slate-700 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1.5" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  language === 'en' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  language === 'ta' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={role === 'citizen' ? '/citizen/notifications' : getDashboardRoute()}
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to={getDashboardRoute()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-white transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                  <span>{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md shadow-xs transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            {t('nav.services')}
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            {t('nav.track')}
          </Link>
          <Link
            to="/help"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            {t('nav.help')}
          </Link>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded ${language === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2 py-1 rounded ${language === 'ta' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
              >
                தமிழ்
              </button>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-red-400 font-semibold"
              >
                Log Out
              </button>
            ) : (
              <div className="flex gap-2 text-xs">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-3 py-1 text-slate-300">
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1 bg-sky-600 text-white rounded font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
