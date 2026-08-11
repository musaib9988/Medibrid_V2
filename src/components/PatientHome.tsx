import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { MapPin, Search, Star, Building2, TestTube, HeartPulse, Smile, Sparkles, Baby, Stethoscope, Home, Compass, Calendar, User, Map as MapIcon, MessageSquare, LogOut, Grid } from 'lucide-react';
import { ClinicProfileView } from './ClinicProfileView';
import { MessagesTab } from './MessagesTab';

export const PatientHome: React.FC = () => {
  const { clinics, userProfile, selectedClinic, setSelectedClinic, patientTab, setPatientTab, banners, categories: dbCategories, logoutUser, openAuthModal, firebaseUser, requestPermissions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  const handleRequestPermissions = async () => {
    setPermissionLoading(true);
    try {
      await requestPermissions();
    } finally {
      setPermissionLoading(false);
    }
  };

  const defaultBanners = [
    {
      id: 'default-1',
      title: 'Find & Book Verified Healthcare Professionals Near You',
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
      active: true
    },
    {
      id: 'default-2',
      title: '24/7 Laboratory Tests & Home Sample Collection',
      imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
      active: true
    }
  ];

  const fetchedActiveBanners = banners.filter(b => b.active !== false);
  const activeBanners = fetchedActiveBanners.length > 0 ? fetchedActiveBanners : (banners.length > 0 ? banners : defaultBanners);

  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17) timeGreeting = 'Good evening';

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'User';

  if (selectedClinic) {
    return <ClinicProfileView />;
  }

  const filteredClinics = clinics.filter(c => {
    if (c.status !== 'active') return false;

    // Strict filtering by district or city based on user's location
    if (userProfile?.district && c.district) {
      if (c.district.toLowerCase() !== userProfile.district.toLowerCase()) {
        return false;
      }
    } else if (userProfile?.city && c.city) {
      if (c.city.toLowerCase() !== userProfile.city.toLowerCase()) {
        return false;
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!c.clinicName.toLowerCase().includes(query) && !c.city.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Filter by category
    if (activeCategory !== 'all') {
      const isLab = activeCategory.toLowerCase().includes('lab');
      if (isLab && (!c.services || !c.services.some(s => s.toLowerCase().includes('lab')))) {
        return false;
      } else if (!isLab) {
        // Assume activeCategory is a specialization like 'dentist' or 'cardiologist'
        const hasSpec = c.specializations && c.specializations.some(s => s.toLowerCase().includes(activeCategory.toLowerCase()));
        const hasServ = c.services && c.services.some(s => s.toLowerCase().includes(activeCategory.toLowerCase()));
        if (!hasSpec && !hasServ) {
          return false;
        }
      }
    }
    
    return true;
  });

  const defaultCategories = [
    { id: 'clinics', label: 'Clinics', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'labs', label: 'Laboratories', icon: TestTube, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'dentist', label: 'Dentistry', icon: Smile, color: 'text-teal-500', bg: 'bg-teal-50' },
    { id: 'general', label: 'General', icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const categories = [
    ...defaultCategories,
    ...dbCategories.map(cat => ({
      id: cat.id,
      label: cat.name,
      icon: Grid,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      image: cat.icon
    }))
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-10 animate-in fade-in">
      <Header />
      
      {patientTab === 'home' && (
        <>
          {firebaseUser && (!userProfile?.city || !userProfile?.fcmToken) && !dismissedPrompt && (
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 relative">
              <button 
                onClick={() => setDismissedPrompt(true)}
                className="absolute top-3 right-3 text-teal-700 hover:text-teal-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-teal-100 transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 pr-6">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-teal-900 text-sm">Healthcare near you?</h4>
                  <p className="text-teal-700 text-xs">Enable location and notifications to find the best clinics and receive appointment alerts.</p>
                </div>
              </div>
              <button 
                onClick={handleRequestPermissions}
                disabled={permissionLoading}
                className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shrink-0 whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {permissionLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Accessing...
                  </>
                ) : 'Allow Access'}
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{timeGreeting}, {firstName}!</h1>
            <p className="text-slate-500 text-sm mb-4">Discover verified clinics, labs, and specialists near you.</p>
            
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clinics by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
              />
            </div>
          </div>

          {activeBanners.length > 0 && (
            <div className="w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200 relative bg-white">
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
                {activeBanners.map((banner, index) => (
                  <div key={banner.id} className="min-w-full snap-center relative">
                    <a href={banner.link || '#'} target={banner.link ? '_blank' : '_self'} rel="noreferrer" className="block relative">
                      <div className="w-full h-48 md:h-64 bg-slate-100 relative">
                        {banner.imageUrl && !imageErrors[banner.id] ? (
                          <img 
                            src={banner.imageUrl} 
                            alt={banner.title} 
                            className="w-full h-full object-cover" 
                            onError={() => setImageErrors(prev => ({ ...prev, [banner.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-r from-teal-600 to-emerald-700 p-6 text-center text-xl">
                            {banner.title}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="font-bold text-lg md:text-xl drop-shadow-md">{banner.title}</h3>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              {activeBanners.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {activeBanners.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm"></div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Categories</h2>
            <div className="grid grid-rows-5 grid-flow-col gap-x-6 gap-y-4 overflow-x-auto pb-4 no-scrollbar">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id === activeCategory ? 'all' : cat.label)}
                  className="flex items-center gap-3 cursor-pointer min-w-[140px]"
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${cat.bg} ${cat.color} shadow-sm border ${activeCategory === cat.label ? 'border-teal-500 ring-2 ring-teal-200' : 'border-slate-100'} transition-all hover:scale-105`}>
                    {'image' in cat && cat.image ? (
                      <img src={cat.image as string} alt={cat.label} className="w-6 h-6 object-contain" />
                    ) : (
                      <cat.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${activeCategory === cat.label ? 'text-teal-700 font-bold' : 'text-slate-700'}`}>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Platform Clinics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClinics.length > 0 ? (
                filteredClinics.map((clinic) => (
                  <div key={clinic.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="h-32 bg-slate-200 w-full overflow-hidden relative cursor-pointer" onClick={() => setSelectedClinic(clinic)}>
                      {clinic.coverImageUrl ? (
                        <img src={clinic.coverImageUrl} alt={clinic.clinicName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-teal-500 to-emerald-400 opacity-80" />
                      )}
                      {clinic.verified && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="p-4 relative flex-1 flex flex-col">
                      <div className="w-12 h-12 bg-white rounded-full p-1 border border-slate-200 absolute -top-6 left-4 shadow-sm cursor-pointer" onClick={() => setSelectedClinic(clinic)}>
                        {clinic.logoUrl ? (
                          <img src={clinic.logoUrl} alt="Logo" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                            {clinic.clinicName.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 flex-1 cursor-pointer" onClick={() => setSelectedClinic(clinic)}>
                        <h3 className="font-bold text-slate-900 text-lg hover:text-teal-700 transition-colors">{clinic.clinicName}</h3>
                        <div className="flex items-center text-slate-500 text-xs mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          <span>{clinic.address}, {clinic.city}</span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center text-amber-500 text-xs font-bold">
                            <Star className="w-4 h-4 fill-current mr-1" />
                            4.8 (12 Reviews)
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <button className="text-teal-600 font-bold text-sm hover:underline w-full text-center" onClick={() => setSelectedClinic(clinic)}>
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                  <h3 className="text-lg font-bold text-slate-700 mb-1">No clinics available yet.</h3>
                  <p className="text-slate-500 text-sm">Check back soon for verified healthcare providers.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {patientTab === 'discover' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center py-12">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Discover Health</h2>
          <p className="text-slate-500">More discovery features and map view coming soon.</p>
        </div>
      )}

      {patientTab === 'appointments' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">My Visits</h2>
          <p className="text-slate-500">You have no upcoming appointments.</p>
        </div>
      )}

      {patientTab === 'messages' && (
        <MessagesTab />
      )}

      {patientTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">My Profile</h2>
          {userProfile ? (
            <>
              <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
                  {firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{userProfile.name}</h3>
                  <p className="text-slate-500 text-sm">{userProfile.email}</p>
                  <p className="text-slate-500 text-sm">{userProfile.phone || ''}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100">
                  <span className="font-bold text-slate-700">Account Settings</span>
                  <span className="text-slate-400">›</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100">
                  <span className="font-bold text-slate-700">Help & Support</span>
                  <span className="text-slate-400">›</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">You are not logged in.</p>
            </div>
          )}
        </div>
      )}

      {patientTab === 'profile' && !firebaseUser && (
        <div className="mt-8 text-center pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Are you a medical professional?{' '}
            <button 
              onClick={() => openAuthModal('clinic_owner')} 
              className="text-teal-600 font-bold hover:underline"
            >
              Clinic Partner Login
            </button>
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Are you a patient?{' '}
            <button 
              onClick={() => openAuthModal('user')} 
              className="text-teal-600 font-bold hover:underline"
            >
              Patient Login
            </button>
          </p>
        </div>
      )}

      {patientTab === 'profile' && firebaseUser && (
        <div className="mt-8 text-center pt-8 border-t border-slate-200">
          <button 
            onClick={logoutUser}
            className="text-red-500 font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}

      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
        <button onClick={() => setPatientTab('home')} className={`flex flex-col items-center gap-1 ${patientTab === 'home' ? 'text-teal-600' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setPatientTab('discover')} className={`flex flex-col items-center gap-1 ${patientTab === 'discover' ? 'text-teal-600' : 'text-slate-400'}`}>
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-bold">Discover</span>
        </button>
        <button onClick={() => setPatientTab('appointments')} className={`flex flex-col items-center gap-1 ${patientTab === 'appointments' ? 'text-teal-600' : 'text-slate-400'}`}>
          <Calendar className="w-6 h-6" />
          <span className="text-[10px] font-bold">My Visits</span>
        </button>
        <button onClick={() => setPatientTab('messages')} className={`flex flex-col items-center gap-1 ${patientTab === 'messages' ? 'text-teal-600' : 'text-slate-400'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-bold">Chats</span>
        </button>
        <button onClick={() => setPatientTab('profile')} className={`flex flex-col items-center gap-1 ${patientTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
};
