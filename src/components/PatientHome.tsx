import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, Search, Star, Building2, TestTube, HeartPulse, Smile, Baby, Stethoscope, 
  Home, Compass, Calendar, User, Map as MapIcon, MessageSquare, LogOut, Grid, 
  Bell, Maximize2, ChevronRight, QrCode, FileText, Receipt, RefreshCw, XCircle, 
  Shield, FileCheck, Tag, Share2, ShieldCheck, RotateCcw, Brain, Eye, Activity, Truck
} from 'lucide-react';
import { ClinicProfileView } from './ClinicProfileView';
import { MessagesTab } from './MessagesTab';
import { ProfileEditForm } from './ProfileEditForm';

export const PatientHome: React.FC = () => {
  const { clinics, userProfile, selectedClinic, setSelectedClinic, patientTab, setPatientTab, logoutUser, firebaseUser, requestPermissions, banners, districts, sendPushNotification } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [activeProfileModal, setActiveProfileModal] = useState<{title: string, subtitle?: string} | null>(null);

  const handleRequestPermissions = async () => {
    setPermissionLoading(true);
    try {
      await requestPermissions();
    } finally {
      setPermissionLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'User';
  const fullName = userProfile?.name || 'User';

  if (selectedClinic) {
    return <ClinicProfileView />;
  }

  const filteredClinics = clinics.filter(c => {
    if (c.status !== 'active') return false;
    
    const activeDistricts = districts.filter(d => d.active).map(d => d.name.toLowerCase());
    if (c.district && activeDistricts.length > 0) {
      if (!activeDistricts.includes(c.district.toLowerCase())) return false;
    }

    if (userProfile?.district && c.district) {
      if (c.district.toLowerCase() !== userProfile.district.toLowerCase()) return false;
    } else if (userProfile?.city && c.city) {
      if (c.city.toLowerCase() !== userProfile.city.toLowerCase()) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!c.clinicName.toLowerCase().includes(query) && !c.city.toLowerCase().includes(query)) return false;
    }
    if (activeCategory !== 'all') {
      const isLab = activeCategory.toLowerCase().includes('lab');
      if (isLab && (!c.services || !c.services.some(s => s.toLowerCase().includes('lab')))) return false;
      else if (!isLab) {
        const hasSpec = c.specializations && c.specializations.some(s => s.toLowerCase().includes(activeCategory.toLowerCase()));
        const hasServ = c.services && c.services.some(s => s.toLowerCase().includes(activeCategory.toLowerCase()));
        if (!hasSpec && !hasServ) return false;
      }
    }
    return true;
  });

  const categories = [
    { id: 'neurology', label: 'Neurology', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'cardiology', label: 'Cardiology', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'orthopedics', label: 'Orthopedics', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'pathology', label: 'Pathology', icon: TestTube, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'eye', label: 'Eye & Vision', icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { id: 'pediatrics', label: 'Pediatrics', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'dermatology', label: 'Dermatology', icon: Smile, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'general', label: 'General Physician', icon: Stethoscope, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'ent', label: 'ENT Care', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'dental', label: 'Dental Care', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'gynecology', label: 'Gynecology', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'radiology', label: 'Radiology & Scans', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  const ProfileMenuItem = ({ icon, title, subtitle, isLast = false, onClick }: any) => (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </div>
  );

  const ClinicCard = ({ clinic }: { clinic: any; key?: any }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col p-4 mb-3 cursor-pointer" onClick={() => setSelectedClinic(clinic)}>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
           {clinic.logoUrl || clinic.coverImageUrl ? (
             <img src={clinic.logoUrl || clinic.coverImageUrl} alt={clinic.clinicName} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500" />
           )}
           {clinic.verified && (
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center">
               <ShieldCheck className="w-3 h-3 text-white" />
             </div>
           )}
        </div>
        <div className="flex-1">
           <h3 className="font-bold text-slate-900 text-sm">{clinic.clinicName}</h3>
           <p className="text-xs text-slate-500 mb-1 line-clamp-1">{clinic.specializations?.join(', ') || 'Multi-Specialty Care'}</p>
           <div className="flex items-center gap-2 text-[10px] text-teal-700 font-bold mb-2">
             <span className="bg-teal-50 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3" /> 2.1 km</span>
             <span className="text-slate-500 font-medium">{clinic.district || clinic.city}</span>
           </div>
           <div className="flex items-center gap-3 text-xs">
             <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-3.5 h-3.5 fill-current" /> 4.9 <span className="text-slate-400 font-medium">(210)</span></span>
             <span className="text-slate-300">•</span>
             <span className="text-slate-600 font-medium">Fees <strong className="text-slate-900">₹400</strong></span>
           </div>
        </div>
        <div>
           <button className="bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
             Book Now
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 min-h-screen">
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {patientTab === 'home' && (
          <div className="animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                  <img src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} className="w-full h-full object-cover" alt="User" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{getGreeting()}</p>
                  <h1 className="text-sm font-bold text-slate-900">{firstName} 👋</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold border border-teal-100">
                  <MapPin className="w-3.5 h-3.5" />
                  {userProfile?.district || 'Detecting...'}
                </div>
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 relative shadow-sm">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </div>
              </div>
            </div>

            {/* Hero Banners */}
            <div className="mb-8">
              {banners.filter(b => b.active).length > 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
                  {banners.filter(b => b.active).map(banner => (
                    <div key={banner.id} className="min-w-[85vw] md:min-w-[400px] h-[180px] snap-center shrink-0 rounded-[32px] overflow-hidden relative shadow-md bg-slate-900">
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent flex flex-col justify-end p-5">
                        <h2 className="text-white text-xl font-bold mb-3">{banner.title}</h2>
                        {banner.link ? (
                          <a href={banner.link} target="_blank" rel="noreferrer" className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold w-fit hover:bg-slate-100 transition-colors shadow-sm">
                            Learn More
                          </a>
                        ) : (
                          <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-xs font-bold w-fit hover:bg-white hover:text-slate-900 transition-colors shadow-sm">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#2D8C7C] rounded-[32px] p-6 relative overflow-hidden flex items-center shadow-md">
                  <div className="z-10 w-2/3 pr-4">
                    <h2 className="text-white text-xl font-bold mb-2">Looking for desired doctor?</h2>
                    <p className="text-teal-50 text-xs mb-4 opacity-90 leading-relaxed">Find certified doctors in {userProfile?.district || 'Srinagar'} and book 10-minute slots.</p>
                    <button className="bg-white text-teal-800 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm hover:scale-105 transition-transform w-fit">
                      <Search className="w-4 h-4 text-teal-600" /> Search for
                    </button>
                  </div>
                  <div className="absolute right-0 bottom-0 w-[45%] h-[120%] flex items-end justify-end translate-y-2">
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80" className="object-cover h-full rounded-tl-full rounded-bl-full border-4 border-[#2D8C7C]" alt="Doctor" />
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-bold text-slate-900 text-lg">Find your doctor</h3>
                <button className="text-teal-600 text-sm font-bold flex items-center gap-1 hover:underline">See All <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {categories.map(cat => (
                  <div key={cat.id} onClick={() => setPatientTab('discover')} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cat.bg} ${cat.color} shadow-sm border border-white group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 text-center leading-tight">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Appointment */}
            <div className="mb-8 bg-teal-800/90 rounded-[24px] p-4 flex items-center justify-between text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[9px] text-teal-200 uppercase font-bold tracking-widest mb-1">Upcoming Appointment</p>
                  <h4 className="font-bold text-white text-sm">Dr. Aamir Khan</h4>
                  <p className="text-[10px] text-teal-50/80">Tuesday, August 11, 2026 • 05:00 AM</p>
                </div>
              </div>
              <button className="bg-teal-900/50 hover:bg-teal-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-colors relative z-10 border border-white/10 shrink-0">
                Pass <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Top Verified Doctors */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-5 px-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Top Verified Doctors</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Nearest specialists in {userProfile?.district || 'Srinagar'}</p>
                </div>
                <button className="text-teal-600 bg-teal-50/50 border border-teal-100 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-teal-50 transition-colors">
                  <Maximize2 className="w-3 h-3" /> Full Screen View
                </button>
              </div>
              
              <div className="flex flex-col gap-0">
                {filteredClinics.slice(0, 3).map((clinic) => (
                   <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
              
              <button className="w-full mt-2 bg-[#1A2E35] text-white rounded-[20px] p-4 flex items-center justify-between shadow-lg hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <MapIcon className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-left">
                      <h4 className="font-bold text-sm">View All {filteredClinics.length} Doctors in Full Screen</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Interactive Map • Distance Radius • Instant Slot Booking</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {patientTab === 'discover' && (
          <div className="animate-in fade-in pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Clinics & Doctors</h1>
                <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-teal-100">{filteredClinics.length} Clinics & Doctors</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs font-medium bg-white shadow-sm px-3 py-1.5 rounded-full border border-slate-100">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{userProfile?.district || 'Srinagar'}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6 px-1">Find verified clinics & doctors in <strong className="text-slate-700">{userProfile?.district || 'Srinagar'}</strong></p>
            
            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search clinics, doctors in ${userProfile?.district || 'Srinagar'} (e.g. Budgam)...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 shadow-sm rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-4 px-4 pb-1">
              {['All Categories', 'Doctors', 'Clinics', 'Hospitals', 'Diagnostics'].map(p => (
                <button key={p} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-colors ${p === 'All Categories' ? 'bg-[#2D8C7C] text-white border-transparent' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {p}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4 pb-2">
              <button className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-white border border-slate-200 text-slate-700 flex items-center gap-1 shadow-sm hover:bg-slate-50">
                <span className="text-amber-500">⚡</span> Available Today
              </button>
              <button className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-slate-900 text-white border border-slate-900 shadow-sm">
                All Specialties
              </button>
              {['Cardiologist', 'Gynecologist', 'Pediatrician', 'Neurologist'].map(p => (
                <button key={p} className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50">
                    {p}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-0 mt-2">
              {filteredClinics.length > 0 ? (
                filteredClinics.map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">No clinics found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or location.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {patientTab === 'messages' && (
          <MessagesTab />
        )}

        {patientTab === 'appointments' && (
          <div className="animate-in fade-in flex flex-col items-center justify-center h-[60vh] text-center px-6">
             <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 border border-teal-100 shadow-sm">
                <Calendar className="w-10 h-10 text-teal-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">No Appointments Yet</h2>
             <p className="text-slate-500 text-sm mb-8 max-w-[260px]">You haven't booked any consultations yet. Find a doctor to get started.</p>
             <button onClick={() => setPatientTab('discover')} className="bg-[#2D8C7C] text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:bg-teal-700 transition-colors">
                Find a Doctor
             </button>
          </div>
        )}

        {patientTab === 'profile' && (
          <div className="animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Account</h1>
                <button 
                  onClick={() => setActiveProfileModal({title: "Edit Profile"})}
                  className="flex items-center gap-1.5 text-teal-700 bg-teal-50/80 px-3 py-1.5 rounded-full text-xs font-bold border border-teal-100 hover:bg-teal-100 transition-colors"
                >
                  <User className="w-3.5 h-3.5" /> Edit Profile
                </button>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-200 mb-8">
                <img src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" alt="Profile" />
                <div className="flex-1">
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-0.5">{getGreeting()}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-lg text-slate-900 leading-none">{fullName} 👋</h2>
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-md font-bold border border-emerald-100">Verified Patient</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2.5">{userProfile?.phone || '+91 --- --- ----'} • {userProfile?.gender || 'N/A'}, {userProfile?.age || '--'} yrs</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-slate-200 font-medium"><MapPin className="w-3 h-3 text-rose-500" /> {userProfile?.district || 'Not Set'}</span>
                    <span className="text-[10px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 font-bold">Blood Group: {userProfile?.bloodGroup || 'N/A'}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
            </div>
            
            <div className="mb-8">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#2D8C7C] rounded-full"></div>
                  Medical & Records
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "My Prescriptions & OPD Receipts"})} icon={<FileText />} title="My Prescriptions & OPD Receipts" subtitle="SKIMS, SMHS & Polyclinic prescriptions" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Lab & Diagnostic Reports"})} icon={<TestTube />} title="Lab & Diagnostic Reports" subtitle="Blood tests, MRI, X-Ray results" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Consultation History"})} icon={<Calendar />} title="Consultation History" subtitle="4 total appointments booked" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Active Medications & Reminders"})} icon={<Bell />} title="Active Medications & Reminders" subtitle="Daily dosage tracker and pill alarms" isLast />
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-[#2D8C7C] rounded-full"></div>
                  Legal
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Shipping & Medicine Delivery Policy"})} icon={<Truck />} title="Shipping & Medicine Delivery Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Refund Policy"})} icon={<Receipt />} title="Refund Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Return Policy"})} icon={<RefreshCw />} title="Return Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Cancellation Policy"})} icon={<XCircle />} title="Cancellation Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Privacy Policy"})} icon={<Shield />} title="Privacy Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Terms and Conditions"})} icon={<FileCheck />} title="Terms and Conditions" isLast />
                </div>
            </div>

            <button 
                onClick={logoutUser}
                className="w-full bg-rose-50 text-rose-600 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm font-bold border border-rose-100 hover:bg-rose-100 transition-colors mt-8 mb-6"
            >
                <LogOut className="w-5 h-5" />
                Sign Out / Disconnect
            </button>
          </div>
        )}
      </div>

      {activeProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-in fade-in">
          <div className="bg-white w-full sm:w-[400px] h-[80vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="font-bold text-slate-800">{activeProfileModal.title}</h2>
                <p className="text-xs text-slate-500">Manage records and details</p>
              </div>
              <button onClick={() => setActiveProfileModal(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {activeProfileModal.title === 'Edit Profile' ? (
                <ProfileEditForm onClose={() => setActiveProfileModal(null)} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <FileText className="w-10 h-10" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">No Records Found</h3>
                   <p className="text-sm text-slate-500 mb-6">You haven't added any documents to {activeProfileModal.title} yet.</p>
                   <button className="bg-[#2D8C7C] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-teal-700 transition-colors flex items-center gap-2">
                      <span className="text-lg leading-none">+</span> Upload New Record
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 pt-3 pb-safe-4 pb-4 flex justify-between items-center z-50">
        <button onClick={() => setPatientTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${patientTab === 'home' ? 'text-[#2D8C7C]' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setPatientTab('discover')} className={`flex flex-col items-center gap-1 transition-colors ${patientTab === 'discover' ? 'text-[#2D8C7C]' : 'text-slate-400 hover:text-slate-600'}`}>
          <Building2 className="w-6 h-6" />
          <span className="text-[10px] font-bold">Clinics</span>
        </button>
        <button onClick={() => setPatientTab('appointments')} className={`flex flex-col items-center gap-1 transition-colors ${patientTab === 'appointments' ? 'text-[#2D8C7C] relative' : 'text-slate-400 relative hover:text-slate-600'}`}>
          <Calendar className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold shadow-sm">3</span>
          <span className="text-[10px] font-bold">Appointments</span>
        </button>
        <button onClick={() => setPatientTab('messages')} className={`flex flex-col items-center gap-1 transition-colors ${patientTab === 'messages' ? 'text-[#2D8C7C] relative' : 'text-slate-400 relative hover:text-slate-600'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold shadow-sm">3</span>
          <span className="text-[10px] font-bold">Messages</span>
        </button>
        <button onClick={() => setPatientTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${patientTab === 'profile' ? 'text-[#2D8C7C]' : 'text-slate-400 hover:text-slate-600'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
};
