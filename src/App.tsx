import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PatientHome } from './components/PatientHome';
import { ClinicDashboard } from './components/ClinicDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthLoginModal } from './components/AuthLoginModal';
import { WelcomeRoleModal } from './components/WelcomeRoleModal';
import { MediBot } from './components/MediBot';
import { SplashScreen } from './components/SplashScreen';
import { NotificationToast } from './components/NotificationToast';

const AppBodyContent: React.FC = () => {
  const { role, firebaseUser, requestPermissions } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Auto-fetch location/permissions
    requestPermissions();
    const timer = setTimeout(() => {
      setIsLoadingData(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [requestPermissions]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoadingData || (firebaseUser && role === null)) {
    return (
      <div className="space-y-6 animate-pulse p-4 max-w-6xl mx-auto">
        {/* Skeleton Header / Search Bar */}
        <div className="h-14 bg-slate-200 rounded-2xl w-full max-w-xl mx-auto shadow-sm" />
        
        {/* Skeleton Banner */}
        <div className="h-48 bg-slate-200 rounded-3xl w-full shadow-sm" />
        
        {/* Skeleton Categories */}
        <div className="flex gap-4 overflow-hidden py-2 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-slate-200 rounded-full" />
              <div className="w-12 h-3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
              <div className="h-44 bg-slate-200 rounded-xl w-full" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 bg-slate-200 rounded-lg w-24" />
                <div className="h-8 bg-slate-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <PatientHome />; // Public discovery view
  }

  return (
    <>
      {role === 'user' && <PatientHome />}
      {role === 'clinic_owner' && <ClinicDashboard />}
      {role === 'admin' && <AdminPanel />}
      {/* If role is null but logged in, still show PatientHome while loading profile */}
      {role === null && <PatientHome />}
    </>
  );
};

const MainLayout: React.FC = () => {
  const { role, activeNotificationToast, dismissNotificationToast } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-900">
      <NotificationToast
        notification={activeNotificationToast}
        onClose={dismissNotificationToast}
      />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 sm:pb-12">
        <AppBodyContent />
      </main>

      <footer className="w-full py-3 text-center text-xs text-slate-500 font-medium tracking-wide flex items-center justify-center gap-1.5 border-t border-slate-200/60 mt-auto bg-white/80 backdrop-blur-sm">
        <span>Made By Musaib Hamid with love 💝 for Kashmir</span>
      </footer>

      {/* Global Application Modals */}
      <WelcomeRoleModal />
      <AuthLoginModal />
      {(!role || role === 'user') && <MediBot />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
// Trigger UI refresh
