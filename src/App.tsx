import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PatientHome } from './components/PatientHome';
import { ClinicDashboard } from './components/ClinicDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthLoginModal } from './components/AuthLoginModal';
import { WelcomeRoleModal } from './components/WelcomeRoleModal';
import { MediBot } from './components/MediBot';

const AppBodyContent: React.FC = () => {
  const { role, firebaseUser } = useApp();

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
  const { role } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 sm:pb-12">
        <AppBodyContent />
      </main>

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
