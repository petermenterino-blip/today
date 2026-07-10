import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import ScrollToTop from '../components/shared/ScrollToTop';
import ErrorBoundary from '../components/shared/ErrorBoundary';

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
const FinancialsPage = lazy(() => import('../features/admin/AdminRevenue'));
const ConsultationOverviewPage = lazy(() => import('../pages/ConsultationOverview'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const AboutPage = lazy(() => import('../pages/About'));
const ProgramsPage = lazy(() => import('../pages/Programs'));
const ConsultationPage = lazy(() => import('../pages/Consultation'));
const FAQPage = lazy(() => import('../pages/FAQ'));
const ContactPage = lazy(() => import('../pages/Contact'));
const GalleryPage = lazy(() => import('../pages/Gallery'));
const MentorshipPage = lazy(() => import('../pages/Mentorship'));

const AppContent: React.FC = () => {
  const { user, role, logout } = useAuth();

  return (
    <Router>
      <Toaster richColors position="top-right" />
      <ScrollToTop />
      <Layout role={role} onLogout={logout}>
        <ErrorBoundary>
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
            <Route path="/auth" element={user ? <Navigate to={role === 'mentor' ? '/mentor' : '/student'} /> : <AuthPage />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/book-call" element={<BookingPage />} />
            <Route path="/store" element={<ProtectedRoute allowedRoles={['student','mentor']}><StorePage /></ProtectedRoute>} />
            <Route path="/survey" element={<ProtectedRoute allowedRoles={['student','mentor']}><SurveyPage /></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/financials" element={<ProtectedRoute allowedRoles={['mentor']}><FinancialsPage /></ProtectedRoute>} />
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

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => <AppContent />;

export default App;
