import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, Search, Star, Building2, TestTube, HeartPulse, Smile, Baby, Stethoscope, 
  Home, Compass, Calendar, User, Map as MapIcon, MessageSquare, LogOut, Grid, 
  Bell, Maximize2, ChevronRight, QrCode, FileText, Receipt, RefreshCw, XCircle, 
  Shield, FileCheck, Tag, Share2, ShieldCheck, RotateCcw, Brain, Eye, Activity, Truck,
  Clock, Timer, Users, X, Sparkles
} from 'lucide-react';
import { ClinicProfileView } from './ClinicProfileView';
import { MessagesTab } from './MessagesTab';
import { ProfileEditForm } from './ProfileEditForm';
import { FeedbackModal } from './FeedbackModal';
import { UnserviceableLocationView } from './UnserviceableLocationView';

const DEFAULT_FALLBACK_CLINICS: any[] = [];

interface CountdownProps {
  targetDate: Date;
}

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

const ClinicCard: React.FC<{ clinic: any; index?: number; onSelect: (clinic: any) => void }> = ({ clinic, index = 0, onSelect }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col p-4 mb-4 cursor-pointer relative" 
    onClick={() => onSelect(clinic)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    <div className="flex gap-4 relative z-10">
      <div className="w-16 h-16 rounded-[20px] bg-slate-100 overflow-hidden shrink-0 relative shadow-inner">
         {clinic.logoUrl || clinic.coverImageUrl ? (
           <img src={clinic.logoUrl || clinic.coverImageUrl} alt={clinic.clinicName} className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
             {clinic.clinicName ? clinic.clinicName.charAt(0) : 'C'}
           </div>
         )}
         {(clinic.verified || clinic.verified === undefined) && (
           <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 border-2 border-white rounded-full flex items-center justify-center">
             <ShieldCheck className="w-3 h-3 text-white" />
           </div>
         )}
      </div>
      <div className="flex-1">
         <h3 className="font-bold text-slate-900 text-sm">{clinic.clinicName}</h3>
         <p className="text-xs text-slate-500 mb-1 line-clamp-1">{clinic.specializations?.join(', ') || 'Multi-Specialty Care'}</p>
         <div className="flex flex-wrap items-center gap-2 text-[10px] text-teal-700 font-bold mb-2">
           <span className="bg-teal-50 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3" /> 2.1 km</span>
           <span className="text-slate-500 font-medium">{clinic.district || clinic.city || 'Srinagar'}</span>
           <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1 ml-auto">
             <Users className="w-3 h-3 text-amber-600 animate-pulse" />
             <span>{clinic.waitingPatients || 0} Waiting</span>
           </span>
         </div>
         <div className="flex items-center gap-3 text-xs">
           <span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-3.5 h-3.5 fill-current" /> {clinic.rating || 4.9} <span className="text-slate-400 font-medium">({clinic.reviewCount || 210})</span></span>
           <span className="text-slate-300">•</span>
           <span className="text-slate-600 font-medium">Fees <strong className="text-slate-900">₹{clinic.consultationFee || 400}</strong></span>
         </div>
      </div>
      <div>
         <button className="bg-teal-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap hover:bg-teal-700 transition-colors">
           Book Now
         </button>
      </div>
    </div>
  </motion.div>
);

const AppointmentCountdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const calculateTimeLeft = (target: Date) => {
    const diff = target.getTime() - new Date().getTime();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    const totalSecs = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSecs / 86400),
      hours: Math.floor((totalSecs % 86400) / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
      isExpired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 px-3 py-1 rounded-full backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>Session Starting Now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl min-w-[42px]">
          <span className="text-xs sm:text-sm font-extrabold text-white leading-none">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[8px] text-teal-200 font-medium uppercase tracking-wider mt-0.5">
            Days
          </span>
        </div>
      )}
      <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl min-w-[42px]">
        <span className="text-xs sm:text-sm font-extrabold text-white leading-none">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[8px] text-teal-200 font-medium uppercase tracking-wider mt-0.5">
          Hours
        </span>
      </div>
      <span className="text-white/60 font-bold text-xs leading-none">:</span>
      <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl min-w-[42px]">
        <span className="text-xs sm:text-sm font-extrabold text-white leading-none">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[8px] text-teal-200 font-medium uppercase tracking-wider mt-0.5">
          Mins
        </span>
      </div>
      <span className="text-white/60 font-bold text-xs leading-none">:</span>
      <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-xl min-w-[42px] border-teal-300/40">
        <span className="text-xs sm:text-sm font-extrabold text-teal-300 leading-none animate-pulse">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[8px] text-teal-200 font-medium uppercase tracking-wider mt-0.5">
          Secs
        </span>
      </div>
    </div>
  );
};

