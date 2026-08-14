import fs from 'fs';
let code = fs.readFileSync('src/components/PatientHome.tsx', 'utf8');

code = code.replace(
  '  const { clinics, userProfile, selectedClinic, setSelectedClinic, patientTab, setPatientTab, logoutUser, firebaseUser, requestPermissions, banners, districts, sendPushNotification, updateAppointmentStatus, openAuthModal, appointments = [], legalPolicies = [] } = useApp();',
  '  const { clinics, userProfile, selectedClinic, setSelectedClinic, patientTab, setPatientTab, logoutUser, firebaseUser, requestPermissions, banners, districts, sendPushNotification, updateAppointmentStatus, openAuthModal, appointments = [], legalPolicies = [], userLocationDistrict, role } = useApp();'
);

const serviceUnavailableOverlay = `
  // Check if service is available
  const isDistrictActive = () => {
    if (role === 'admin') return true; 
    if (!userLocationDistrict) return true; // Allow if not fetched yet
    const matchedDistrict = districts.find(d => d.name.toLowerCase() === userLocationDistrict.toLowerCase());
    return matchedDistrict ? matchedDistrict.active : false;
  };

  if (!isDistrictActive()) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-4">Service Not Available</h1>
        <p className="text-slate-300 text-lg mb-8 max-w-md leading-relaxed">
          We are currently not operating in <strong className="text-white">{userLocationDistrict}</strong>. 
          MediBridge services are expanding rapidly across Jammu & Kashmir. Stay tuned!
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors"
        >
          Check Again
        </button>
      </div>
    );
  }
`;

code = code.replace(
  '  if (selectedClinic) {',
  serviceUnavailableOverlay + '\n  if (selectedClinic) {'
);

fs.writeFileSync('src/components/PatientHome.tsx', code);
