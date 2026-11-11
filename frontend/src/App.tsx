import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthContext';
import { I18nProvider } from './i18n';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { CitizenLayout, OfficerLayout, AdminLayout } from './layouts/DashboardLayouts';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { TrackPage } from './pages/public/TrackPage';
import { HelpPage } from './pages/public/HelpPage';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { NewComplaintPage } from './pages/citizen/NewComplaintPage';
import { ComplaintDetailPage } from './pages/citizen/ComplaintDetailPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';
import { CitizenNotificationsPage } from './pages/citizen/CitizenNotificationsPage';
import { FeedbackPage } from './pages/citizen/FeedbackPage';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerQueuePage } from './pages/officer/OfficerQueuePage';
import { OfficerCasePage } from './pages/officer/OfficerCasePage';
import { OfficerAnalyticsPage } from './pages/officer/OfficerAnalyticsPage';
import { OfficerDepartmentPage } from './pages/officer/OfficerDepartmentPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminRulesPage } from './pages/admin/AdminRulesPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminModelEvaluationPage } from './pages/admin/AdminModelEvaluationPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// 404 Error
import { NotFoundPage } from './pages/errors/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/track" element={<TrackPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Citizen Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'officer', 'supervisor', 'admin']}>
                    <CitizenLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                <Route path="/citizen/complaints/new" element={<NewComplaintPage />} />
                <Route path="/citizen/complaints/:id" element={<ComplaintDetailPage />} />
                <Route path="/citizen/profile" element={<CitizenProfilePage />} />
                <Route path="/citizen/notifications" element={<CitizenNotificationsPage />} />
                <Route path="/citizen/feedback/:id" element={<FeedbackPage />} />
              </Route>

              {/* Officer Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['officer', 'supervisor', 'admin']}>
                    <OfficerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                <Route path="/officer/complaints" element={<OfficerQueuePage />} />
                <Route path="/officer/complaints/:id" element={<OfficerCasePage />} />
                <Route path="/officer/analytics" element={<OfficerAnalyticsPage />} />
                <Route path="/officer/department" element={<OfficerDepartmentPage />} />
              </Route>

              {/* Administrator Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
                <Route path="/admin/rules" element={<AdminRulesPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="/admin/model-evaluation" element={<AdminModelEvaluationPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