function getAppointmentTargetDate(dateStr?: string, timeSlotStr?: string): Date {
  const now = new Date();
  let targetDate: Date | null = null;

  try {
    if (typeof dateStr === 'string' && dateStr.trim()) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        let hours = 10;
        let minutes = 0;

        if (typeof timeSlotStr === 'string' && timeSlotStr.trim()) {
          const isPM = /pm/i.test(timeSlotStr);
          const isAM = /am/i.test(timeSlotStr);
          const match = timeSlotStr.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;
          }
        }

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          targetDate = new Date(year, month, day, hours, minutes, 0);
        }
      }
    }
  } catch (err) {
    console.warn("Error parsing appointment date:", err);
  }

  if (!targetDate || isNaN(targetDate.getTime()) || targetDate.getTime() <= now.getTime()) {
    return new Date(now.getTime() + (3 * 3600 + 45 * 60 + 30) * 1000);
  }

  return targetDate;
}

export const PatientHome: React.FC = () => {
  const { clinics, userProfile, selectedClinic, setSelectedClinic, patientTab, setPatientTab, logoutUser, firebaseUser, requestPermissions, banners, districts, sendPushNotification, updateAppointmentStatus, openAuthModal, appointments = [], legalPolicies = [], userLocationDistrict, role } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [activeProfileModal, setActiveProfileModal] = useState<{title: string, subtitle?: string, policyId?: string} | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      // Use OSM Nominatim for reverse geocoding as fallback if API key is not present
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      if (data && data.address) {
        const district = data.address.county || data.address.state_district || data.address.city;
        if (district) {
          setSelectedDistrictFilter(district);
          setIsLocationPickerOpen(false);
        } else {
          alert('Could not determine district from your location.');
        }
      }
    } catch (err) {
      alert('Failed to detect location. Please check your permissions.');
    } finally {
      setIsLocating(false);
    }
  };
  const [upcoming1HourAlert, setUpcoming1HourAlert] = useState<{
    appointment: any;
    minutesLeft: number;
  } | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [healthTip, setHealthTip] = useState<{ title: string; category: string; tip: string } | null>(null);
  const [healthTipLoading, setHealthTipLoading] = useState(true);

  const fetchHealthTip = async () => {
    setHealthTipLoading(true);
    try {
      const res = await fetch('/api/health-tip');
      const data = await res.json();
      if (data && data.tip) {
        setHealthTip(data);
      }
    } catch (e) {
      setHealthTip({
        title: "Kashmiri Herbal & Wellness Care",
        category: "Seasonal Care",
        tip: "Stay warm and hydrated during chilly valley mornings. Warm Kashmiri Kahwa with a hint of saffron supports respiratory comfort and immunity."
      });
    } finally {
      setHealthTipLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthTip();
  }, []);

  const activeAppointment = (appointments || []).find(a => 
    a && (a.patientId === firebaseUser?.uid || a.patientId === userProfile?.uid) &&
    (a.status === 'upcoming' || a.status === 'confirmed')
  );

  const displayAppointment = activeAppointment || null;

  const targetAppointmentDate = useMemo(() => {
    if (!displayAppointment) return new Date();
    return getAppointmentTargetDate(displayAppointment.date, displayAppointment.timeSlot);
  }, [displayAppointment?.date, displayAppointment?.timeSlot]);

  // Periodic scheduling check for appointments scheduled within 1 hour
  useEffect(() => {
    const checkScheduledAppointments = () => {
      const now = new Date();
      const userApts = (appointments || []).filter(a => 
        a && (a.patientId === firebaseUser?.uid || a.patientId === userProfile?.uid) &&
        (a.status === 'upcoming' || a.status === 'confirmed')
      );

      const aptsToCheck = userApts;

      for (const apt of aptsToCheck) {
        const target = getAppointmentTargetDate(apt.date, apt.timeSlot);
        const diffMs = target.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        const aptKey = apt.id || `${apt.doctorName}-${apt.timeSlot}-${apt.date || 'today'}`;

        if (diffMins > 0 && diffMins <= 60 && !dismissedAlerts.includes(aptKey)) {
          setUpcoming1HourAlert({
            appointment: apt,
            minutesLeft: diffMins,
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Upcoming Appointment Reminder', {
                body: `Your appointment with ${apt.doctorName || 'Doctor'} is in ${diffMins} minutes (${apt.timeSlot}).`,
                icon: '/favicon.ico'
              });
            } catch (e) {
              console.log('Notification silenced:', e);
            }
          }
          return;
        }
      }

      setUpcoming1HourAlert(null);
    };

    checkScheduledAppointments();
    const interval = setInterval(checkScheduledAppointments, 15000);
    return () => clearInterval(interval);
  }, [appointments, firebaseUser, userProfile, dismissedAlerts]);

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

  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');

  // Live districts where operational clinics currently exist
  const liveDistricts = useMemo(() => {
    const set = new Set<string>();
    (clinics || []).forEach(c => {
      if (c && c.status !== 'inactive' && c.status !== 'rejected' && c.status !== 'suspended') {
        if (c.district && c.district.trim()) {
          set.add(c.district.trim());
        }
        if (c.city && c.city.trim()) {
          set.add(c.city.trim());
        }
      }
    });
    const arr = Array.from(set);
    if (arr.length === 0) {
      return ['Shopian', 'Srinagar', 'Budgam'];
    }
    return arr;
  }, [clinics]);

  // Current active location name
  const activeLocationName = useMemo(() => {
    if (selectedDistrictFilter && selectedDistrictFilter !== 'all') {
      return selectedDistrictFilter;
    }
    return userProfile?.district || 'Pulwama 192303';
  }, [selectedDistrictFilter, userProfile?.district]);

  // Check if current active location is operational
  const isLocationServiceable = useMemo(() => {
    if (selectedDistrictFilter === 'all' && !userProfile?.district) return true;
    const target = activeLocationName.toLowerCase().trim();
    return liveDistricts.some(ld => {
      const live = ld.toLowerCase().trim();
      return target === live || target.includes(live) || live.includes(target);
    });
  }, [activeLocationName, liveDistricts, selectedDistrictFilter, userProfile?.district]);

  const allAvailableClinics = useMemo(() => {
    const map = new Map<string, any>();
    // 1. Put default fallback clinics first
    DEFAULT_FALLBACK_CLINICS.forEach(c => map.set(c.id, c));
    // 2. Override or add real Firestore clinics
    (clinics || []).forEach(c => {
      if (c && c.id) {
        map.set(c.id, { 
          ...c, 
          verified: c.verified ?? true,
          rating: c.rating || 4.8,
          reviewCount: c.reviewCount || 120,
          consultationFee: c.consultationFee || 400
        });
      }
    });
    return Array.from(map.values());
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    return allAvailableClinics.filter(c => {
      // 1. Exclude explicitly inactive/rejected/suspended
      if (c.status && (c.status === 'inactive' || c.status === 'rejected' || c.status === 'suspended')) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = c.clinicName?.toLowerCase().includes(query);
        const cityMatch = c.city?.toLowerCase().includes(query);
        const distMatch = c.district?.toLowerCase().includes(query);
        const specMatch = c.specializations?.some((s: string) => s.toLowerCase().includes(query));
        const servMatch = c.services?.some((s: string) => s.toLowerCase().includes(query));
        if (!nameMatch && !cityMatch && !distMatch && !specMatch && !servMatch) return false;
      }

      // 3. Active Category filter
      if (activeCategory !== 'all') {
        const cat = activeCategory.toLowerCase();
        const isLab = cat.includes('lab') || cat.includes('pathology') || cat.includes('radiology') || cat.includes('diagnost');
        if (isLab) {
          const hasLabServ = c.services && c.services.some((s: string) => s.toLowerCase().includes('lab') || s.toLowerCase().includes('checkup') || s.toLowerCase().includes('test') || s.toLowerCase().includes('scan') || s.toLowerCase().includes('x-ray') || s.toLowerCase().includes('blood'));
          const hasLabSpec = c.specializations && c.specializations.some((s: string) => s.toLowerCase().includes('pathology') || s.toLowerCase().includes('radiology') || s.toLowerCase().includes('diagnost'));
          if (!hasLabServ && !hasLabSpec) return false;
        } else {
          const keyTerm = cat
            .replace('cardiologist', 'cardiology')
            .replace('gynecologist', 'gynecology')
            .replace('pediatrician', 'pediatrics')
            .replace('neurologist', 'neurology');
          const hasSpec = c.specializations && c.specializations.some((s: string) => s.toLowerCase().includes(keyTerm) || keyTerm.includes(s.toLowerCase()));
          const hasServ = c.services && c.services.some((s: string) => s.toLowerCase().includes(keyTerm) || keyTerm.includes(s.toLowerCase()));
          if (!hasSpec && !hasServ) return false;
        }
      }

      // 4. District matching
      if (selectedDistrictFilter !== 'all') {
        const targetDist = selectedDistrictFilter.toLowerCase().trim();
        const distMatch = c.district && c.district.toLowerCase().trim() === targetDist;
        const cityMatch = c.city && c.city.toLowerCase().trim() === targetDist;
        if (!distMatch && !cityMatch) return false;
      }

      return true;
    });
  }, [allAvailableClinics, searchQuery, activeCategory, selectedDistrictFilter]);


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

  if (selectedClinic) {
    return <ClinicProfileView />;
  }

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

  return (
    <div className="flex flex-col w-full h-full bg-transparent min-h-screen">
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 relative">
        {patientTab === 'home' && (
          <div className="animate-in fade-in">
            {/* Header */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-white/70 backdrop-blur-xl border-b border-white/50 mb-6 flex items-center justify-between shadow-[0_4px_24px_-4px_rgba(15,23,42,0.02)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                  <img src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} className="w-full h-full object-cover" alt="User" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-teal-600 font-extrabold tracking-widest mb-0.5">{getGreeting()}</p>
                  <h1 className="text-sm font-black text-slate-900 tracking-tight">{firstName} 👋</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLocationPickerOpen(true)}
                  className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100/80 text-teal-700 px-3 py-1.5 rounded-full text-xs font-bold border border-teal-100 transition-colors cursor-pointer shadow-2xs"
                  title="Click to change location"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{activeLocationName}</span>
                </button>
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 relative shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {upcoming1HourAlert && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-ping"></span>
                  )}
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
              </div>
            </div>

            {/* Gentle 1-Hour In-App Appointment Banner Notification */}
            <AnimatePresence>
              {upcoming1HourAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 text-white shadow-xl shadow-amber-500/20 border border-amber-400/40 relative overflow-hidden"
                >
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white shadow-inner border border-white/30 mt-0.5">
                        <Bell className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-white/30 tracking-wider">
                            1-Hour Reminder
                          </span>
                          <span className="text-[11px] font-bold text-amber-100 flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5 text-amber-200" />
                            In {upcoming1HourAlert.minutesLeft > 0 ? `${upcoming1HourAlert.minutesLeft} mins` : 'a few moments'}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white leading-snug">
                          Upcoming Appointment Alert
                        </h4>
                        <p className="text-xs text-amber-50/90 mt-1 leading-relaxed">
                          Your appointment with <strong className="text-white font-extrabold">{upcoming1HourAlert.appointment.doctorName || 'your doctor'}</strong> is starting soon at <span className="underline decoration-amber-200/60 font-semibold">{upcoming1HourAlert.appointment.timeSlot}</span>.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => setPatientTab('appointments')}
                            className="bg-white text-amber-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-50 transition-all flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            View Ticket
                          </button>
                          <button
                            onClick={() => {
                              const aptKey = upcoming1HourAlert.appointment.id || `${upcoming1HourAlert.appointment.doctorName}-${upcoming1HourAlert.appointment.timeSlot}-${upcoming1HourAlert.appointment.date || 'today'}`;
                              setDismissedAlerts(prev => [...prev, aptKey]);
                              setUpcoming1HourAlert(null);
                            }}
                            className="text-xs font-semibold text-amber-100 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const aptKey = upcoming1HourAlert.appointment.id || `${upcoming1HourAlert.appointment.doctorName}-${upcoming1HourAlert.appointment.timeSlot}-${upcoming1HourAlert.appointment.date || 'today'}`;
                        setDismissedAlerts(prev => [...prev, aptKey]);
                        setUpcoming1HourAlert(null);
                      }}
                      className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                      title="Dismiss notification"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLocationServiceable ? (
              <UnserviceableLocationView 
                currentDistrict={activeLocationName}
                liveDistricts={liveDistricts}
                onChangeLocationClick={() => setIsLocationPickerOpen(true)}
                onRegisterClick={() => openAuthModal('clinic')}
              />
            ) : (
              <>
                {/* Top OPD Active Token & Live Queue Popup Card */}
                {(() => {
                  if (!displayAppointment) return null;
                  const aptClinic = clinics.find(c => c.id === displayAppointment.clinicId);
                  const waitingCount = aptClinic?.waitingPatients || 0;
                  const projectedWaitMins = waitingCount * 10;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8 bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 rounded-[28px] p-5 text-white shadow-xl relative overflow-hidden border border-teal-700/60"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span className="text-[10px] text-teal-300 uppercase font-extrabold tracking-widest">Active OPD Token Status</span>
                        </div>
                        <span className="text-xs bg-emerald-400 text-slate-950 font-black px-3 py-1 rounded-full shadow-sm">
                          Token #{displayAppointment.tokenNumber || '—'}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">
                            {displayAppointment.doctorName || 'OPD Doctor Consultation'}
                          </h4>
                          <p className="text-xs text-teal-100 mt-0.5">
                            {aptClinic?.clinicName || displayAppointment.clinicName || 'Clinic'} • Slot: {displayAppointment.timeSlot || '10:00 AM'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 w-full sm:w-auto justify-around">
                          <div className="text-center px-2">
                            <p className="text-xl font-black text-amber-300">{waitingCount}</p>
                            <p className="text-[9px] text-teal-200 uppercase font-bold">Ahead in Line</p>
                          </div>
                          <div className="h-6 w-px bg-white/20"></div>
                          <div className="text-center px-2">
                            <p className="text-xl font-black text-emerald-300">~{projectedWaitMins} Mins</p>
                            <p className="text-[9px] text-teal-200 uppercase font-bold">Projected Wait</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-teal-200/90 font-medium">
                          Live status updates will notify you automatically when queue advances.
                        </p>
                        <button 
                          onClick={() => setActiveProfileModal({ title: "QR Code Patient Pass", subtitle: `Pass for ${displayAppointment.doctorName || 'Doctor'}` })}
                          className="bg-white/15 hover:bg-white/25 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/20 shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5 text-teal-200" />
                          <span>Digital Ticket</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

            {/* Hero Banners */}
            <div className="mb-8">
              {banners.filter(b => b.active).length > 0 ? (
                <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
                  {banners.filter(b => b.active).map(banner => (
                    <div key={banner.id} className="min-w-[85vw] md:min-w-[400px] h-[180px] snap-center shrink-0 rounded-[32px] overflow-hidden relative shadow-md bg-slate-900">
                      <img 
                        src={banner.imageUrl} 
                        alt={banner.title} 
                        className="w-full h-full object-cover opacity-90" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80';
                        }}
                      />
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
                <div className="bg-gradient-to-br from-[#2D8C7C] to-teal-900 rounded-[32px] p-6 relative overflow-hidden flex items-center shadow-[0_10px_40px_-10px_rgba(45,140,124,0.4)] border border-teal-600/30">
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="z-10 w-[60%] pr-2 relative">
                    <h2 className="text-white text-2xl font-extrabold mb-2 leading-tight tracking-tight">Looking for<br/>desired doctor?</h2>
                    <p className="text-teal-100/90 text-xs mb-5 font-medium leading-relaxed">Find certified doctors in {userProfile?.district || 'Srinagar'} and book 10-minute slots.</p>
                    <button onClick={() => setPatientTab('discover')} className="bg-white text-teal-900 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all w-fit">
                      <Search className="w-4 h-4 text-teal-600" /> Search Now
                    </button>
                  </div>
                  <div className="absolute right-0 bottom-0 w-[50%] h-[110%] flex items-end justify-end translate-y-4 translate-x-2">
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80" className="object-cover h-full rounded-tl-[60px] rounded-bl-[60px] border-[6px] border-[#2D8C7C] shadow-[-10px_0_30px_rgba(0,0,0,0.2)]" alt="Doctor" />
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-bold text-slate-900 text-lg">Find your doctor</h3>
                <button onClick={() => { setActiveCategory('all'); setPatientTab('discover'); }} className="text-teal-600 text-sm font-bold flex items-center gap-1 hover:underline">See All <ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {categories.map(cat => (
                  <div key={cat.id} onClick={() => { setActiveCategory(cat.id); setPatientTab('discover'); }} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cat.bg} ${cat.color} shadow-sm border border-white group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 text-center leading-tight">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Tip of the Day (Gemini AI Powered) */}
            <div className="mb-8 bg-gradient-to-br from-teal-50 via-emerald-50/50 to-teal-100/60 rounded-[24px] p-5 border border-teal-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#2D8C7C] text-white flex items-center justify-center shadow-md shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold tracking-wider text-teal-800 uppercase bg-teal-200/70 px-2.5 py-0.5 rounded-full">
                        {healthTip?.category || 'AI Health Tip'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">J&K Daily Advisory</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-0.5">
                      {healthTipLoading ? 'Generating daily health wisdom...' : (healthTip?.title || 'Kashmiri Wellness & Preventive Care')}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={fetchHealthTip}
                  disabled={healthTipLoading}
                  className="w-8 h-8 rounded-full bg-white hover:bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs border border-teal-200 transition-all shrink-0"
                  title="Refresh Health Tip"
                >
                  <RefreshCw className={`w-4 h-4 ${healthTipLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {healthTipLoading ? (
                <div className="space-y-2 py-2 animate-pulse">
                  <div className="h-3.5 bg-teal-200/60 rounded w-full"></div>
                  <div className="h-3.5 bg-teal-200/60 rounded w-4/5"></div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 backdrop-blur-xs p-3.5 rounded-xl border border-teal-100/80 shadow-2xs">
                  "{healthTip?.tip || 'Stay active, maintain a balanced diet with local seasonal produce, and consult verified specialists on MediBrid for any persistent medical concerns.'}"
                </p>
              )}
            </div>

            {/* Appointment Track Section */}
            <div className="mb-8 bg-white rounded-[24px] p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">My Appointments</h3>
                    <button onClick={() => setPatientTab('appointments')} className="text-teal-600 text-sm font-bold flex items-center gap-1 hover:underline">See All</button>
                </div>
                <div className="flex flex-col gap-3">
                    {(appointments || []).filter(a => a && (a.patientId === firebaseUser?.uid || a.patientId === userProfile?.uid)).slice(0, 3).map((apt, index) => (
                        <motion.div 
                          key={apt?.id || index} 
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ scale: 1.01, backgroundColor: '#f8fafc' }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 transition-all cursor-pointer"
                        >
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${apt?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                <Calendar className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold text-slate-900 truncate">{apt?.doctorName || 'Doctor Visit'}</p>
                                 <p className="text-[10px] text-slate-500 truncate">{apt?.formattedDate || 'Scheduled'} • {apt?.timeSlot || '10:00 AM'}</p>
                             </div>
                             <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase shrink-0 ${apt?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {apt?.status || 'CONFIRMED'}
                             </span>
                        </motion.div>
                    ))}
                    {(appointments || []).filter(a => a && (a.patientId === firebaseUser?.uid || a.patientId === userProfile?.uid)).length === 0 && (
                        <p className="text-slate-500 text-xs text-center py-4">No appointments found.</p>
                    )}
                </div>
            </div>

            {/* Top Verified Doctors */}
            <div className="mb-4">
              <div className="flex justify-between items-end mb-5 px-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Top Verified Doctors</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Nearest specialists in {userProfile?.district || 'Jammu & Kashmir'}</p>
                </div>
                <button onClick={() => setPatientTab('discover')} className="text-teal-600 bg-teal-50/50 border border-teal-100 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-teal-50 transition-colors">
                  <Maximize2 className="w-3 h-3" /> Full Screen View
                </button>
              </div>
              
              <div className="flex flex-col gap-0">
                {filteredClinics.slice(0, 4).map((clinic, index) => (
                   <ClinicCard key={clinic.id} clinic={clinic} index={index} onSelect={setSelectedClinic} />
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
          </>
        )}

        {/* Scrolling Photos Banner Marquee */}
        <div className="mt-8 mb-4 relative overflow-hidden rounded-3xl shadow-sm bg-slate-900 border border-slate-800 py-3">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-4 px-2">
            {[
              '/1782232191368_transfer_2026-08-13_234035.jpg',
              '/1782229544546_transfer_2026-08-13_234035.png',
              '/file_0000000022c071f8ac319fa1661205bb_transfer_2026-08-13_234035.png',
              '/file_000000000840720883a793af7df2f858_transfer_2026-08-13_234035.png',
              '/1782232191368_transfer_2026-08-13_234035.jpg',
              '/1782229544546_transfer_2026-08-13_234035.png',
              '/file_0000000022c071f8ac319fa1661205bb_transfer_2026-08-13_234035.png',
              '/file_000000000840720883a793af7df2f858_transfer_2026-08-13_234035.png'
            ].map((img, idx) => (
              <div key={idx} className="shrink-0 w-[85vw] md:w-[400px] h-[180px] rounded-[24px] overflow-hidden relative shadow-md bg-slate-800 border border-slate-700">
                <img src={img} alt={`Promo Banner ${idx}`} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

        {patientTab === 'discover' && (
          <div className="animate-in fade-in pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Clinics & Doctors</h1>
                <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-teal-100">{filteredClinics.length} Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold bg-white shadow-sm px-3 py-1.5 rounded-full border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">All J&K Districts</option>
                  {(districts && districts.length > 0 ? districts : [
                    { id: 'srinagar', name: 'Srinagar' },
                    { id: 'baramulla', name: 'Baramulla' },
                    { id: 'anantnag', name: 'Anantnag' },
                    { id: 'budgam', name: 'Budgam' },
                    { id: 'pulwama', name: 'Pulwama' },
                    { id: 'jammu', name: 'Jammu' },
                  ]).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 px-1">
              Showing verified healthcare providers in <strong className="text-slate-800">{selectedDistrictFilter === 'all' ? 'All Jammu & Kashmir' : selectedDistrictFilter}</strong>
            </p>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clinics, doctors, specializations (e.g. Cardiology, Budgam)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 shadow-sm rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-4 px-4 pb-1">
              {[
                { id: 'all', label: 'All Providers' },
                { id: 'clinic', label: 'Clinics' },
                { id: 'pathology', label: 'Labs & Diagnostics' },
                { id: 'general', label: 'General OPD' },
                { id: 'cardiology', label: 'Cardiology' },
              ].map(catItem => (
                <button 
                  key={catItem.id} 
                  onClick={() => setActiveCategory(catItem.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all ${activeCategory === catItem.id ? 'bg-[#2D8C7C] text-white border-transparent' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {catItem.label}
                </button>
              ))}
            </div>
            
            {/* Specialty Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 -mx-4 px-4 pb-2">
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); setSelectedDistrictFilter('all'); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 shadow-sm hover:bg-teal-100 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-teal-600" /> Reset Filters
              </button>
              {[
                { id: 'all', label: 'All Specialties' },
                { id: 'cardiologist', label: 'Cardiologist' },
                { id: 'gynecologist', label: 'Gynecologist' },
                { id: 'pediatrician', label: 'Pediatrician' },
                { id: 'neurologist', label: 'Neurologist' },
                { id: 'dental', label: 'Dental Care' },
                { id: 'eye', label: 'Eye Care' },
              ].map(specItem => (
                <button 
                  key={specItem.id} 
                  onClick={() => setActiveCategory(specItem.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all ${activeCategory === specItem.id ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {specItem.label}
                </button>
              ))}
            </div>

            {/* Clinics List */}
            <div className="flex flex-col gap-0 mt-2">
              {filteredClinics.length > 0 ? (
                filteredClinics.map((clinic, index) => (
                  <ClinicCard key={clinic.id} clinic={clinic} index={index} onSelect={setSelectedClinic} />
                ))
              ) : (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">No clinics found for this selection</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                    Try clearing search queries or switching to "All J&K Districts" to see all available medical care centers.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      setSelectedDistrictFilter('all');
                    }}
                    className="mt-4 bg-teal-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-teal-700 transition-all inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Show All J&K Clinics ({allAvailableClinics.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {patientTab === 'messages' && (
          <MessagesTab />
        )}

        {patientTab === 'appointments' && (
          <div className="animate-in fade-in pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Bookings & OPD Tokens</h1>
                <p className="text-xs text-slate-500 mt-0.5">Track active OPD tickets, assigned token numbers, and live waiting status.</p>
              </div>
              <button 
                onClick={() => setPatientTab('discover')}
                className="bg-teal-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-teal-700 transition-colors shrink-0"
              >
                + New Booking
              </button>
            </div>

            {/* Sub-Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
              {[
                { id: 'all', label: 'All Bookings' },
                { id: 'active', label: 'Active & Confirmed' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBookingStatusFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all ${
                    bookingStatusFilter === tab.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bookings List */}
            {(() => {
              const allUserApts = (appointments || []).filter(a => 
                a && (a.patientId === firebaseUser?.uid || a.patientId === userProfile?.uid)
              );

              const filteredApts = allUserApts.filter(a => {
                if (bookingStatusFilter === 'active') return a.status === 'confirmed' || a.status === 'upcoming';
                if (bookingStatusFilter === 'completed') return a.status === 'completed';
                if (bookingStatusFilter === 'cancelled') return a.status === 'cancelled';
                return true;
              });

              if (!firebaseUser) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100 shadow-sm">
                      <User className="w-10 h-10 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h2>
                    <p className="text-slate-500 text-xs mb-6 max-w-[280px]">
                      Please sign in to view and manage your booked appointments.
                    </p>
                    <button onClick={() => openAuthModal('user')} className="bg-[#2D8C7C] text-white px-6 py-3 rounded-full text-xs font-bold shadow-md hover:bg-teal-700 transition-colors">
                      Sign In / Register
                    </button>
                  </div>
                );
              }

              if (filteredApts.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100 shadow-sm">
                      <Calendar className="w-10 h-10 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Bookings Found</h2>
                    <p className="text-slate-500 text-xs mb-6 max-w-[280px]">
                      {bookingStatusFilter === 'all' 
                        ? "You haven't booked any OPD appointments yet." 
                        : `No ${bookingStatusFilter} appointments found in your record.`}
                    </p>
                    <button onClick={() => setPatientTab('discover')} className="bg-[#2D8C7C] text-white px-6 py-3 rounded-full text-xs font-bold shadow-md hover:bg-teal-700 transition-colors">
                      Book an Appointment Now
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredApts.map((apt, idx) => {
                    const aptClinic = clinics.find(c => c.id === apt.clinicId);
                    const waitingNow = aptClinic?.waitingPatients || 0;
                    const estWaitMins = waitingNow * 10;

                    return (
                      <motion.div
                        key={apt.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                      >
                        {/* Status & Token Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-sm flex items-center gap-1">
                              <span>OPD Token #{apt.tokenNumber || '—'}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              apt.status === 'confirmed' || apt.status === 'upcoming' 
                                ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                : apt.status === 'completed' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {apt.status || 'CONFIRMED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">{apt.formattedDate || apt.date || 'Today'}</p>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{apt.doctorName || 'Doctor Consultation'}</h3>
                            <p className="text-xs font-semibold text-teal-700 mt-0.5">{aptClinic?.clinicName || apt.clinicName || 'Clinic'}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> Slot: <strong className="text-slate-800">{apt.timeSlot || 'OPD Slot'}</strong>
                            </p>
                            {apt.notes && (
                              <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 mt-2">
                                Notes: {apt.notes}
                              </p>
                            )}
                          </div>

                          {/* Live Queue Box for Active Bookings */}
                          {(apt.status === 'confirmed' || apt.status === 'upcoming') && (
                            <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-amber-950 w-full sm:w-auto shrink-0 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                <Users className="w-4 h-4 text-amber-600 animate-pulse" />
                                <span>Live OPD Waiting Queue</span>
                              </div>
                              <p className="text-xs font-semibold">
                                <strong className="text-amber-900 text-sm">{waitingNow}</strong> Patients Currently Waiting
                              </p>
                              <p className="text-[10px] text-amber-700">Est. Wait Time: ~{estWaitMins} mins</p>
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => setActiveProfileModal({ title: "QR Code Patient Pass", subtitle: `Pass for ${apt.doctorName || 'Doctor'}` })}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <QrCode className="w-4 h-4 text-teal-300" />
                            <span>Digital Ticket Pass</span>
                          </button>

                          {(apt.status === 'confirmed' || apt.status === 'upcoming') && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                  updateAppointmentStatus(apt.id, 'cancelled');
                                }
                              }}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Cancel Booking
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
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
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Shipping & Medicine Delivery Policy", policyId: "shipping_delivery"})} icon={<Truck />} title="Shipping & Medicine Delivery Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Refund Policy", policyId: "refund_policy"})} icon={<Receipt />} title="Refund Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Return Policy", policyId: "return_policy"})} icon={<RefreshCw />} title="Return Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Cancellation Policy", policyId: "cancellation_policy"})} icon={<XCircle />} title="Cancellation Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Privacy Policy", policyId: "privacy_policy"})} icon={<Shield />} title="Privacy Policy" />
                  <ProfileMenuItem onClick={() => setActiveProfileModal({title: "Terms and Conditions", policyId: "terms_conditions"})} icon={<FileCheck />} title="Terms and Conditions" isLast />
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                  Help & Support
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <ProfileMenuItem onClick={() => setIsFeedbackModalOpen(true)} icon={<MessageSquare />} title="Submit Feedback" subtitle="Report issues or suggest features" isLast />
                </div>
            </div>

            {firebaseUser ? (
              <button 
                  onClick={logoutUser}
                  className="w-full bg-rose-50 text-rose-600 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm font-bold border border-rose-100 hover:bg-rose-100 transition-colors mt-8 mb-6"
              >
                  <LogOut className="w-5 h-5" />
                  Sign Out / Disconnect
              </button>
            ) : (
              <button 
                  onClick={() => openAuthModal('user')}
                  className="w-full bg-teal-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm font-bold border border-teal-700 hover:bg-teal-700 transition-colors mt-8 mb-6"
              >
                  <User className="w-5 h-5" />
                  Sign In / Create Account
              </button>
            )}
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
              ) : (() => {
                const activePolicy = legalPolicies.find(p => 
                  p.id === activeProfileModal.policyId || 
                  p.title.toLowerCase().trim() === activeProfileModal.title.toLowerCase().trim()
                );
                if (activePolicy) {
                  return (
                    <div className="space-y-4 text-slate-700 text-xs leading-relaxed">
                      <div className="bg-teal-50 border border-teal-200/80 p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
                        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
                        <div>
                          <h4 className="font-bold text-teal-900 text-xs">Verified MediBridge J&K Policy</h4>
                          <p className="text-[10px] text-teal-700 font-medium">
                            Last updated: {new Date(activePolicy.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-2 whitespace-pre-wrap font-sans text-xs text-slate-800 font-medium leading-relaxed">
                        {activePolicy.content}
                      </div>

                      <div className="p-3 bg-slate-100/80 rounded-xl text-[11px] text-slate-500 text-center font-medium">
                        Need assistance? Contact our team at <a href="mailto:support@medibrid.in" className="text-teal-700 font-bold underline">support@medibrid.in</a>
                      </div>
                    </div>
                  );
                }
                return (
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
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {isFeedbackModalOpen && (
        <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />
      )}

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full sm:w-[400px] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="font-bold text-slate-800">Notifications</h2>
                <p className="text-xs text-slate-500">Your recent alerts</p>
              </div>
              <button onClick={() => setIsNotificationsOpen(false)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center min-h-[250px] text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-teal-600 border border-teal-100 shadow-sm">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">You're all caught up!</h3>
              <p className="text-sm text-slate-500">No new notifications at the moment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {isLocationPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Select Location / District</h3>
                  <p className="text-[11px] text-slate-500">Pick area to check doctor & clinic availability</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLocationPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-2xl py-3 px-4 mb-6 flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
              {isLocating ? 'Detecting your location...' : 'Use my Current Location'}
            </button>
            {/* Custom Location Search */}
            <div className="mb-5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                Search or Enter District / Pincode
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  type="text" 
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  placeholder="Type district or area (e.g., Pulwama 192303)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                />
              </div>
              {customLocationInput.trim() && (
                <button
                  onClick={() => {
                    setSelectedDistrictFilter(customLocationInput.trim());
                    setIsLocationPickerOpen(false);
                    setCustomLocationInput('');
                  }}
                  className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-xs font-bold transition-colors shadow-sm"
                >
                  Set Location to "{customLocationInput.trim()}"
                </button>
              )}
            </div>

            {/* Live Operational Districts */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live Supported Areas ({liveDistricts.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {liveDistricts.map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDistrictFilter(d);
                      setIsLocationPickerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      activeLocationName.toLowerCase().includes(d.toLowerCase())
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-extrabold shadow-2xs'
                        : 'bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 font-bold'
                    }`}
                  >
                    <span className="truncate text-xs">{d}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black shrink-0">Live</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Districts (Expanding Soon) */}
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Other J&K Districts (Expanding Soon)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['Pulwama', 'Anantnag', 'Baramulla', 'Ganderbal', 'Kulgam', 'Kupwara', 'Jammu', 'Rajouri', 'Udhampur'].filter(d => !liveDistricts.some(ld => ld.toLowerCase() === d.toLowerCase())).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDistrictFilter(d);
                      setIsLocationPickerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      activeLocationName.toLowerCase().includes(d.toLowerCase())
                        ? 'bg-rose-50 border-rose-200 text-rose-950 font-extrabold'
                        : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100/80 font-semibold'
                    }`}
                  >
                    <div className="truncate text-xs">{d}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">Expanding soon</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar - Fixed in one place */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] pointer-events-none pb-2 sm:pb-4 px-3 sm:px-6">
        <div className="pointer-events-auto max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2 flex justify-between items-center">
          <button 
            onClick={() => setPatientTab('home')} 
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 sm:px-3 rounded-xl ${patientTab === 'home' ? 'text-teal-700 font-bold bg-teal-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold tracking-tight">Home</span>
          </button>

          <button 
            onClick={() => setPatientTab('discover')} 
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 sm:px-3 rounded-xl ${patientTab === 'discover' ? 'text-teal-700 font-bold bg-teal-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold tracking-tight">Clinics</span>
          </button>

          <button 
            onClick={() => setPatientTab('appointments')} 
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 sm:px-3 rounded-xl relative ${patientTab === 'appointments' ? 'text-teal-700 font-bold bg-teal-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            {(appointments || []).length > 0 && (
              <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow-xs">
                {(appointments || []).length}
              </span>
            )}
            <span className="text-[10px] font-bold tracking-tight">Bookings</span>
          </button>

          <button 
            onClick={() => setPatientTab('messages')} 
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 sm:px-3 rounded-xl relative ${patientTab === 'messages' ? 'text-teal-700 font-bold bg-teal-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold tracking-tight">Messages</span>
          </button>

          <button 
            onClick={() => setPatientTab('profile')} 
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2.5 sm:px-3 rounded-xl ${patientTab === 'profile' ? 'text-teal-700 font-bold bg-teal-50 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold tracking-tight">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
