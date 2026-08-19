import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc, getDocs, disableNetwork } from 'firebase/firestore';
import { auth, db, googleProvider, initMessaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { pushService } from '../services/pushNotificationService';

// Add this constant near the top, maybe before the provider
const getApiKey = () => {
  return (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
};

let hasFetchedLocation = false;

const requestPermissionsAndSave = async (uid: string, setUserProfileCallback?: (update: any) => void, force = false) => {
  let updates: Partial<UserProfile> = {};
  
  // 1. Request Geolocation strictly only once per app open session
  const locationFetchedStorage = sessionStorage.getItem('medibrid_location_fetched');
  if ((force || (!hasFetchedLocation && !locationFetchedStorage)) && 'geolocation' in navigator) {
    hasFetchedLocation = true;
    sessionStorage.setItem('medibrid_location_fetched', 'true');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      updates.latitude = pos.coords.latitude;
      updates.longitude = pos.coords.longitude;

      // Reverse geocoding to find District/City
      const apiKey = getApiKey();
      if (apiKey && apiKey !== 'YOUR_API_KEY') {
        try {
          const geocodeRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${updates.latitude},${updates.longitude}&key=${apiKey}`);
          const geocodeData = await geocodeRes.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            // Find district and city from address_components
            const addressComponents = geocodeData.results[0].address_components;
            let city = '';
            let district = '';

            for (const comp of addressComponents) {
              if (comp.types.includes('locality')) {
                city = comp.long_name;
              }
              if (comp.types.includes('administrative_area_level_3') || comp.types.includes('administrative_area_level_2')) {
                if (!district) district = comp.long_name;
              }
            }
            if (city) updates.city = city;
            if (district) updates.district = district;
          }
        } catch (err) {
          console.warn("Google Maps Reverse geocoding failed:", err);
        }
      } else {
        // Fallback to free OSM Nominatim if no API key
        try {
          const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${updates.latitude}&lon=${updates.longitude}`);
          const osmData = await osmRes.json();
          if (osmData && osmData.address) {
            updates.city = osmData.address.city || osmData.address.town || osmData.address.village;
            updates.district = osmData.address.county || osmData.address.state_district;
          }
        } catch (err) {
          console.warn("OSM Reverse geocoding failed:", err);
        }
      }
    } catch (err) {
      console.warn("Geolocation permission denied or failed:", err);
    }
  }

// 2. Request Notification / FCM
  // CRITICAL: Only call Notification.requestPermission() if user explicitly asked (force === true)
  // If already granted, silently fetch the token without prompting the user.
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      let currentPermission = Notification.permission;
      if (currentPermission === 'default' && force) {
        currentPermission = await Notification.requestPermission();
      }

      if (currentPermission === 'granted') {
        const messaging = await initMessaging();
        if (messaging) {
          try {
            let swReg: ServiceWorkerRegistration | undefined = undefined;
            if ('serviceWorker' in navigator) {
              try {
                swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js') || await navigator.serviceWorker.ready;
              } catch (_) {}
            }
            const currentToken = await getToken(messaging, {
              vapidKey: 'BPdT2znpaDw-4gmTbKMLHsHzSyVPNBMrItGz9YhwpSadGkW3TW4qRh_LpDp9AL_3TS5qP--6qUlm95UnbvFr4Eg',
              serviceWorkerRegistration: swReg
            });
            if (currentToken) {
              updates.fcmToken = currentToken;
            }
          } catch (e) {
            console.warn("Could not get FCM token:", e);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Notification permission check notice:", err);
  }

  // Save if any updates
  if (Object.keys(updates).length > 0) {
    try {
      if (uid) {
        await setDoc(doc(db, 'users', uid), updates, { merge: true });
      }
      if (setUserProfileCallback) {
        setUserProfileCallback((prev: any) => prev ? { ...prev, ...updates } : null);
      }
    } catch (e) {
      console.warn("Failed to update user profile with permissions:", e);
    }
  }
  return updates;
};
import {
  UserRole,
  UserProfile,
  Clinic,
  Doctor,
  Laboratory,
  Appointment,
  Review,
  Banner,
  Category,
  Chat,
  District,
  LegalPolicy
} from '../types';

interface AppContextType {
  role: UserRole | null;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  userLocationDistrict: string | null;
  googleAccessToken: string | null;
  
  // Realtime Data
  users: UserProfile[];
  clinics: Clinic[];
  doctors: Doctor[];
  laboratories: Laboratory[];
  appointments: Appointment[];
  reviews: Review[];
  banners: Banner[];
  categories: Category[];
  districts: District[];
  legalPolicies: LegalPolicy[];
  updateLegalPolicy: (id: string, updates: Partial<LegalPolicy>) => Promise<void>;
  addDistrict: (data: Partial<District>) => Promise<void>;
  deleteDistrict: (id: string) => Promise<void>;
  toggleDistrictStatus: (id: string, active: boolean) => Promise<void>;
  addBanner: (data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string, active: boolean) => Promise<void>;
  chats: Chat[];

  // App UI State
  patientTab: 'home' | 'discover' | 'appointments' | 'profile' | 'messages';
  setPatientTab: (tab: 'home' | 'discover' | 'appointments' | 'profile' | 'messages') => void;
  adminTab: 'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners' | 'categories' | 'legal_policies';
  setAdminTab: (tab: 'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners' | 'categories' | 'legal_policies') => void;
  doctorTab: 'dashboard' | 'doctors' | 'laboratories' | 'appointments' | 'profile' | 'messages';
  setDoctorTab: (tab: 'dashboard' | 'doctors' | 'laboratories' | 'appointments' | 'profile' | 'messages') => void;

  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  // Selected Data
  selectedClinic: Clinic | null;
  setSelectedClinic: (clinic: Clinic | null) => void;
  
  // Auth Modals
  isAuthModalOpen: boolean;
  authModalRole: UserRole;
  openAuthModal: (initialRole?: UserRole) => void;
  closeAuthModal: () => void;
  isWelcomeModalOpen: boolean;
  setIsWelcomeModalOpen: (open: boolean) => void;

  // Auth Methods
  loginWithFirebaseEmail: (email: string, pass: string) => Promise<void>;
  registerWithFirebaseEmail: (email: string, pass: string, name: string, phone: string, role: UserRole, district?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: (requestedRole?: UserRole) => Promise<void>;
  logoutUser: () => Promise<void>;

  // Clinic actions
  createClinic: (clinicData: Omit<Clinic, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClinic: (clinicId: string, updates: Partial<Clinic>) => Promise<void>;
  addDoctor: (doctorData: Omit<Doctor, 'id' | 'clinicId' | 'createdAt'>) => Promise<void>;
  deleteDoctor: (doctorId: string) => Promise<void>;
  addLaboratory: (labData: Omit<Laboratory, 'id' | 'clinicId' | 'createdAt'>) => Promise<void>;
  deleteLaboratory: (labId: string) => Promise<void>;
  createBooking: (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'createdAt'> & { patientName?: string; patientPhone?: string }) => Promise<Appointment>;
  updateClinicWaitingPatients: (clinicId: string, count: number) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled') => Promise<void>;
  
  // Admin Management
  updateUserStatus: (uid: string, status: 'active' | 'blocked') => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  deleteClinic: (clinicId: string) => Promise<void>;
  sendPushNotification: (title: string, body: string, targetRole?: UserRole | 'all') => Promise<void>;
  sendAppNotification: (title: string, body: string, targetUserId: string, targetToken?: string) => Promise<void>;
  requestPermissions: (force?: boolean) => Promise<void>;
  addCategory: (data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  activeNotificationToast: { id: string; title: string; body: string } | null;
  dismissNotificationToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_DISTRICTS: District[] = [
  { id: 'srinagar', name: 'Srinagar', active: true },
  { id: 'baramulla', name: 'Baramulla', active: true },
  { id: 'anantnag', name: 'Anantnag', active: true },
  { id: 'budgam', name: 'Budgam', active: true },
  { id: 'pulwama', name: 'Pulwama', active: true },
  { id: 'ganderbal', name: 'Ganderbal', active: true },
  { id: 'kupwara', name: 'Kupwara', active: true },
  { id: 'kulgam', name: 'Kulgam', active: true },
  { id: 'shopian', name: 'Shopian', active: true },
  { id: 'bandipora', name: 'Bandipora', active: true },
  { id: 'jammu', name: 'Jammu', active: true },
  { id: 'udhampur', name: 'Udhampur', active: true },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'General Physician', icon: 'Stethoscope', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Pediatrics (Child Care)', icon: 'Users', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Cardiology', icon: 'Activity', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Dermatology (Skin Care)', icon: 'Sparkles', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'Orthopedics (Bones & Joints)', icon: 'Activity', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-6', name: 'ENT Specialist', icon: 'User', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-7', name: 'Gynecology & Obstetrics', icon: 'Users', active: true, createdAt: new Date().toISOString() },
  { id: 'cat-8', name: 'Dental Care', icon: 'Sparkles', active: true, createdAt: new Date().toISOString() }
];

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'ban-1',
    title: 'Skip the OPD Line - Live Token Queue',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
    link: '#discover',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ban-2',
    title: 'Instant Clinic OPD Booking',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    link: '#discover',
    active: true,
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_LEGAL_POLICIES: LegalPolicy[] = [
  {
    id: 'shipping_delivery',
    title: 'Shipping & Medicine Delivery Policy',
    content: `MediBridge facilitates prescription medicine and lab report deliveries across Jammu & Kashmir in partnership with verified local pharmacies and diagnostic centers.

1. Delivery Coverage: Standard medicine delivery is available across all 20 districts of J&K including urban and rural townships.
2. Estimated Delivery Time:
   - Urban centers (Srinagar, Jammu, Baramulla, Anantnag): Express delivery within 2-4 hours.
   - Remote & Valley districts (Ganderbal, Kupwara, Poonch, Rajouri): Standard delivery within 12-24 hours.
3. Cold Chain & Temperature Control: Temperature-sensitive medicines (such as insulin, vaccines, and biologics) are delivered using cold-chain insulated packaging.
4. Prescription Verification: Orders containing Schedule H / H1 prescription medicines require a valid prescription uploaded by a registered medical doctor prior to dispatch.
5. Delivery Charges: Standard delivery is FREE on orders above ₹499. Nominal delivery fee of ₹30 applies to orders under ₹499.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'refund_policy',
    title: 'Refund Policy',
    content: `At MediBridge, customer satisfaction and healthcare trust are our top priorities.

1. OPD Appointment Cancellations:
   - Full 100% refund for appointment cancellations made at least 1 hour prior to the scheduled token time.
   - Instant refund credited back to your original payment method or MediBridge wallet.
2. Lab Tests & Diagnostic Bookings:
   - 100% refund if cancelled before home sample collection or prior to visiting the diagnostic center.
3. Damaged or Wrong Medicine Items:
   - If delivered items are damaged, expired, or incorrect, request a return within 48 hours for a full 100% refund or replacement.
4. Refund Processing Window: Refunds to original UPI/Bank accounts are processed within 2 to 5 business days.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'return_policy',
    title: 'Return Policy',
    content: `We accept returns for eligible pharmaceutical and diagnostic items under the following terms:

1. Return Window: Eligible medicine products can be returned within 7 days from the date of delivery.
2. Sealed & Unopened Condition: Returned medicines must be unused, sealed in original packaging, and accompanied by the original tax invoice.
3. Non-Returnable Items:
   - Opened or partially consumed medications.
   - Temperature-controlled items (Insulin, Injection Vials, Biologicals).
   - Personal hygiene, diagnostic strips, and surgical instruments.
4. Inspection & Pickup: Free reverse pickup is conducted by our verified delivery partners.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cancellation_policy',
    title: 'Cancellation Policy',
    content: `MediBridge offers a hassle-free cancellation policy across all services:

1. Clinic OPD Appointments:
   - OPD consultation tokens can be cancelled directly through the app under 'My Bookings'.
   - No penalty or cancellation fee if cancelled before token call-in.
2. Pharmacy & Medicine Orders:
   - Medicine orders can be cancelled anytime before the dispatch status changes to 'Out for Delivery'.
3. Diagnostic & Lab Sample Collections:
   - Lab appointments can be rescheduled or cancelled free of charge up to 30 minutes before the technician arrives.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'privacy_policy',
    title: 'Privacy Policy',
    content: `MediBridge is committed to protecting patient health data and personal privacy under strict healthcare compliance standards.

1. Patient Data Security: All personal health records (PHR), doctor consultations, prescriptions, and lab test results are encrypted using AES-256 bit encryption.
2. Information Collection: We collect location data (solely once on app open to locate nearby clinics), phone numbers, and booking records to ensure smooth OPD queue management.
3. No Third-Party Data Selling: We NEVER sell, lease, or share your medical data or contact details with third-party advertising companies.
4. Access Control: Healthcare providers (doctors and clinics) can only access your prescriptions and medical history with your explicit consent during active appointments.`,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'terms_conditions',
    title: 'Terms and Conditions',
    content: `By using the MediBridge platform, mobile website, or application, you agree to the following terms:

1. Platform Scope: MediBridge acts as an integrated digital healthcare facilitator connecting patients with verified clinics, doctors, laboratories, and pharmacies in Jammu & Kashmir.
2. Emergency Care Warning: MediBridge is NOT an emergency hospital replacement. In case of life-threatening emergencies, immediately contact state emergency helpline 108 or visit the nearest GMC / Civil Hospital.
3. User Account Responsibilities: Users are responsible for maintaining the confidentiality of their phone OTP credentials and providing accurate health history.
4. Registered Practitioners: All clinics and medical practitioners listed on MediBridge undergo identity verification and medical registration checks.`,
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_CLINICS: Clinic[] = [
  {
    id: 'clinic-1',
    ownerId: 'demo-owner-1',
    clinicName: 'MediBridge Care & OPD Clinic',
    clinicType: 'Multi-Specialty Clinic',
    description: 'Advanced healthcare facility with real-time OPD token status and expert specialists.',
    about: 'MediBridge Care provides comprehensive OPD services, lab testing, and specialist consultation with real-time queue tracking.',
    phone: '9876543210',
    email: 'info@medibridgecare.com',
    whatsapp: '9876543210',
    address: 'Karan Nagar, Near Government Medical College',
    locality: 'Karan Nagar',
    city: 'Srinagar',
    district: 'srinagar',
    state: 'Jammu & Kashmir',
    pinCode: '190010',
    waitingPatients: 3,
    emergencyAvailable: true,
    status: 'active',
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300',
    coverImageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000',
    services: ['OPD Consultation', 'Blood Test & Diagnostics', 'ECG & Cardiology', 'Pediatric Care', 'Vaccination'],
    specializations: ['General Medicine', 'Pediatrics', 'Cardiology'],
    workingHours: {
      Monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      Tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      Wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      Thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      Friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      Saturday: { isOpen: true, openTime: '09:00', closeTime: '14:00' },
      Sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'clinic-2',
    ownerId: 'demo-owner-2',
    clinicName: 'Al-Shifa OPD & Diagnostic Center',
    clinicType: 'OPD & Diagnostic Clinic',
    description: 'Expert physicians, pathology lab, and instant OPD appointment tokens.',
    about: 'Al-Shifa Center offers quality OPD healthcare with state-of-the-art diagnostics.',
    phone: '9797001122',
    email: 'contact@alshifa.com',
    whatsapp: '9797001122',
    address: 'Main Highway, Near Civil Hospital',
    locality: 'Main Market',
    city: 'Baramulla',
    district: 'baramulla',
    state: 'Jammu & Kashmir',
    pinCode: '193101',
    waitingPatients: 1,
    emergencyAvailable: true,
    status: 'active',
    verified: true,
    logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
    coverImageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000',
    services: ['General OPD', 'Diabetes Care', 'Pathology Lab', 'Thyroid Profile'],
    specializations: ['General Medicine', 'Pathology', 'Cardiology'],
    workingHours: {
      Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      Saturday: { isOpen: true, openTime: '09:00', closeTime: '16:00' },
      Sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    clinicId: 'clinic-1',
    name: 'Sameer Ahmad Khan',
    specialization: 'General Physician & Diabetologist',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 12,
    phone: '9876543210',
    email: 'dr.sameer@medibridge.com',
    consultationFee: 400,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    availableTime: '10:00 AM - 04:00 PM',
    about: 'Experienced General Physician specializing in diabetes and internal medicine.',
    languages: ['English', 'Kashmiri', 'Urdu', 'Hindi'],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'doc-2',
    clinicId: 'clinic-1',
    name: 'Farhana Rashid',
    specialization: 'Pediatrician (Child Specialist)',
    qualification: 'MBBS, DCH (Pediatrics)',
    experience: 9,
    phone: '9876543211',
    email: 'dr.farhana@medibridge.com',
    consultationFee: 400,
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-7884d8521e10?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    availableTime: '11:00 AM - 03:00 PM',
    about: 'Compassionate Child Specialist dedicated to pediatric wellness and immunization.',
    languages: ['English', 'Kashmiri', 'Urdu', 'Hindi'],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'doc-3',
    clinicId: 'clinic-2',
    name: 'Tariq Hussain',
    specialization: 'Cardiologist & Heart Specialist',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience: 15,
    phone: '9797001122',
    email: 'dr.tariq@alshifa.com',
    consultationFee: 500,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableTime: '10:00 AM - 02:00 PM',
    about: 'Senior Consultant Cardiologist providing advanced cardiovascular care and ECG.',
    languages: ['English', 'Kashmiri', 'Urdu', 'Hindi'],
    active: true,
    createdAt: new Date().toISOString()
  }
];

let isFirestoreQuotaExhausted = false;

// Safe snapshot listener helper to auto-unsubscribe and prevent further queries if quota is exhausted
export const attachSafeSnapshot = (
  queryOrRef: any,
  onNext: (snapshot: any) => void,
  label: string
) => {
  if (isFirestoreQuotaExhausted) {
    onNext({ exists: () => false, data: () => null });
    return () => {};
  }
  let unsub: (() => void) | null = null;
  let isUnsubscribed = false;

  try {
    unsub = onSnapshot(
      queryOrRef,
      (snapshot: any) => {
        if (!isUnsubscribed && !isFirestoreQuotaExhausted) {
          onNext(snapshot);
        }
      },
      (error: any) => {
        const isQuota = 
          error?.code === 'resource-exhausted' || 
          error?.message?.includes('Quota exceeded') || 
          error?.message?.includes('resource-exhausted');

        if (isQuota) {
          if (!isFirestoreQuotaExhausted) {
            isFirestoreQuotaExhausted = true;
            disableNetwork(db).catch(() => {});
          }
          isUnsubscribed = true;
          console.warn(`${label} sync paused: Firestore quota limit reached. Switched to offline mode.`);
          if (unsub) {
            try { unsub(); } catch (_) {}
            unsub = null;
          }
        } else {
          console.warn(`${label} sync notice:`, error?.message || error);
        }
      }
    );
  } catch (err: any) {
    console.warn(`Failed to attach listener for ${label}:`, err?.message);
  }

  return () => {
    isUnsubscribed = true;
    if (unsub) {
      try { unsub(); } catch (_) {}
    }
  };
};

export const safeGetDocs = async (queryOrRef: any) => {
  if (isFirestoreQuotaExhausted) {
    return { docs: [], empty: true };
  }
  try {
    return await getDocs(queryOrRef);
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      if (!isFirestoreQuotaExhausted) {
        isFirestoreQuotaExhausted = true;
        disableNetwork(db).catch(() => {});
      }
      console.warn("Firestore quota limit reached during getDocs.");
    }
    return { docs: [], empty: true };
  }
};

export const safeGetDoc = async (docRef: any) => {
  if (isFirestoreQuotaExhausted) {
    return { exists: () => false, data: () => null };
  }
  try {
    return await getDoc(docRef);
  } catch (err: any) {
    if (
      err?.code === 'resource-exhausted' ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('resource-exhausted')
    ) {
      if (!isFirestoreQuotaExhausted) {
        isFirestoreQuotaExhausted = true;
        disableNetwork(db).catch(() => {});
      }
      console.warn("Firestore quota limit reached during getDoc.");
    }
    return { exists: () => false, data: () => null };
  }
};

export const safeAddDoc = async (collRef: any, data: any) => {
  try {
    return await addDoc(collRef, data);
  } catch (err) {
    console.warn("safeAddDoc error:", err);
    throw err;
  }
};

export const safeSetDoc = async (docRef: any, data: any, options?: any) => {
  try {
    await setDoc(docRef, data, options);
  } catch (err) {
    console.warn("safeSetDoc error:", err);
    throw err;
  }
};

export const safeUpdateDoc = async (docRef: any, data: any) => {
  try {
    await updateDoc(docRef, data);
  } catch (err) {
    console.warn("safeUpdateDoc error:", err);
    throw err;
  }
};

export const safeDeleteDoc = async (docRef: any) => {
  try {
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("safeDeleteDoc error:", err);
    throw err;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLocationDistrict, setUserLocationDistrict] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>(DEFAULT_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [chats, setChats] = useState<Chat[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [districts, setDistricts] = useState<District[]>(DEFAULT_DISTRICTS);
  const [legalPolicies, setLegalPolicies] = useState<LegalPolicy[]>(DEFAULT_LEGAL_POLICIES);

  const [patientTab, setPatientTab] = useState<'home' | 'discover' | 'appointments' | 'profile' | 'messages'>('home');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners' | 'categories' | 'legal_policies'>('dashboard');
  const [doctorTab, setDoctorTab] = useState<'dashboard' | 'doctors' | 'laboratories' | 'appointments' | 'profile' | 'messages'>('dashboard');

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('user');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(true);

  const [activeNotificationToast, setActiveNotificationToast] = useState<{ id: string; title: string; body: string } | null>(null);

  const prevChatsRef = useRef<Record<string, string>>({});

    const showBackgroundNotification = async (title: string, body: string, url: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            data: { url }
          });
        } catch(e) {
          console.error("SW notification error", e);
        }
      } else {
        new Notification(title, { body, icon: '/icon-192.svg' } as any);
      }
    }
  };

  const triggerPushNotificationUI = (title: string, body: string) => {
    // Show Native Web Push Notification if permission granted and the user is not actively focused on this window
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' });
          }).catch((err) => {
            new Notification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' } as any);
          });
        } else {
          new Notification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' } as any);
        }
      } catch (e) {
        console.warn("Native Notification popup notice:", e);
      }
    }
    setActiveNotificationToast({ id: Date.now().toString(), title, body });
    setTimeout(() => {
      setActiveNotificationToast(null);
    }, 6000);
  };

  const dismissNotificationToast = () => setActiveNotificationToast(null);

  // Authentication & Profile Fetching
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const isAdminEmail = user.email?.toLowerCase() === 'malikmusaib928@gmail.com';
        if (isAdminEmail) {
          setRole('admin');
          setIsWelcomeModalOpen(false);
        }
        try {
          const docRef = doc(db, 'users', user.uid);
          unsubProfile = attachSafeSnapshot(docRef, (docSnap: any) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              if (isAdminEmail && profile.role !== 'admin') {
                profile.role = 'admin';
                setDoc(docRef, { role: 'admin' }, { merge: true }).catch(() => {});
              }
              setUserProfile(profile);
              setRole(profile.role);
              if (profile.role !== 'admin') setIsWelcomeModalOpen(false);
            } else {
              if (isAdminEmail) {
                const adminProfile: UserProfile = {
                  uid: user.uid,
                  email: user.email || 'malikmusaib928@gmail.com',
                  name: user.displayName || 'Admin Malik',
                  role: 'admin',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setDoc(docRef, adminProfile, { merge: true }).catch(() => {});
                setUserProfile(adminProfile);
                setRole('admin');
              } else {
                setRole((prev) => prev || 'user'); // default assumption, but don't overwrite optimistic role
              }
            }
          }, "User Profile");
          // Request permissions automatically on successful login
          requestPermissionsAndSave(user.uid, setUserProfile);
          // Fallback if role doesn't load
          setTimeout(() => {
             setRole(prev => {
                if (prev === null) return isAdminEmail ? 'admin' : 'user';
                return prev;
             });
          }, 3000);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setRole(isAdminEmail ? 'admin' : 'user');
        }
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = undefined;
        }
        setUserProfile(null);
        setRole(null);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Listen to Native Capacitor Push Tokens and Background Payloads
  useEffect(() => {
    pushService.onToken(async (token: string) => {
      if (firebaseUser?.uid && token) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), { fcmToken: token }, { merge: true });
          setUserProfile(prev => prev ? { ...prev, fcmToken: token } : null);
        } catch (e) {
          console.warn("Could not save native push token to profile:", e);
        }
      }
    });

    pushService.onNotificationReceived((payload) => {
      if (payload.title || payload.body) {
        triggerPushNotificationUI(payload.title, payload.body);
      }
    });

    // Check for any pending notifications that arrived while app was terminated
    pushService.syncPendingNotifications().then(notifications => {
      if (notifications && notifications.length > 0) {
        console.log(`[PushService] Restored ${notifications.length} background notifications`);
      }
    });
  }, [firebaseUser?.uid]);

  // Public Data Seeding & Realtime Sync (Firebase Only)
  useEffect(() => {
    let unsubClinics = () => {};
    let unsubDoctors = () => {};
    let unsubLabs = () => {};
    let unsubBanners = () => {};
    let unsubCategories = () => {};
    let unsubDistricts = () => {};
    let unsubLegalPolicies = () => {};

    (async () => {
      try {
        // Demo data seeding disabled
      } catch (e) {
        console.warn("Firebase seeding notice:", e);
      }

      unsubClinics = attachSafeSnapshot(collection(db, 'clinics'), (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Clinic));
        const res = list;
        setClinics(res);
      }, "Clinics");

      unsubDoctors = attachSafeSnapshot(collection(db, 'doctors'), (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Doctor));
        const res = list;
        setDoctors(res);
      }, "Doctors");

      unsubLabs = attachSafeSnapshot(collection(db, 'laboratories'), (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Laboratory));
        setLaboratories(list);
      }, "Laboratories");

      unsubBanners = attachSafeSnapshot(collection(db, 'banners'), (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Banner));
        const res = list;
        setBanners(res);
      }, "Banners");

      unsubCategories = attachSafeSnapshot(collection(db, 'categories'), (snap: any) => {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Category));
        const res = list;
        setCategories(res);
      }, "Categories");

      unsubDistricts = attachSafeSnapshot(collection(db, 'districts'), (snap: any) => {
        const remote = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as District));
        const distMap = new Map<string, District>();
        DEFAULT_DISTRICTS.forEach(d => distMap.set(d.id, d));
        remote.forEach(d => distMap.set(d.id, d));
        const res = Array.from(distMap.values());
        setDistricts(res);
      }, "Districts");

      unsubLegalPolicies = attachSafeSnapshot(collection(db, 'legal_policies'), (snap: any) => {
        const remote = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LegalPolicy));
        const polMap = new Map<string, LegalPolicy>();
        DEFAULT_LEGAL_POLICIES.forEach(p => polMap.set(p.id, p));
        remote.forEach(p => polMap.set(p.id, p));
        const res = Array.from(polMap.values());
        setLegalPolicies(res);
      }, "LegalPolicies");
    })();

    return () => {
      unsubClinics();
      unsubDoctors();
      unsubLabs();
      unsubBanners();
      unsubCategories();
      unsubDistricts();
      unsubLegalPolicies();
    };
  }, []);

  // Realtime Clinic Listener (Only for selected clinic)
  useEffect(() => {
    let unsubSelectedClinic = () => {};
    if (selectedClinic) {
      unsubSelectedClinic = attachSafeSnapshot(doc(db, 'clinics', selectedClinic.id), (docSnap: any) => {
        if (docSnap.exists()) {
          const updatedClinic = { id: docSnap.id, ...docSnap.data() } as Clinic;
          setSelectedClinic(updatedClinic);
          setClinics(prev => {
            const updated = prev.map(c => c.id === updatedClinic.id ? updatedClinic : c);
            return updated;
          });
        }
      }, `Clinic-${selectedClinic.id}`);
    }
    return () => unsubSelectedClinic();
  }, [selectedClinic?.id]);

  // User-Specific Data Fetching (Runs only when auth state or user role changes)
  useEffect(() => {
    let unsubAppointments = () => {};
    let unsubUsers = () => {};
    let unsubChats = () => {};
    let unsubNotifications = () => {};

    const userId = firebaseUser?.uid;
    const userRole = userProfile?.role;

    if (userId && userRole) {
      try {
        if (userRole === 'admin') {
          unsubUsers = attachSafeSnapshot(collection(db, 'users'), (snapshot: any) => {
            const fetchedUsers = snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(fetchedUsers);
          }, "Users (Admin)");
        }

        
        const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
        unsubChats = attachSafeSnapshot(chatQuery, (snapshot: any) => {
          const fetchedChats = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Chat));
          setChats(fetchedChats);
        }, "Chats");


        let q = query(collection(db, 'appointments'));
        if (userRole === 'user') {
          q = query(collection(db, 'appointments'), where('patientId', '==', userId));
        }
        
        unsubAppointments = attachSafeSnapshot(q, (snapshot: any) => {
          const fetchedApts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Appointment));
          setAppointments(fetchedApts);
        }, "Appointments");

        // Realtime Notifications Listener for All Panels & Roles
        let isInitialNotifLoad = true;
        const notifQuery = query(collection(db, 'notifications'));
        unsubNotifications = attachSafeSnapshot(notifQuery, (snapshot: any) => {
          if (isInitialNotifLoad) {
            isInitialNotifLoad = false;
            return;
          }
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data && data.title && data.body) {
                const isForMe = data.targetUserId === userId || data.targetRole === 'all' || (data.targetRole && data.targetRole === userRole);
                if (isForMe) {
                  triggerPushNotificationUI(data.title, data.body);
                }
              }
            }
          });
        }, "Notifications");
      } catch (error) {
        console.warn("Could not fetch user-specific appointments or chats.", error);
      }
    }

    return () => {
      unsubAppointments();
      unsubUsers();
      unsubChats();
      unsubNotifications();
    };
  }, [firebaseUser?.uid, userProfile?.role]);

  const openAuthModal = (initialRole?: UserRole) => {
    if (initialRole) setAuthModalRole(initialRole);
    else setAuthModalRole('user');
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithFirebaseEmail = async (email: string, pass: string) => {
    const isAdminEmail = email.trim().toLowerCase() === 'malikmusaib928@gmail.com';
    if (isAdminEmail) {
      setRole('admin');
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      if (isAdminEmail && auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          role: 'admin',
          email: email.trim(),
          name: 'Admin Malik',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err: any) {
      // If admin logging in for the first time and user not found or invalid credential, auto-register as admin
      if (isAdminEmail && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email')) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, pass);
          const newProfile: UserProfile = {
            uid: userCred.user.uid,
            email: email.trim(),
            name: 'Admin Malik',
            role: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
          setIsAuthModalOpen(false);
          return;
        } catch (regErr) {
          throw err;
        }
      }
      throw err;
    }
    setIsAuthModalOpen(false);
  };

  const resetPassword = async (email: string) => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  };

  const registerWithFirebaseEmail = async (email: string, pass: string, name: string, phone: string, assignedRole: UserRole, district?: string) => {
    const isAdminEmail = email.trim().toLowerCase() === 'malikmusaib928@gmail.com';
    const finalRole = isAdminEmail ? 'admin' : assignedRole;
    setRole(finalRole); // Optimistic UI update
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      uid: userCred.user.uid,
      email,
      name: name || (isAdminEmail ? 'Admin Malik' : 'User'),
      phone,
      district,
      role: finalRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
    } catch (err) {
      console.error("Could not write profile to Firestore. Check your Firestore Security Rules.", err);
    }
    setIsAuthModalOpen(false);
  };

  const loginWithGoogle = async (requestedRole?: UserRole) => {
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      
      const credential = GoogleAuthProvider.credentialFromResult(userCred);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
      
      try {
        const docRef = doc(db, 'users', userCred.user.uid);
        const docSnap = await safeGetDoc(docRef);
        if (!docSnap.exists()) {
          const newProfile: UserProfile = {
            uid: userCred.user.uid,
            email: userCred.user.email || '',
            name: userCred.user.displayName || 'New User',
            photoURL: userCred.user.photoURL || '',
            role: requestedRole || 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
        }
      } catch (dbErr) {
        console.error("Firestore read/write failed during Google Login. Check security rules.", dbErr);
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Google Signin Error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error("This preview URL is not authorized in your Firebase Auth settings. Go to Firebase Console > Authentication > Settings > Authorized Domains and add this domain.");
      }
      throw error;
    }
  };

  const logoutUser = async () => {
    console.log("Logout clicked!");
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Signout error:", e);
    }
    setFirebaseUser(null);
    setRole(null);
    setUserProfile(null);
    setPatientTab('home');
    closeAuthModal();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    setUserProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null);
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn("Profile update notice (saved locally):", err);
    }
  };

  const createClinic = async (clinicData: Omit<Clinic, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) throw new Error('Must be logged in');
    const tempId = `clinic-${Date.now()}`;
    const newClinic: Clinic = {
      ...clinicData,
      id: tempId,
      ownerId: firebaseUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClinics(prev => {
      const updated = [newClinic, ...prev];
      return updated;
    });
    if (userProfile?.role !== 'clinic_owner') {
      setUserProfile(prev => prev ? { ...prev, role: 'clinic_owner' } : null);
      setRole('clinic_owner');
    }

    const docRef = await safeAddDoc(collection(db, 'clinics'), {
      ...clinicData,
      ownerId: firebaseUser.uid,
      createdAt: newClinic.createdAt,
      updatedAt: newClinic.updatedAt
    });

    if (docRef?.id && docRef.id !== tempId) {
      setClinics(prev => {
        const updated = prev.map(c => c.id === tempId ? { ...c, id: docRef.id } : c);
        return updated;
      });
    }

    if (userProfile?.role !== 'clinic_owner') {
      await safeSetDoc(doc(db, 'users', firebaseUser.uid), { role: 'clinic_owner' }, { merge: true });
    }
  };

  const updateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
    if (!firebaseUser) return;

    const cleanUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      const val = (updates as any)[key];
      if (val !== undefined) {
        cleanUpdates[key] = val;
      }
    });
    cleanUpdates.updatedAt = new Date().toISOString();

    setSelectedClinic(prev => (prev && prev.id === clinicId) ? { ...prev, ...cleanUpdates } : prev);
    await safeSetDoc(doc(db, 'clinics', clinicId), cleanUpdates, { merge: true });
  };

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) throw new Error("Please log in to add a doctor.");
    
    let myClinic = clinics.find(c => c.ownerId === firebaseUser.uid) || 
                   clinics.find(c => c.id === userProfile?.clinicId) || 
                   selectedClinic || 
                   clinics[0];

    let clinicId = myClinic?.id;
    if (!clinicId) {
      const newClinicObj: Clinic = {
        id: `clinic-${Date.now()}`,
        ownerId: firebaseUser.uid,
        clinicName: userProfile?.clinicName || 'MediBridge Clinic',
        clinicType: 'General Clinic',
        description: 'Healthcare & OPD Facility',
        phone: userProfile?.phone || '9876543210',
        email: firebaseUser.email || '',
        address: 'Main Market Road',
        city: 'Srinagar',
        district: 'srinagar',
        state: 'Jammu & Kashmir',
        pinCode: '190001',
        waitingPatients: 0,
        emergencyAvailable: true,
        services: ['General OPD', 'Consultation'],
        specializations: ['General Medicine'],
        status: 'active',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      clinicId = newClinicObj.id;
      await safeSetDoc(doc(db, 'clinics', clinicId), { ...newClinicObj, ownerId: firebaseUser.uid });
    }

    const newDocObj = {
      ...doctorData,
      clinicId: clinicId,
      createdAt: new Date().toISOString(),
    };

    await safeAddDoc(collection(db, 'doctors'), newDocObj);
  };

  const deleteDoctor = async (doctorId: string) => {
    await safeDeleteDoc(doc(db, 'doctors', doctorId));
  };

  const addLaboratory = async (labData: Omit<Laboratory, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) throw new Error("Please log in to add a laboratory.");
    let myClinic = clinics.find(c => c.ownerId === firebaseUser.uid) || 
                   clinics.find(c => c.id === userProfile?.clinicId) || 
                   selectedClinic || 
                   clinics[0];

    const clinicId = myClinic?.id || 'clinic-1';
    const newLabObj = {
      ...labData,
      clinicId: clinicId,
      createdAt: new Date().toISOString(),
    };

    await safeAddDoc(collection(db, 'laboratories'), newLabObj);
  };

  const deleteLaboratory = async (labId: string) => {
    await safeDeleteDoc(doc(db, 'laboratories', labId));
  };

  const updateClinicWaitingPatients = async (clinicId: string, delta: number | 'reset') => {
    let safeCount = 0;
    const clinic = clinics.find(c => c.id === clinicId);
    const current = clinic?.waitingPatients || 0;
    if (delta === 'reset') {
      safeCount = 0;
    } else {
      safeCount = Math.max(0, current + delta);
    }
    
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, waitingPatients: safeCount, updatedAt: new Date().toISOString() } : c));
    setSelectedClinic(prev => (prev && prev.id === clinicId) ? { ...prev, waitingPatients: safeCount, updatedAt: new Date().toISOString() } : prev);
    
    try {
      await safeSetDoc(doc(db, 'clinics', clinicId), { waitingPatients: safeCount, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Queue update error:", e);
    }

    // Send notifications to patients holding active OPD tokens for this clinic
    try {
      const activeClinicApts = appointments.filter(a => 
        a.clinicId === clinicId && 
        (a.status === 'confirmed' || a.status === 'upcoming')
      );

      const targetClinic = clinics.find(c => c.id === clinicId) || selectedClinic;

      for (const apt of activeClinicApts) {
        if (!apt.patientId) continue;
        const patientUser = users.find(u => u.uid === apt.patientId);
        const estWaitMins = safeCount * 10;
        
        sendAppNotification(
          `📢 OPD Queue Position Updated! (Token #${apt.tokenNumber || '—'})`,
          `Clinic Queue Update: ${safeCount} patient(s) currently waiting at ${targetClinic?.clinicName || 'Clinic'}. Projected wait: ~${estWaitMins} mins.`,
          apt.patientId,
          patientUser?.fcmToken
        );
      }
    } catch (e) {
      console.warn("Queue notification notice:", e);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled') => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status, updatedAt: new Date().toISOString() } : a));
    try {
      await safeSetDoc(doc(db, 'appointments', appointmentId), { status, updatedAt: new Date().toISOString() }, { merge: true });
      
      // If completed or cancelled, optionally decrement waiting count if clinic has waiting patients
      if (status === 'completed' || status === 'cancelled') {
        const apt = appointments.find(a => a.id === appointmentId);
        if (apt && apt.clinicId) {
          const targetClinic = clinics.find(c => c.id === apt.clinicId);
          if (targetClinic && (targetClinic.waitingPatients || 0) > 0) {
            updateClinicWaitingPatients(targetClinic.id, -1);
          }
        }
      }
    } catch (e) {
      console.warn("Appointment status update error:", e);
    }
  };

  const createBooking = async (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'createdAt'> & { patientName?: string; patientPhone?: string }): Promise<Appointment> => {
    if (!firebaseUser) {
      openAuthModal('user');
      throw new Error('Please log in or sign up to book an appointment.');
    }
    const name = appointmentData.patientName || userProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Patient';
    const phone = appointmentData.patientPhone || userProfile?.phone || '';

    // Calculate Token Number automatically
    const targetClinic = clinics.find(c => c.id === appointmentData.clinicId) || selectedClinic || clinics[0];
    const currentWaiting = targetClinic?.waitingPatients ?? 0;
    const tokenNumber = currentWaiting + 1;

    const newAptData = {
      clinicId: appointmentData.clinicId || targetClinic?.id || 'clinic-1',
      doctorId: appointmentData.doctorId || '',
      doctorName: appointmentData.doctorName || (targetClinic ? targetClinic.clinicName : 'OPD Doctor'),
      serviceName: appointmentData.serviceName || 'OPD Consultation',
      date: appointmentData.date || new Date().toISOString().split('T')[0],
      formattedDate: appointmentData.formattedDate || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      timeSlot: appointmentData.timeSlot || '10:00 AM',
      status: appointmentData.status || 'confirmed',
      notes: appointmentData.notes || '',
      patientId: firebaseUser.uid,
      patientName: name,
      patientPhone: phone,
      tokenNumber,
      createdAt: new Date().toISOString(),
    };

    const docRef = await safeAddDoc(collection(db, 'appointments'), newAptData);
    const createdApt: Appointment = { id: docRef?.id || `apt-${Date.now()}`, ...newAptData };

    // Update clinic waiting queue count in Firebase instantly
    const targetClinicId = appointmentData.clinicId || targetClinic?.id;
    if (targetClinicId) {
      await updateClinicWaitingPatients(targetClinicId, 1);
    }

    // Send global broadcast push notification for appointment booking completion
    try {
      sendPushNotification(
        "Appointment Booked 🎫",
        `Patient ${name} successfully booked an OPD appointment at ${targetClinic?.clinicName || 'Clinic'} (Token #${tokenNumber}).`,
        'all'
      );
    } catch (e) {
      console.warn("Global booking push notice:", e);
    }

    // Send notification to Patient
    try {
      sendAppNotification(
        "Appointment Confirmed! 🎫",
        `Your OPD Token #${tokenNumber} at ${targetClinic?.clinicName || 'Clinic'} is confirmed for ${appointmentData.timeSlot}.`,
        firebaseUser.uid,
        userProfile?.fcmToken
      );
    } catch (e) {
      console.warn("Booking notification notice:", e);
    }

    // Send notification to Clinic Owner
    if (targetClinic?.ownerId) {
      try {
        const ownerUser = users.find(u => u.uid === targetClinic.ownerId);
        sendAppNotification(
          "New OPD Appointment Booked! 🔔",
          `Patient ${name} booked for ${appointmentData.timeSlot}. Assigned Token #${tokenNumber}.`,
          targetClinic.ownerId,
          ownerUser?.fcmToken
        );
      } catch (e) {
        console.warn("Clinic owner notification notice:", e);
      }
    }

    return createdApt;
  };

  const updateUserStatus = async (uid: string, status: 'active' | 'blocked') => {
    if (userProfile?.role !== 'admin') return;
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status } : u));
    safeUpdateDoc(doc(db, 'users', uid), { status, updatedAt: new Date().toISOString() });
  };

  const deleteUser = async (uid: string) => {
    if (userProfile?.role !== 'admin') return;
    setUsers(prev => prev.filter(u => u.uid !== uid));
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.warn("User deletion notice (saved locally):", err);
    }
  };

  const deleteClinic = async (clinicId: string) => {
    if (userProfile?.role !== 'admin') return;
    setClinics(prev => prev.filter(c => c.id !== clinicId));
    try {
      await deleteDoc(doc(db, 'clinics', clinicId));
    } catch (err) {
      console.warn("Clinic deletion notice (saved locally):", err);
    }
  };

  const sendAppNotification = async (
    title: string, 
    body: string, 
    targetUserId: string, 
    targetToken?: string
  ) => {
    // 1. Save In-App Notification (non-blocking)
    const notificationId = Date.now().toString();
    safeSetDoc(doc(db, 'notifications', notificationId), {
      id: notificationId,
      title,
      body,
      targetUserId,
      createdAt: new Date().toISOString(),
      read: false
    });

    // 2. Trigger notification UI if for current user
    if (firebaseUser && targetUserId === firebaseUser.uid) {
      triggerPushNotificationUI(title, body);
    }

    // 3. If target token, send Push
    if (targetToken) {
      try {
        const fetchPromise = fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, tokens: [targetToken] })
        });
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1500));
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err) {
        console.warn("FCM Backend Proxy notice:", err);
      }
    }
  };

  const sendPushNotification = async (title: string, body: string, targetRole: UserRole | 'all' = 'all') => {
    if (userProfile?.role !== 'admin' && role !== 'admin') return;
    
    // 1. Trigger local push notification UI immediately for sender/admin & active users
    triggerPushNotificationUI(title, body);

    // 2. Save to Firestore (non-blocking)
    const notificationId = Date.now().toString();
    safeSetDoc(doc(db, 'notifications', notificationId), {
      id: notificationId,
      title,
      body,
      targetRole,
      senderId: firebaseUser?.uid,
      createdAt: new Date().toISOString(),
      read: false
    });

    // 3. Filter target users and collect FCM tokens
    const targetUsers = targetRole === 'all' 
      ? users 
      : users.filter(u => u.role === targetRole);
    
    const tokens = targetUsers
      .map(u => u.fcmToken)
      .filter((token): token is string => !!token);

    // 4. Call backend proxy with fast timeout race
    try {
      const fetchPromise = fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, tokens })
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1500));
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn("FCM Backend Proxy notice:", err);
    }
  };

  const requestPermissions = async (force = false) => {
    // If not logged in, pass empty string to still trigger location check
    const updates = await requestPermissionsAndSave(firebaseUser?.uid || '', setUserProfile, force);
    if (updates && (updates as any).district) {
      setUserLocationDistrict((updates as any).district);
    }
  };

  const addCategory = async (name: string, icon?: string) => {
    if (userProfile?.role !== 'admin') return;
    const tempId = `cat-${Date.now()}`;
    const newCat: Category = {
      id: tempId,
      name,
      icon: icon || '',
      active: true,
      createdAt: new Date().toISOString()
    };
    setCategories(prev => [...prev, newCat]);
    try {
      const ref = await addDoc(collection(db, 'categories'), {
        name,
        icon: icon || '',
        active: true,
        createdAt: newCat.createdAt
      });
      setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id: ref.id } : c));
    } catch (err) {
      console.warn("Category add notice (saved locally):", err);
    }
  };

  const addDistrict = async (data: Partial<District>) => {
    if (!data.name) return;
    const id = data.name.toLowerCase().trim().replace(/\s+/g, '-');
    const newDist: District = {
      id,
      name: data.name.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };
    setDistricts(prev => [...prev.filter(d => d.id !== id), newDist]);
    try {
      await setDoc(doc(db, 'districts', id), newDist, { merge: true });
    } catch (error) {
      console.error("Error adding district:", error);
    }
  };

  const deleteDistrict = async (id: string) => {
    setDistricts(prev => prev.filter(d => d.id !== id));
    try {
      await deleteDoc(doc(db, 'districts', id));
    } catch (error) {
      console.error("Error deleting district:", error);
    }
  };

  const toggleDistrictStatus = async (id: string, active: boolean) => {
    setDistricts(prev => prev.map(d => d.id === id ? { ...d, active } : d));
    try {
      const existing = districts.find(d => d.id === id);
      await setDoc(doc(db, 'districts', id), {
        id,
        name: existing?.name || id,
        active,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling district status:", error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (userProfile?.role !== 'admin') return;
    await deleteDoc(doc(db, 'categories', id));
  };

  const addBanner = async (data: Partial<Banner>) => {
    if (!data.title || !data.imageUrl) return;
    const bannerId = Date.now().toString();
    const newB: Banner = {
      id: bannerId,
      title: data.title,
      imageUrl: data.imageUrl,
      link: data.link || '',
      active: true,
      createdAt: new Date().toISOString()
    };
    setBanners(prev => [newB, ...prev]);
    try {
      await setDoc(doc(db, 'banners', bannerId), newB);
    } catch (error) {
      console.error("Error adding banner:", error);
    }
  };

  const deleteBanner = async (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  const toggleBannerStatus = async (id: string, active: boolean) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active } : b));
    try {
      await setDoc(doc(db, 'banners', id), { active }, { merge: true });
    } catch (error) {
      console.error("Error toggling banner status:", error);
    }
  };

  const updateLegalPolicy = async (id: string, updates: Partial<LegalPolicy>) => {
    const updatedDoc = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setLegalPolicies(prev => prev.map(p => p.id === id ? { ...p, ...updatedDoc } : p));
    try {
      await safeSetDoc(doc(db, 'legal_policies', id), updatedDoc, { merge: true });
    } catch (error) {
      console.error("Error updating legal policy:", error);
    }
  };

  return (
    <AppContext.Provider value={{
      role, firebaseUser, userProfile, googleAccessToken, userLocationDistrict,
      users, clinics, doctors, laboratories, appointments, reviews, banners, categories, chats, districts, legalPolicies,
      patientTab, setPatientTab,
      adminTab, setAdminTab,
      doctorTab, setDoctorTab,
      activeChatId, setActiveChatId,
      selectedClinic, setSelectedClinic,
      isAuthModalOpen, authModalRole, openAuthModal, closeAuthModal,
      isWelcomeModalOpen, setIsWelcomeModalOpen,
      loginWithFirebaseEmail, registerWithFirebaseEmail, resetPassword, loginWithGoogle, logoutUser,
      createClinic, updateClinic, addDoctor, deleteDoctor, addLaboratory, deleteLaboratory, createBooking, updateClinicWaitingPatients, updateAppointmentStatus,
      updateUserStatus, updateProfile, deleteUser, deleteClinic, sendPushNotification, sendAppNotification, requestPermissions,
      addCategory, deleteCategory, addDistrict, deleteDistrict, toggleDistrictStatus,
      addBanner, deleteBanner, toggleBannerStatus, updateLegalPolicy,
      activeNotificationToast, dismissNotificationToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
