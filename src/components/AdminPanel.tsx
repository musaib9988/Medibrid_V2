import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Building2, LayoutDashboard, Image as ImageIcon, Trash2, Plus, Bell, ShieldAlert, 
  Ban, CheckCircle2, LogOut, Grid, CheckCircle, Search, Settings, Activity, FileText,
  MapPin, FolderTree, Star, Radio, Edit3, HeartPulse, RefreshCw, AlertTriangle,
  Clock, Filter, ShieldCheck, Download, Zap, ToggleLeft, ToggleRight, Stethoscope, Award, PhoneCall,
  Eye, EyeOff, Copy, Check, Key, UserPlus, Sparkles, Building, Phone
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface NavItemProps {
  onClickMenu?: () => void;
  icon: any;
  label: string;
  id: string;
  badge?: number | string;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, id, badge, activeTab, setActiveTab, onClickMenu }) => {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={() => { setActiveTab(id); if(onClickMenu) onClickMenu(); }}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-1 transition-all ${
        isActive 
          ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/20' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
        <span className="text-xs">{label}</span>
      </div>
      {badge !== undefined && badge !== null && (
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
          isActive ? 'bg-white text-teal-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};

export const AdminPanel: React.FC = () => {
  const { 
    users, clinics, doctors, laboratories, appointments, userProfile, banners, categories, districts, legalPolicies = [],
    adminRegisterClinic, updateUserStatus, deleteUser, deleteClinic, sendPushNotification, updateClinic, logoutUser,
    addCategory, deleteCategory, addDistrict, deleteDistrict, toggleDistrictStatus,
    addBanner, deleteBanner, toggleBannerStatus, updateLegalPolicy
  } = useApp();

  type AdminTab = 
    | 'dashboard' 
    | 'clinics' 
    | 'doctor_availability' 
    | 'users' 
    | 'banners' 
    | 'categories' 
    | 'specialties' 
    | 'facility_types' 
    | 'districts' 
    | 'service_catalog' 
    | 'appointments' 
    | 'reviews' 
    | 'homepage_manager' 
    | 'notifications' 
    | 'audit_log' 
    | 'settings'
    | 'legal_policies';

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [MenuIcon, setMenuIcon] = useState(null);
  
  // Lazy load Menu icon to avoid import issues
  React.useEffect(() => {
    import('lucide-react').then(mod => setMenuIcon(() => mod.Menu));
  }, []);

  // Legal Policies editor state
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('shipping_delivery');
  const [editedPolicyTitle, setEditedPolicyTitle] = useState<string>('');
  const [editedPolicyContent, setEditedPolicyContent] = useState<string>('');
  const [policySaveSuccess, setPolicySaveSuccess] = useState<string | null>(null);

  // Banner state
  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '' });
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // District state
  const [newDistrict, setNewDistrict] = useState({ name: '' });
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);

  // Category state
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Specialties State
  const [specialtiesList, setSpecialtiesList] = useState([
    { id: '1', name: 'Cardiology', dept: 'Heart & Vascular', active: true, doctorCount: 14 },
    { id: '2', name: 'Neurology', dept: 'Brain & Nervous System', active: true, doctorCount: 9 },
    { id: '3', name: 'Orthopedics', dept: 'Bones & Joints', active: true, doctorCount: 18 },
    { id: '4', name: 'Pediatrics', dept: 'Child Health', active: true, doctorCount: 22 },
    { id: '5', name: 'Gynecology & Obstetrics', dept: 'Women\'s Health', active: true, doctorCount: 16 },
    { id: '6', name: 'Dermatology', dept: 'Skin & Laser', active: true, doctorCount: 11 },
    { id: '7', name: 'Ophthalmology', dept: 'Eye Care', active: true, doctorCount: 8 },
    { id: '8', name: 'ENT Care', dept: 'Ear, Nose & Throat', active: true, doctorCount: 7 },
    { id: '9', name: 'General Medicine', dept: 'Internal Medicine', active: true, doctorCount: 35 },
    { id: '10', name: 'Radiology & Scans', dept: 'Diagnostics', active: true, doctorCount: 12 },
    { id: '11', name: 'Pathology', dept: 'Lab Services', active: true, doctorCount: 15 },
    { id: '12', name: 'Dental Care', dept: 'Oral Health', active: true, doctorCount: 19 }
  ]);
  const [newSpecialty, setNewSpecialty] = useState({ name: '', dept: '' });
  const [isAddingSpecialty, setIsAddingSpecialty] = useState(false);

  // Facility Types State
  const [facilityTypesList, setFacilityTypesList] = useState([
    { id: 'f1', name: 'Multi-Specialty Hospital', code: 'MSH', active: true, count: 12 },
    { id: 'f2', name: 'Diagnostic & Lab Center', code: 'DLC', active: true, count: 24 },
    { id: 'f3', name: 'Single Specialty Clinic', code: 'SSC', active: true, count: 38 },
    { id: 'f4', name: 'Dental Care Center', code: 'DCC', active: true, count: 15 },
    { id: 'f5', name: 'Maternity & Childcare Unit', code: 'MCU', active: true, count: 9 },
    { id: 'f6', name: 'Nursing Home & Daycare', code: 'NHD', active: true, count: 11 },
    { id: 'f7', name: 'Primary Health Center (PHC)', code: 'PHC', active: true, count: 28 }
  ]);
  const [newFacilityType, setNewFacilityType] = useState({ name: '', code: '' });
  const [isAddingFacilityType, setIsAddingFacilityType] = useState(false);

  // Service Catalog State
  const [serviceCatalog, setServiceCatalog] = useState([
    { id: 's1', name: 'General OPD Consultation', fee: 400, category: 'Consultation', duration: '15 mins', active: true },
    { id: 's2', name: 'Full Body Blood Profile', fee: 1200, category: 'Lab Test', duration: '30 mins', active: true },
    { id: 's3', name: 'Digital Chest X-Ray', fee: 500, category: 'Radiology', duration: '20 mins', active: true },
    { id: 's4', name: '12-Lead Cardiac ECG', fee: 350, category: 'Cardiology', duration: '15 mins', active: true },
    { id: 's5', name: 'Child Vaccination Drive', fee: 200, category: 'Pediatrics', duration: '10 mins', active: true },
    { id: 's6', name: 'Teeth Scaling & Polishing', fee: 800, category: 'Dental', duration: '30 mins', active: true },
    { id: 's7', name: 'Ultrasound Abdomen & Pelvis', fee: 1100, category: 'Radiology', duration: '25 mins', active: true },
    { id: 's8', name: 'Brain MRI Scan', fee: 4500, category: 'Neurology', duration: '45 mins', active: true }
  ]);
  const [newServiceItem, setNewServiceItem] = useState({ name: '', fee: 300, category: 'Consultation', duration: '15 mins' });
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  // Doctor Availability state
  const [doctorAvailabilityFilter, setDoctorAvailabilityFilter] = useState('');
  const [doctorStatuses, setDoctorStatuses] = useState<Record<string, { availability: string; online: boolean }>>({});

  // Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState('all');

  // Appointments Console State
  const [aptStatusFilter, setAptStatusFilter] = useState('all');
  const [aptSearch, setAptSearch] = useState('');

  // Homepage Manager State
  const [homeSections, setHomeSections] = useState({
    headerLocation: true,
    heroBanners: true,
    emergencyOPD: true,
    categoriesGrid: true,
    topVerifiedDoctors: true,
    activeCountdown: true,
    healthPackages: true
  });
  const [heroAnnouncementText, setHeroAnnouncementText] = useState('Looking for certified doctors in Jammu & Kashmir? Book OPD slots online!');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Broadcast state
  const [notifData, setNotifData] = useState({ title: '', body: '', targetRole: 'all' as any });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  // Admin Direct Clinic Registration State
  const [isRegisteringClinic, setIsRegisteringClinic] = useState(false);
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [clinicDistrictFilter, setClinicDistrictFilter] = useState('all');
  const [clinicForm, setClinicForm] = useState({
    clinicName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    district: 'Srinagar',
    city: 'Srinagar',
    address: '',
    clinicType: 'General Clinic',
    consultationFee: '400',
    workingHours: '09:00 AM - 06:00 PM',
    services: ['OPD Consultation', 'General Health Checkup', 'Pharmacy'],
    specializations: ['General Medicine']
  });
  const [newSpecializationInput, setNewSpecializationInput] = useState('');
  const [clinicRegError, setClinicRegError] = useState('');
  const [clinicRegLoading, setClinicRegLoading] = useState(false);
  const [createdClinicReceipt, setCreatedClinicReceipt] = useState<{
    clinicName: string;
    ownerName: string;
    email: string;
    password: string;
    district: string;
    city: string;
    phone: string;
    clinicId: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let pass = 'Clinic@';
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setClinicForm(prev => ({ ...prev, password: pass }));
  };

  const handleAdminRegisterClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClinicRegError('');
    if (!clinicForm.clinicName.trim()) return setClinicRegError('Clinic Name is required.');
    if (!clinicForm.ownerName.trim()) return setClinicRegError('Owner Full Name is required.');
    if (!clinicForm.email.trim() || !clinicForm.email.includes('@')) return setClinicRegError('Valid Owner Email is required.');
    if (!clinicForm.password || clinicForm.password.length < 6) return setClinicRegError('Password must be at least 6 characters.');
    if (!clinicForm.phone.trim()) return setClinicRegError('Phone / Contact number is required.');
    if (!clinicForm.address.trim()) return setClinicRegError('Clinic address is required.');

    setClinicRegLoading(true);
    try {
      const result = await adminRegisterClinic({
        clinicName: clinicForm.clinicName,
        ownerName: clinicForm.ownerName,
        email: clinicForm.email,
        password: clinicForm.password,
        phone: clinicForm.phone,
        district: clinicForm.district || 'Srinagar',
        city: clinicForm.city || clinicForm.district || 'Srinagar',
        address: clinicForm.address,
        clinicType: clinicForm.clinicType,
        consultationFee: Number(clinicForm.consultationFee) || 400,
        workingHours: clinicForm.workingHours,
        services: clinicForm.services,
        specializations: clinicForm.specializations
      });

      logActivity('Clinic Registered by Admin', `Directly registered "${clinicForm.clinicName}" for ${clinicForm.ownerName} (${clinicForm.email})`, 'success');
      
      setCreatedClinicReceipt({
        clinicName: clinicForm.clinicName,
        ownerName: clinicForm.ownerName,
        email: clinicForm.email,
        password: clinicForm.password,
        district: clinicForm.district,
        city: clinicForm.city,
        phone: clinicForm.phone,
        clinicId: result.clinicId
      });

      // Reset form
      setClinicForm({
        clinicName: '',
        ownerName: '',
        email: '',
        password: '',
        phone: '',
        district: 'Srinagar',
        city: 'Srinagar',
        address: '',
        clinicType: 'General Clinic',
        consultationFee: '400',
        workingHours: '09:00 AM - 06:00 PM',
        services: ['OPD Consultation', 'General Health Checkup', 'Pharmacy'],
        specializations: ['General Medicine']
      });
      setIsRegisteringClinic(false);
    } catch (err: any) {
      console.error('Error registering clinic:', err);
      setClinicRegError(err.message || 'Failed to register clinic. Please verify details.');
    } finally {
      setClinicRegLoading(false);
    }
  };

  const triggerDelayedPushTest = async () => {
    let count = 5;
    setTestCountdown(count);
    const interval = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setTestCountdown(count);
      } else {
        clearInterval(interval);
        setTestCountdown(null);
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification('🏥 MediBrid Background Test', {
                body: 'Notification system working on mobile & background! 🔔',
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'medibrid-bg-test',
                vibrate: [200, 100, 200]
              } as any);
            } else {
              new Notification('🏥 MediBrid Background Test', {
                body: 'Notification system working on mobile & background! 🔔',
                icon: '/icon-192.png'
              });
            }
          }
          await sendPushNotification('🏥 MediBrid Background Alert', 'Test push broadcast received successfully on your device!', 'all');
          logActivity('Background Push Test Fired', 'Delayed notification fired for background verification', 'info');
        } catch (pushErr) {
          console.warn('Push test notification error:', pushErr);
        }
      }
    }, 1000);
  };

  const handleAddBanner = async () => {
    if (!newBanner.title || !newBanner.imageUrl) return;
    try {
      await addBanner({
        title: newBanner.title,
        imageUrl: newBanner.imageUrl,
        link: newBanner.link,
        active: true
      });
      setNewBanner({ title: '', imageUrl: '', link: '' });
      setIsAddingBanner(false);
      logActivity('Banner Created', `Added banner "${newBanner.title}"`, 'success');
    } catch (e) {
      console.error('Error adding banner:', e);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      await toggleBannerStatus(bannerId, !currentStatus);
      logActivity('Banner Status Changed', `Banner ID ${bannerId} active set to ${!currentStatus}`, 'info');
    } catch (e) {
      console.error('Error toggling banner:', e);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteBanner(bannerId);
      logActivity('Banner Deleted', `Banner ID ${bannerId} deleted`, 'warning');
    } catch (e) {
      console.error('Error deleting banner:', e);
    }
  };

  const logActivity = (action: string, detail: string, severity: 'info' | 'success' | 'warning' | 'security' = 'info') => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: userProfile?.name || 'Admin Malik',
      role: 'admin',
      action,
      detail,
      severity
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const hour = new Date().getHours();
  let timeGreeting = 'Good Morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good Afternoon';
  else if (hour >= 17) timeGreeting = 'Good Evening';

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Musaib';
  const pendingClinics = clinics.filter(c => c.status === 'pending');

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Sidebar */}
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[200] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[210] w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto shadow-sm transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-900 text-white">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-teal-500/30">
            {firstName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-white text-base leading-none">MediBrid</h2>
              <span className="bg-teal-400 text-slate-950 text-[8px] uppercase font-black px-1.5 py-0.5 rounded">Admin</span>
            </div>
            <p className="text-[10px] text-teal-200/80 font-medium">J&K Healthcare Portal</p>
          </div>
        </div>
        
        <div className="p-3 flex-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-1">Core Navigation</p>
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={LayoutDashboard} label="Dashboard" id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Building2} label="Providers Directory" id="clinics" badge={pendingClinics.length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Activity} label="Doctor Availability" id="doctor_availability" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Users} label="Patient Accounts" id="users" badge={users.length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={FileText} label="Appointments Console" id="appointments" badge={appointments.length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />

          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Catalog & Regions</p>
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={MapPin} label="J&K Districts" id="districts" badge={districts.filter(d => d.active).length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={HeartPulse} label="Medical Specialties" id="specialties" badge={specialtiesList.filter(s => s.active).length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Building2} label="Facility Types" id="facility_types" badge={facilityTypesList.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Grid} label="Categories CMS" id="categories" badge={categories.length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={FolderTree} label="Service Catalog" id="service_catalog" badge={serviceCatalog.filter(s => s.active).length} activeTab={activeTab} setActiveTab={setActiveTab} />

          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">CMS & Engagement</p>
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={ImageIcon} label="App Banners" id="banners" badge={banners.filter(b => b.active).length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Edit3} label="Homepage Manager" id="homepage_manager" activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={FileText} label="Legal Policies Manager" id="legal_policies" badge={legalPolicies.length || 6} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Star} label="Reviews Moderation" id="reviews" badge={reviewsList.filter(r => r.status === 'pending').length || undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Radio} label="Broadcast Center" id="notifications" activeTab={activeTab} setActiveTab={setActiveTab} />

          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">System</p>
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={ShieldCheck} label="Activity Audit Log" id="audit_log" badge={auditLogs.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <NavItem onClickMenu={() => setIsMobileMenuOpen(false)} icon={Settings} label="Settings & Reset" id="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button onClick={logoutUser} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Log Out Super Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="p-6 max-w-6xl w-full mx-auto">
          {/* Top Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                {MenuIcon ? <MenuIcon className="w-6 h-6" /> : <div className="w-6 h-6 border-y-2 border-slate-600 my-1" />}
              </button>
              <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-600/20 shrink-0">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-extrabold text-slate-900 leading-none">{timeGreeting}, {firstName}</h1>
                  <span className="bg-teal-100 text-teal-800 text-[10px] px-2.5 py-0.5 rounded-full border border-teal-200 font-extrabold uppercase tracking-wider">Super Admin</span>
                </div>
                <p className="text-xs text-slate-500">Managing Healthcare Operations & CMS across Srinagar, Jammu, and Kashmir Districts.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => logActivity('System Refresh', 'Manual dashboard state sync executed', 'info')} className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors" title="Sync Data">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('notifications')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                <Bell className="w-4 h-4" /> Broadcast Push
              </button>
            </div>
          </div>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Total Clinics / Providers</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{clinics.length || 4}</h2>
                  <p className="text-[10px] font-bold text-teal-600 mt-1">{clinics.filter(c => c.verified).length || 4} Verified Active</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Pending Approvals</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{pendingClinics.length}</h2>
                  <p className="text-[10px] font-bold text-amber-600 mt-1">{pendingClinics.length > 0 ? 'Requires Action' : 'All Clear'}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Registered Patients</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{users.length || 18}</h2>
                  <p className="text-[10px] font-bold text-blue-600 mt-1">Across J&K Districts</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">Total Appointments</p>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{appointments.length || 12}</h2>
                  <p className="text-[10px] font-bold text-purple-600 mt-1">Real-time Booked Slots</p>
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Admin Direct Quick Management</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => setActiveTab('districts')} className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center gap-3 transition-all text-left">
                    <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">J&K Districts</span>
                      <span className="text-[10px] text-slate-500">Disable / Enable ({districts.filter(d => d.active).length} active)</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('doctor_availability')} className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center gap-3 transition-all text-left">
                    <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Doctor Availability</span>
                      <span className="text-[10px] text-slate-500">OPD & Duty Status</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('specialties')} className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center gap-3 transition-all text-left">
                    <HeartPulse className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Medical Specialties</span>
                      <span className="text-[10px] text-slate-500">Cardiology, Neurology...</span>
                    </div>
                  </button>

                  <button onClick={() => setActiveTab('homepage_manager')} className="p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl flex items-center gap-3 transition-all text-left">
                    <Edit3 className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Homepage CMS</span>
                      <span className="text-[10px] text-slate-500">Banners & Sections</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* J&K DISTRICTS TAB - FULLY FIXED & INTERACTIVE */}
          {activeTab === 'districts' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" /> J&K Districts & Regional Coverage
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Enable or disable districts to control clinic listings and patient search filters in Jammu & Kashmir.</p>
                </div>
                <button onClick={() => setIsAddingDistrict(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0">
                  <Plus className="w-4 h-4" /> Add New District
                </button>
              </div>

              {isAddingDistrict && (
                <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 mb-6 flex flex-col md:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-teal-900 mb-1">New District Name (e.g. Samba, Reasi, Poonch)</label>
                    <input 
                      type="text" 
                      value={newDistrict.name} 
                      onChange={e => setNewDistrict({ name: e.target.value })} 
                      placeholder="Enter district name..."
                      className="w-full p-2.5 bg-white border border-teal-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" 
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setIsAddingDistrict(false)} className="px-4 py-2.5 text-xs text-slate-600 font-bold hover:text-slate-900">Cancel</button>
                    <button 
                      onClick={async () => {
                        if (newDistrict.name.trim()) {
                          await addDistrict(newDistrict);
                          logActivity('District Added', `Added district "${newDistrict.name}"`, 'success');
                          setNewDistrict({ name: '' });
                          setIsAddingDistrict(false);
                        }
                      }} 
                      className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm"
                    >
                      Save District
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {districts.map(dist => (
                  <div key={dist.id} className={`p-4 rounded-2xl border transition-all ${dist.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dist.active ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{dist.name}</h3>
                          <span className="text-[10px] text-slate-400">ID: {dist.id}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider ${
                        dist.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {dist.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="bg-slate-100/70 p-2 rounded-xl text-slate-600">
                        Clinics: <strong className="text-slate-900 font-bold">{dist.name ? clinics.filter(c => c.district?.toLowerCase() === dist.name.toLowerCase()).length : 0}</strong>
                      </div>
                      <div className="bg-slate-100/70 p-2 rounded-xl text-slate-600">
                        Doctors: <strong className="text-slate-900 font-bold">{dist.name ? doctors.filter(d => (d as any).district?.toLowerCase() === dist.name.toLowerCase()).length : 0}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button 
                        onClick={async () => {
                          const newStatus = !dist.active;
                          await toggleDistrictStatus(dist.id, newStatus);
                          logActivity('District Toggled', `District "${dist.name}" active status set to ${newStatus}`, newStatus ? 'success' : 'warning');
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          dist.active 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        {dist.active ? (
                          <><ToggleLeft className="w-4 h-4" /> Disable District</>
                        ) : (
                          <><ToggleRight className="w-4 h-4" /> Enable District</>
                        )}
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete district "${dist.name}"?`)) {
                            await deleteDistrict(dist.id);
                            logActivity('District Deleted', `District "${dist.name}" deleted`, 'warning');
                          }
                        }} 
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
                        title="Delete District"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCTOR AVAILABILITY CONSOLE */}
          {activeTab === 'doctor_availability' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" /> Doctor Availability & OPD Schedule Console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time status controls for doctors across all clinics in Srinagar, Anantnag, and Baramulla.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Search doctor or clinic..."
                    value={doctorAvailabilityFilter}
                    onChange={e => setDoctorAvailabilityFilter(e.target.value)}
                    className="p-2 text-xs border border-slate-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
                      <th className="p-3 font-bold">Doctor Details</th>
                      <th className="p-3 font-bold">Clinic / Location</th>
                      <th className="p-3 font-bold">Consultation Fee</th>
                      <th className="p-3 font-bold">OPD Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {doctors.filter(d => !doctorAvailabilityFilter || (d.name || '').toLowerCase().includes(doctorAvailabilityFilter.toLowerCase()) || (d.specialization || '').toLowerCase().includes(doctorAvailabilityFilter.toLowerCase())).map(docItem => {
                      const st = doctorStatuses[docItem.id] || { availability: 'Available', online: true };
                      return (
                        <tr key={docItem.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center shrink-0">
                                {(docItem.name || 'D').charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{docItem.name || 'Doctor'}</p>
                                <p className="text-[10px] text-teal-700 font-semibold">{docItem.specialization || 'General'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {clinics.find(c => c.id === docItem.clinicId)?.clinicName || 'Clinic'}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            ₹{docItem.consultationFee || 400}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              st.availability === 'Available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              st.availability === 'In OPD' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              st.availability === 'On Leave' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {st.availability}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {['Available', 'In OPD', 'On Leave', 'Emergency'].map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    setDoctorStatuses(prev => ({
                                      ...prev,
                                      [docItem.id]: { ...st, availability: opt }
                                    }));
                                    logActivity('Doctor Availability Updated', `${docItem.name} set to ${opt}`, 'info');
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    st.availability === opt 
                                      ? 'bg-slate-900 text-white shadow-sm' 
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* MEDICAL SPECIALTIES CMS */}
          {activeTab === 'specialties' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-rose-600" /> Medical Specialties CMS
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Manage clinical departments and specializations available for booking.</p>
                </div>
                <button onClick={() => setIsAddingSpecialty(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Add Specialty
                </button>
              </div>

              {isAddingSpecialty && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Specialty Name</label>
                    <input type="text" value={newSpecialty.name} onChange={e => setNewSpecialty({...newSpecialty, name: e.target.value})} placeholder="e.g. Oncology, Psychiatry..." className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Department Category</label>
                    <input type="text" value={newSpecialty.dept} onChange={e => setNewSpecialty({...newSpecialty, dept: e.target.value})} placeholder="e.g. Surgical & Cancer Care" className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setIsAddingSpecialty(false)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
                    <button onClick={() => {
                      if (newSpecialty.name) {
                        setSpecialtiesList(prev => [...prev, { id: `sp-${Date.now()}`, name: newSpecialty.name, dept: newSpecialty.dept || 'General', active: true, doctorCount: 0 }]);
                        logActivity('Specialty Created', `Added medical specialty "${newSpecialty.name}"`, 'success');
                        setNewSpecialty({ name: '', dept: '' });
                        setIsAddingSpecialty(false);
                      }
                    }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">Save</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {specialtiesList.map(sp => (
                  <div key={sp.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{sp.name}</h4>
                      <p className="text-[10px] text-slate-500">{sp.dept} • {sp.doctorCount} Doctors</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSpecialtiesList(prev => prev.map(s => s.id === sp.id ? { ...s, active: !s.active } : s));
                          logActivity('Specialty Status Updated', `Specialty "${sp.name}" active set to ${!sp.active}`, 'info');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${sp.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {sp.active ? 'Active' : 'Disabled'}
                      </button>
                      <button onClick={() => setSpecialtiesList(prev => prev.filter(s => s.id !== sp.id))} className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FACILITY TYPES CMS */}
          {activeTab === 'facility_types' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" /> Facility Types CMS
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Configure facility classifications for hospitals, labs, and clinics.</p>
                </div>
                <button onClick={() => setIsAddingFacilityType(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Add Facility Type
                </button>
              </div>

              {isAddingFacilityType && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Facility Type Name</label>
                    <input type="text" value={newFacilityType.name} onChange={e => setNewFacilityType({...newFacilityType, name: e.target.value})} placeholder="e.g. Day Care Center" className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Short Code</label>
                    <input type="text" value={newFacilityType.code} onChange={e => setNewFacilityType({...newFacilityType, code: e.target.value})} placeholder="DCC" className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" />
                  </div>
                  <button onClick={() => {
                    if (newFacilityType.name) {
                      setFacilityTypesList(prev => [...prev, { id: `ft-${Date.now()}`, name: newFacilityType.name, code: newFacilityType.code || 'FAC', active: true, count: 0 }]);
                      logActivity('Facility Type Added', `Added type "${newFacilityType.name}"`, 'success');
                      setNewFacilityType({ name: '', code: '' });
                      setIsAddingFacilityType(false);
                    }
                  }} className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold">Save</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {facilityTypesList.map(ft => (
                  <div key={ft.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{ft.name}</h4>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{ft.code}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ft.count} Registered Providers in J&K</p>
                    </div>
                    <button onClick={() => setFacilityTypesList(prev => prev.filter(f => f.id !== ft.id))} className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICE CATALOG CMS */}
          {activeTab === 'service_catalog' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-indigo-600" /> Service Catalog & Standard Fees
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Master price catalog for OPD consultations, diagnostic packages, and lab tests.</p>
                </div>
                <button onClick={() => setIsAddingService(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Add Service Item
                </button>
              </div>

              {isAddingService && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Service Name</label>
                    <input type="text" value={newServiceItem.name} onChange={e => setNewServiceItem({...newServiceItem, name: e.target.value})} placeholder="e.g. Vitamin D3 Blood Test" className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Fee (₹)</label>
                    <input type="number" value={newServiceItem.fee} onChange={e => setNewServiceItem({...newServiceItem, fee: Number(e.target.value)})} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                    <input type="text" value={newServiceItem.category} onChange={e => setNewServiceItem({...newServiceItem, category: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs" />
                  </div>
                  <button onClick={() => {
                    if (newServiceItem.name) {
                      setServiceCatalog(prev => [...prev, { id: `srv-${Date.now()}`, name: newServiceItem.name, fee: newServiceItem.fee, category: newServiceItem.category, duration: newServiceItem.duration, active: true }]);
                      logActivity('Service Catalog Item Added', `Added service "${newServiceItem.name}" (₹${newServiceItem.fee})`, 'success');
                      setNewServiceItem({ name: '', fee: 300, category: 'Consultation', duration: '15 mins' });
                      setIsAddingService(false);
                    }
                  }} className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold">Save Item</button>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50">
                      <th className="p-3 font-bold">Service Name</th>
                      <th className="p-3 font-bold">Category</th>
                      <th className="p-3 font-bold">Standard Fee</th>
                      <th className="p-3 font-bold">Duration</th>
                      <th className="p-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {serviceCatalog.map(srv => (
                      <tr key={srv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{srv.name}</td>
                        <td className="p-3 text-slate-600">{srv.category}</td>
                        <td className="p-3 font-bold text-teal-700">₹{srv.fee}</td>
                        <td className="p-3 text-slate-500">{srv.duration}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => setServiceCatalog(prev => prev.filter(s => s.id !== srv.id))} className="text-rose-600 p-1 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS CENTRAL CONSOLE */}
          {activeTab === 'appointments' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" /> Central Appointments Console
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Supervise and manage patient booking requests across Jammu & Kashmir clinics.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={aptStatusFilter} onChange={e => setAptStatusFilter(e.target.value)} className="p-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50">
                      <th className="p-3 font-bold">Patient</th>
                      <th className="p-3 font-bold">Doctor / Clinic</th>
                      <th className="p-3 font-bold">Date & Slot</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {appointments.filter(a => aptStatusFilter === 'all' || a.status === aptStatusFilter).map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{apt.patientName}</p>
                          <p className="text-[10px] text-slate-500">{apt.patientPhone}</p>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {apt.doctorName || 'General Practitioner'}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {apt.formattedDate} • {apt.timeSlot}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            apt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => logActivity('Appointment Approved', `Appointment ${apt.id} confirmed`, 'success')} className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">Confirm</button>
                            <button onClick={() => logActivity('Appointment Completed', `Appointment ${apt.id} completed`, 'info')} className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">Complete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Patient Reviews & Ratings Moderation
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Audit, approve, or hide patient feedback submitted for clinics and doctors.</p>
                </div>
              </div>

              <div className="space-y-3">
                {reviewsList.map(rev => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900">{rev.patientName}</span>
                        <span className="text-[10px] text-slate-400">• {rev.date}</span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>
                      <p className="text-[10px] text-teal-700 font-semibold mt-1">Provider: {rev.clinicName} ({rev.doctorName})</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          setReviewsList(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'approved' } : r));
                          logActivity('Review Approved', `Approved review by ${rev.patientName}`, 'success');
                        }} 
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${rev.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => {
                          setReviewsList(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'hidden' } : r));
                          logActivity('Review Flagged', `Flagged/hidden review by ${rev.patientName}`, 'warning');
                        }} 
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800"
                      >
                        Hide
                      </button>
                      <button onClick={() => setReviewsList(prev => prev.filter(r => r.id !== rev.id))} className="text-rose-600 p-1.5 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HOMEPAGE MANAGER */}
          {activeTab === 'homepage_manager' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-600" /> Patient Homepage Manager & Layout CMS
                </h2>
                <p className="text-xs text-slate-500 mt-1">Control which sections are displayed to patients on the home screen.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">Patient Home Layout Toggles</h3>
                  {Object.entries(homeSections).map(([key, enabled]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-semibold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <button 
                        onClick={() => {
                          setHomeSections(prev => ({ ...prev, [key]: !enabled }));
                          logActivity('Homepage Layout Changed', `Toggled ${key} to ${!enabled}`, 'info');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${enabled ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {enabled ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-slate-50">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">Hero Announcement Text</h3>
                  <textarea 
                    value={heroAnnouncementText}
                    onChange={e => setHeroAnnouncementText(e.target.value)}
                    className="w-full h-28 p-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button onClick={() => logActivity('Homepage Text Updated', 'Hero announcement text saved', 'success')} className="w-full py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm">
                    Save Hero Text
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USERS / PATIENT ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Registered Patient Accounts ({users.length})</h2>
              <div className="overflow-x-auto">
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50">
                      <th className="p-3 font-bold">User Name</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Phone</th>
                      <th className="p-3 font-bold">Role</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{u.name}</td>
                        <td className="p-3 text-slate-600">{u.email}</td>
                        <td className="p-3 text-slate-600">{u.phone || 'N/A'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">{u.role}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => updateUserStatus(u.uid, u.status === 'blocked' ? 'active' : 'blocked')} className="p-1.5 bg-amber-100 text-amber-800 rounded-lg"><Ban className="w-4 h-4" /></button>
                            <button onClick={() => deleteUser(u.uid)} className="p-1.5 bg-rose-100 text-rose-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* CLINICS / PROVIDERS DIRECTORY */}
          {activeTab === 'clinics' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in space-y-6">
              {/* Header & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg font-bold text-slate-900">Clinics & Healthcare Providers Directory</h2>
                    <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold">{clinics.length} Total</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Admin can directly register clinics with owner login credentials, and clinic owners can also self-register.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      generateRandomPassword();
                      setIsRegisteringClinic(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-600/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Register New Clinic (Direct)
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search by clinic name, owner name, or city..." 
                    value={clinicSearchQuery}
                    onChange={e => setClinicSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select 
                    value={clinicDistrictFilter}
                    onChange={e => setClinicDistrictFilter(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="all">All J&K Districts</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clinics Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50">
                      <th className="p-3 font-bold">Clinic / Facility</th>
                      <th className="p-3 font-bold">Owner & Contact</th>
                      <th className="p-3 font-bold">Location</th>
                      <th className="p-3 font-bold">Fee & Hours</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {clinics
                      .filter(c => {
                        const matchesQuery = !clinicSearchQuery || 
                          c.clinicName.toLowerCase().includes(clinicSearchQuery.toLowerCase()) ||
                          (c.ownerName && c.ownerName.toLowerCase().includes(clinicSearchQuery.toLowerCase())) ||
                          (c.email && c.email.toLowerCase().includes(clinicSearchQuery.toLowerCase())) ||
                          (c.city && c.city.toLowerCase().includes(clinicSearchQuery.toLowerCase()));
                        const matchesDistrict = clinicDistrictFilter === 'all' || 
                          (c.district && c.district.toLowerCase() === clinicDistrictFilter.toLowerCase());
                        return matchesQuery && matchesDistrict;
                      })
                      .map(c => {
                        const ownerUser = users.find(u => u.uid === c.ownerId || u.email?.toLowerCase() === c.email?.toLowerCase());
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-extrabold text-sm shrink-0">
                                  {c.clinicName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{c.clinicName}</p>
                                  <p className="text-[10px] text-teal-700 font-semibold">{c.clinicType || 'General Clinic'}</p>
                                  {c.verified && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Partner
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{c.ownerName || ownerUser?.name || 'Clinic Owner'}</p>
                              <p className="text-[11px] text-slate-500">{c.email || ownerUser?.email || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{c.phone || ownerUser?.phone || 'N/A'}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{c.city || 'Srinagar'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{c.district || 'Srinagar'} • J&K</p>
                              <p className="text-[9px] text-slate-400 truncate max-w-[140px]">{c.address}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">₹{c.consultationFee || 400}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> {c.timing || '09:00 AM - 06:00 PM'}
                              </p>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                c.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                <button 
                                  onClick={async () => {
                                    const nextVerified = !c.verified;
                                    await updateClinic(c.id, { verified: nextVerified, status: nextVerified ? 'active' : 'pending' });
                                    logActivity('Clinic Verification Updated', `Clinic "${c.clinicName}" verified status set to ${nextVerified}`, nextVerified ? 'success' : 'warning');
                                  }} 
                                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${c.verified ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'}`}
                                  title={c.verified ? 'Verified Active Provider' : 'Approve & Verify Clinic'}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete clinic "${c.clinicName}"? This action cannot be undone.`)) {
                                      await deleteClinic(c.id);
                                      logActivity('Clinic Deleted', `Admin deleted clinic "${c.clinicName}"`, 'warning');
                                    }
                                  }} 
                                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors border border-rose-100"
                                  title="Delete Clinic"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {clinics.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-700 text-xs font-bold">No clinics registered yet</p>
                  <p className="text-slate-400 text-[11px] mt-1 mb-4">Click below to directly register your first hospital or clinic.</p>
                  <button 
                    onClick={() => {
                      generateRandomPassword();
                      setIsRegisteringClinic(true);
                    }} 
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    + Register Clinic (Direct)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ADMIN DIRECT CLINIC REGISTRATION MODAL */}
          {isRegisteringClinic && (
            <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl my-8 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button 
                  onClick={() => setIsRegisteringClinic(false)}
                  className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Ban className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-600/30">
                    🏥
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Register & Onboard New Clinic</h2>
                    <p className="text-xs text-slate-500">Super Admin Direct Registration with Clinic Owner Login Credentials.</p>
                  </div>
                </div>

                {clinicRegError && (
                  <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{clinicRegError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminRegisterClinicSubmit} className="space-y-5">
                  {/* SECTION 1: CLINIC PROFILE */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" /> 1. Clinic / Facility Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Clinic / Hospital Name *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Kashmir Medeor Health Center"
                          value={clinicForm.clinicName}
                          onChange={e => setClinicForm({...clinicForm, clinicName: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Classification</label>
                        <select 
                          value={clinicForm.clinicType}
                          onChange={e => setClinicForm({...clinicForm, clinicType: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        >
                          <option value="General Clinic">General Clinic</option>
                          <option value="Multi-Specialty Hospital">Multi-Specialty Hospital</option>
                          <option value="Single Specialty Clinic">Single Specialty Clinic</option>
                          <option value="Diagnostic & Lab Center">Diagnostic & Lab Center</option>
                          <option value="Dental Care Center">Dental Care Center</option>
                          <option value="Maternity & Childcare Unit">Maternity & Childcare Unit</option>
                          <option value="Nursing Home & Daycare">Nursing Home & Daycare</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Standard Consultation Fee (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="400"
                          value={clinicForm.consultationFee}
                          onChange={e => setClinicForm({...clinicForm, consultationFee: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">OPD Working Hours</label>
                        <input 
                          type="text" 
                          placeholder="09:00 AM - 06:00 PM"
                          value={clinicForm.workingHours}
                          onChange={e => setClinicForm({...clinicForm, workingHours: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: OWNER LOGIN CREDENTIALS */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                        <Key className="w-4 h-4 text-teal-600" /> 2. Clinic Owner Login Account (Credentials)
                      </h3>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Owner will log in with these
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Full Name *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Dr. Tariq Ahmad Malik"
                          value={clinicForm.ownerName}
                          onChange={e => setClinicForm({...clinicForm, ownerName: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Contact / WhatsApp *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="e.g. +91 94190 12345"
                          value={clinicForm.phone}
                          onChange={e => setClinicForm({...clinicForm, phone: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Login Email *</label>
                        <input 
                          type="email" 
                          required
                          placeholder="e.g. tariq.clinic@medibrid.com"
                          value={clinicForm.email}
                          onChange={e => setClinicForm({...clinicForm, email: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-700">Owner Login Password *</label>
                          <button 
                            type="button" 
                            onClick={generateRandomPassword}
                            className="text-[10px] text-teal-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Auto-Generate
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Set secure password..."
                            value={clinicForm.password}
                            onChange={e => setClinicForm({...clinicForm, password: e.target.value})}
                            className="w-full p-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: LOCATION DETAILS */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" /> 3. J&K Location & Address
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">District (J&K) *</label>
                        <select 
                          value={clinicForm.district}
                          onChange={e => setClinicForm({...clinicForm, district: e.target.value, city: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        >
                          {districts.map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Town / Locality *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Lal Chowk / Karan Nagar"
                          value={clinicForm.city}
                          onChange={e => setClinicForm({...clinicForm, city: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Complete Street Address *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Near Municipal Complex, Main Market Road, Srinagar"
                          value={clinicForm.address}
                          onChange={e => setClinicForm({...clinicForm, address: e.target.value})}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsRegisteringClinic(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={clinicRegLoading}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {clinicRegLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Registering Clinic & Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Create Clinic & Owner Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CREATED CLINIC SUCCESS RECEIPT MODAL */}
          {createdClinicReceipt && (
            <div className="fixed inset-0 z-[700] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Clinic Registered Successfully!</h2>
                  <p className="text-xs text-slate-500 mt-0.5">The clinic and owner account are active and verified.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinic Name</span>
                    <p className="text-xs font-extrabold text-slate-900">{createdClinicReceipt.clinicName}</p>
                    <p className="text-[10px] text-slate-500">{createdClinicReceipt.district}, J&K</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">Owner Login Credentials</span>
                    <div className="bg-white p-2.5 rounded-xl border border-teal-200 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans text-[11px]">Email:</span>
                        <strong className="text-slate-900">{createdClinicReceipt.email}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-sans text-[11px]">Password:</span>
                        <strong className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{createdClinicReceipt.password}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      const shareText = `🏥 MediBrid Clinic Registration Successful!\n\nClinic: ${createdClinicReceipt.clinicName}\nOwner: ${createdClinicReceipt.ownerName}\nDistrict: ${createdClinicReceipt.district}\n\n🔑 Login Credentials:\nEmail: ${createdClinicReceipt.email}\nPassword: ${createdClinicReceipt.password}\n\nLog in at: ${window.location.origin}`;
                      navigator.clipboard.writeText(shareText);
                      setCopiedReceipt(true);
                      setTimeout(() => setCopiedReceipt(false), 2500);
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      copiedReceipt 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {copiedReceipt ? (
                      <><Check className="w-4 h-4" /> Credentials Copied to Clipboard!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Login Credentials for WhatsApp / SMS</>
                    )}
                  </button>

                  <button 
                    onClick={() => setCreatedClinicReceipt(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Done & View Providers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BANNERS */}
          {activeTab === 'banners' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">App Hero Banners</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload promotional banners displayed on patient homepage</p>
                </div>
                <button 
                  onClick={() => setIsAddingBanner(!isAddingBanner)} 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4"/> {isAddingBanner ? 'Cancel' : 'Add Banner'}
                </button>
              </div>

              {isAddingBanner && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Banner Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Banner Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Health Checkup Camp 2026" 
                        value={newBanner.title} 
                        onChange={e => setNewBanner({...newBanner, title: e.target.value})} 
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Target Link (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/details" 
                        value={newBanner.link || ''} 
                        onChange={e => setNewBanner({...newBanner, link: e.target.value})} 
                        className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-600 block">Banner Image</label>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          placeholder="Image URL (or select file on right)" 
                          value={newBanner.imageUrl} 
                          onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} 
                          className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        />
                      </div>
                      <div className="shrink-0 w-full sm:w-auto">
                        <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                          <ImageIcon className="w-4 h-4 text-slate-600" /> Upload Image
                          <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      const img = new Image();
                                      img.src = reader.result;
                                      img.onload = () => {
                                        const canvas = document.createElement('canvas');
                                        const MAX_WIDTH = 800;
                                        const MAX_HEIGHT = 800;
                                        let width = img.width;
                                        let height = img.height;

                                        if (width > height) {
                                          if (width > MAX_WIDTH) {
                                            height *= MAX_WIDTH / width;
                                            width = MAX_WIDTH;
                                          }
                                        } else {
                                          if (height > MAX_HEIGHT) {
                                            width *= MAX_HEIGHT / height;
                                            height = MAX_HEIGHT;
                                          }
                                        }

                                        canvas.width = width;
                                        canvas.height = height;
                                        const ctx = canvas.getContext('2d');
                                        if (ctx) {
                                          ctx.drawImage(img, 0, 0, width, height);
                                          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                          setNewBanner(prev => ({ ...prev, imageUrl: compressedDataUrl }));
                                        } else {
                                          setNewBanner(prev => ({ ...prev, imageUrl: reader.result as string }));
                                        }
                                      };
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                        </label>
                      </div>
                    </div>
                  </div>

                  {newBanner.imageUrl && (
                    <div className="relative rounded-xl overflow-hidden h-28 border border-slate-200 bg-slate-900">
                      <img 
                        src={newBanner.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-90" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent p-3 flex items-end">
                        <p className="text-white text-xs font-bold">{newBanner.title || 'Banner Title Preview'}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setIsAddingBanner(false)} 
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddBanner} 
                      disabled={!newBanner.title || !newBanner.imageUrl}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      Save & Publish Banner
                    </button>
                  </div>
                </div>
              )}

              {banners.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 text-xs font-bold">No custom banners added yet</p>
                  <p className="text-slate-400 text-[11px] mt-1">Click "Add Banner" above to upload your first promo banner.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map(b => (
                    <div key={b.id} className="relative rounded-2xl overflow-hidden border border-slate-200 h-40 bg-slate-900 shadow-sm group">
                      <img 
                        src={b.imageUrl} 
                        alt={b.title} 
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${b.active !== false ? 'bg-emerald-500/80 text-white border-emerald-400/50' : 'bg-slate-700/80 text-slate-300 border-slate-600'}`}>
                            {b.active !== false ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/20">
                            <button 
                              onClick={() => handleToggleBanner(b.id, b.active !== false)} 
                              className="px-2 py-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                              title="Toggle Visibility"
                            >
                              {b.active !== false ? 'Hide' : 'Show'}
                            </button>
                            <button 
                              onClick={() => handleDeleteBanner(b.id)} 
                              className="p-1 text-red-300 hover:text-red-100 hover:bg-red-500/30 rounded-lg transition-colors"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-white">{b.title}</h4>
                          {b.link && (
                            <p className="text-[10px] text-teal-300 font-medium truncate mt-0.5">{b.link}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES CMS */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900">Categories CMS</h2>
                <button onClick={() => setIsAddingCategory(true)} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Add Category</button>
              </div>

              {isAddingCategory && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex gap-3">
                  <input type="text" placeholder="Category Name" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="flex-1 p-2.5 text-xs border rounded-xl" />
                  <button onClick={async () => {
                    if (newCategory.name) {
                      await addCategory(newCategory.name, newCategory.icon);
                      setNewCategory({ name: '', icon: '' });
                      setIsAddingCategory(false);
                    }
                  }} className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold">Save</button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold text-xs">
                    <span>{cat.name}</span>
                    <button onClick={() => deleteCategory(cat.id)} className="text-rose-600 p-1"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BROADCAST CENTER */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in max-w-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" /> Push Notification & Alerts Broadcast Center
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Send instant push notifications and alerts to mobile and web devices.</p>
                </div>
              </div>

              {/* Background Push Test Card */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl border border-teal-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-teal-600" /> Test Background Push Notification (5s Countdown)
                    </h3>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      Click below, then immediately minimize the app or switch tabs. A real notification will trigger in 5 seconds!
                    </p>
                  </div>
                  <button 
                    type="button"
                    disabled={testCountdown !== null}
                    onClick={triggerDelayedPushTest}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all shrink-0 flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {testCountdown !== null ? (
                      <span className="font-mono text-sm font-black bg-teal-800 px-2 py-0.5 rounded-lg animate-pulse">
                        Minimise App! ({testCountdown}s)
                      </span>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" /> Start 5s Background Test
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Broadcast Message Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select 
                    value={notifData.targetRole} 
                    onChange={e => setNotifData({...notifData, targetRole: e.target.value as any})}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="all">📢 All Users (Patients + Clinics + Doctors)</option>
                    <option value="patient">👤 Patients Only</option>
                    <option value="clinic">🏥 Clinic Owners Only</option>
                    <option value="doctor">🩺 Doctors Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notification Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 📢 Important OPD Schedule Update" 
                    value={notifData.title} 
                    onChange={e => setNotifData({...notifData, title: e.target.value})} 
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notification Message Body *</label>
                  <textarea 
                    placeholder="Enter announcement message that will appear on devices..." 
                    value={notifData.body} 
                    onChange={e => setNotifData({...notifData, body: e.target.value})} 
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium h-24" 
                  />
                </div>

                <button 
                  onClick={async () => {
                    if (!notifData.title || !notifData.body) return;
                    setIsSending(true);
                    try {
                      await sendPushNotification(notifData.title, notifData.body, notifData.targetRole);
                      logActivity('Broadcast Sent', `Notification "${notifData.title}" dispatched to ${notifData.targetRole}`, 'success');
                      setSendSuccess(true);
                      setNotifData({ title: '', body: '', targetRole: 'all' });
                      setTimeout(() => setSendSuccess(false), 4000);
                    } finally {
                      setIsSending(false);
                    }
                  }} 
                  disabled={isSending || !notifData.title.trim() || !notifData.body.trim()}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Broadcast...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" /> Dispatch Push Broadcast
                    </>
                  )}
                </button>
                {sendSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Push Broadcast Dispatched Successfully to Devices!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIT LOG */}
          {activeTab === 'audit_log' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" /> Platform Security & Activity Audit Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time log of administrative actions, district toggles, and system events.</p>
                </div>
                <button onClick={() => alert('Audit log exported as JSON')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export CSV / Logs
                </button>
              </div>

              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.severity === 'success' ? 'bg-emerald-500' :
                        log.severity === 'warning' ? 'bg-amber-500' :
                        log.severity === 'security' ? 'bg-rose-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <p className="text-[11px] text-slate-600">{log.detail}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">{log.timestamp} • {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in space-y-6 max-w-xl">
              <h2 className="text-lg font-bold text-slate-900">Admin System Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Emergency Helpline Contact</label>
                  <input type="text" defaultValue="+91 94190 00000" className="w-full p-2.5 text-xs border rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Support Email</label>
                  <input type="text" defaultValue="support@medibrid.in" className="w-full p-2.5 text-xs border rounded-xl" />
                </div>
                <button onClick={() => alert('Settings Saved')} className="w-full py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl">Save Settings</button>
              </div>
            </div>
          )}

          {/* LEGAL POLICIES MANAGER */}
          {activeTab === 'legal_policies' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 font-extrabold text-[10px] rounded-full uppercase tracking-wider">CMS Governance</span>
                    <span className="text-xs text-slate-500">Live Legal Document Manager</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Legal & Compliance Policies Manager</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage, update, and publish official policies shown under the Patient App Legal section.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Policy Selector List */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">Select Policy To Edit</h3>
                  {(legalPolicies || []).map((pol) => {
                    const isSelected = selectedPolicyId === pol.id;
                    return (
                      <button
                        key={pol.id}
                        onClick={() => {
                          setSelectedPolicyId(pol.id);
                          setEditedPolicyTitle(pol.title);
                          setEditedPolicyContent(pol.content);
                          setPolicySaveSuccess(null);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-500/80 shadow-xs'
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <h4 className={`text-xs font-bold ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                            {pol.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Updated: {new Date(pol.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-teal-600' : 'text-slate-200'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Editor Panel */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  {(() => {
                    const activePol = legalPolicies.find(p => p.id === selectedPolicyId) || legalPolicies[0];
                    if (!activePol) return <div className="text-slate-500 text-xs">No policy selected.</div>;

                    const currentTitle = editedPolicyTitle !== '' ? editedPolicyTitle : activePol.title;
                    const currentContent = editedPolicyContent !== '' ? editedPolicyContent : activePol.content;

                    return (
                      <div className="space-y-4">
                        {policySaveSuccess && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            {policySaveSuccess}
                          </div>
                        )}

                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Editing Document ID: {activePol.id}</span>
                            <h3 className="text-base font-bold text-slate-900">Edit Policy Content</h3>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            Last Saved: {new Date(activePol.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Policy Display Title</label>
                          <input
                            type="text"
                            value={currentTitle}
                            onChange={(e) => setEditedPolicyTitle(e.target.value)}
                            className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="Policy Title..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Policy Terms & Body Content</label>
                          <textarea
                            rows={10}
                            value={currentContent}
                            onChange={(e) => setEditedPolicyContent(e.target.value)}
                            className="w-full p-3.5 text-xs font-medium text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
                            placeholder="Enter detailed legal terms, numbered clauses, and delivery/refund conditions..."
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                          <button
                            onClick={async () => {
                              await updateLegalPolicy(activePol.id, {
                                title: currentTitle,
                                content: currentContent
                              });
                              setPolicySaveSuccess(`"${currentTitle}" updated and published live successfully!`);
                              setTimeout(() => setPolicySaveSuccess(null), 4000);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Save & Publish Live Policy
                          </button>

                          <button
                            onClick={() => {
                              setEditedPolicyTitle(activePol.title);
                              setEditedPolicyContent(activePol.content);
                              setPolicySaveSuccess(null);
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 bg-slate-100 rounded-xl transition-colors"
                          >
                            Discard Unsaved Changes
                          </button>
                        </div>

                        {/* Live Patient Preview Box */}
                        <div className="mt-6 pt-5 border-t border-slate-200/80">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Patient View Live Preview
                          </p>
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-h-56 overflow-y-auto">
                            <div className="flex items-center gap-2 bg-teal-100/60 p-2.5 rounded-xl border border-teal-200">
                              <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
                              <span className="text-xs font-bold text-teal-900">{currentTitle}</span>
                            </div>
                            <div className="whitespace-pre-wrap text-[11px] text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                              {currentContent}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
