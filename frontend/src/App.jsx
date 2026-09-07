import React from 'react';
import { useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import ChatbotPage from './pages/ChatbotPage';
import ReferralPage from './pages/ReferralPage';
import Navbar from './components/Navbar';
import AdminPortal from './pages/AdminPortal';
import ErrorBoundary from './components/ErrorBoundary';

const MainAppContent = () => {
  const { admin } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isAdminRoute = currentPath.startsWith('/admin') || !!admin;
  const isReferralRoute = currentPath.startsWith('/r/');

  // 1. Render Admin Portal if URL starts with /admin or admin is logged in
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <AdminPortal />
      </ErrorBoundary>
    );
  }


  // 2. Render Referral Handler if URL is /r/:ntCode
  if (isReferralRoute) {
    return <ReferralPage />;
  }

  // 3. Render New Conversational Automation User Portal
  return (
    <LanguageProvider>
      <ChatbotPage />
    </LanguageProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
