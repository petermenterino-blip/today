import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import ScrollToTop from '../components/shared/ScrollToTop';

const LandingPage = lazy(() => import('../pages/Landing'));
const ApplicationPage = lazy(() => import('../pages/Application'));
const UserDashboard = lazy(() => import('../features/student/UserDashboard'));
const MentorDashboard = lazy(() => import('../features/mentor/MentorDashboard'));
const AuthPage = lazy(() => import('../pages/Auth'));
const PendingApproval = lazy(() => import('../pages/PendingApproval'));
const SettingsPage = lazy(() => import('../features/settings/Settings'));
const BookingPage = lazy(() => import('../pages/Booking'));
const StorePage = lazy(() => import('../pages/Store'));
const SurveyPage = lazy(() => import('../pages/Survey'));
const PrivacyPage = lazy(() => import('../pages/Privacy'));
const TermsPage = lazy(() => import('../pages/Terms'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPassword'));
const AdminRevenuePage = lazy(() => import('../features/admin/AdminRevenue'));
const ConsultationOverviewPage = lazy(() => import('../pages/ConsultationOverview'));

const AboutPage = lazy(() => import('../pages/About'));
const ProgramsPage = lazy(() => import('../pages/Programs'));
const ConsultationPage = lazy(() => import('../pages/Consultation'));
const FAQPage = lazy(() => import('../pages/FAQ'));
const ContactPage = lazy(() => import('../pages/Contact'));
const GalleryPage = lazy(() => import('../pages/Gallery'));
const MentorshipPage = lazy(() => import('../pages/Mentorship'));

const AppContent: React.FC = () => {
  const { user, role, authLoading, logout } = useAuth();
  
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Workspace</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster richColors position="top-right" />
      <ScrollToTop />
      <Layout role={role} onLogout={logout}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingPage currentRole={role} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/consultation" element={<ConsultationPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/booking" element={<ProtectedRoute allowedRoles={['student','mentor']}><BookingPage onBook={async (b)=>{await import('../services/bookingService').then(m=>m.bookingService.insert(b)).catch(()=>{})}} currentUser={user} /></ProtectedRoute>} />
            <Route path="/store" element={<ProtectedRoute allowedRoles={['student','mentor']}><StorePage /></ProtectedRoute>} />
            <Route path="/survey" element={<ProtectedRoute allowedRoles={['student','mentor']}><SurveyPage /></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={['mentor']}><AdminRevenuePage /></ProtectedRoute>} />
            <Route path="/consultation-overview" element={<ConsultationOverviewPage />} />
            
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <UserDashboard currentUser={user} />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/*" element={<Navigate to="/student" replace />} />
            <Route path="/apply" element={<ApplicationPage />} />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['student', 'mentor']}>
                <SettingsPage onLogout={logout} currentUser={user} />
              </ProtectedRoute>
            } />

            <Route path="/mentor/*" element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorDashboard currentUser={user} />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
