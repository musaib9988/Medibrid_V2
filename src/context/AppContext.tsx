import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Add this constant near the top, maybe before the provider
const getApiKey = () => {
  return (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
};

const requestPermissionsAndSave = async (uid: string, setUserProfileCallback?: (update: any) => void) => {
  let updates: Partial<UserProfile> = {};
  
  // 1. Request Geolocation
  if ('geolocation' in navigator) {
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
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await initMessaging();
        if (messaging) {
          try {
            // Note: In a real prod app, provide a vapidKey here.
            const currentToken = await getToken(messaging);
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
    console.warn("Notification permission error:", err);
  }

  // Save if any updates
  if (Object.keys(updates).length > 0) {
    try {
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
      if (setUserProfileCallback) {
        setUserProfileCallback((prev: any) => prev ? { ...prev, ...updates } : null);
      }
    } catch (e) {
      console.warn("Failed to update user profile with permissions:", e);
    }
  }
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
  District
} from '../types';

interface AppContextType {
  role: UserRole | null;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
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
  adminTab: 'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners' | 'categories';
  setAdminTab: (tab: 'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners' | 'categories') => void;
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
  requestPermissions: () => Promise<void>;
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

const loadCache = <T,>(key: string, fallback: T): T => {
  try {
    const cached = localStorage.getItem(`medibrid_cache_${key}`);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn(`Failed to read cache for ${key}`, e);
  }
  return fallback;
};

const saveCache = (key: string, data: any) => {
  try {
    localStorage.setItem(`medibrid_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore quota or storage limits
  }
};

let isFirestoreQuotaExhausted = false;

// Safe snapshot listener helper to auto-unsubscribe and prevent further queries if quota is exhausted
export const attachSafeSnapshot = (
  queryOrRef: any,
  onNext: (snapshot: any) => void,
  label: string
) => {
  if (isFirestoreQuotaExhausted) {
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
      console.warn("Firestore quota limit reached during getDocs. Operating on local cache.");
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
      console.warn("Firestore quota limit reached during getDoc. Operating on local cache.");
    }
    return { exists: () => false, data: () => null };
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const [users, setUsers] = useState<UserProfile[]>(() => loadCache('users', []));
  const [clinics, setClinics] = useState<Clinic[]>(() => loadCache('clinics', []));
  const [doctors, setDoctors] = useState<Doctor[]>(() => loadCache('doctors', []));
  const [laboratories, setLaboratories] = useState<Laboratory[]>(() => loadCache('laboratories', []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadCache('appointments', []));
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>(() => loadCache('banners', []));
  const [chats, setChats] = useState<Chat[]>(() => loadCache('chats', []));
  const [categories, setCategories] = useState<Category[]>(() => loadCache('categories', []));
  const [districts, setDistricts] = useState<District[]>(() => loadCache('districts', DEFAULT_DISTRICTS));

  const [patientTab, setPatientTab] = useState<'home' | 'discover' | 'appointments' | 'profile' | 'messages'>('home');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners'>('dashboard');
  const [doctorTab, setDoctorTab] = useState<'dashboard' | 'doctors' | 'laboratories' | 'appointments' | 'profile' | 'messages'>('dashboard');

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('user');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(true);

  const [activeNotificationToast, setActiveNotificationToast] = useState<{ id: string; title: string; body: string } | null>(null);

  const triggerPushNotificationUI = (title: string, body: string) => {
    // 1. Show Native Web Push Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.warn("Native Notification popup notice:", e);
      }
    }
    // 2. Show In-App Top Toast Banner
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
        } catch (error) {
          console.error("Error fetching user profile (check Firestore Rules):", error);
          setRole(isAdminEmail ? 'admin' : 'user'); // fallback so they don't get stuck with blank screen
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

  // Public Data Fetching (Runs once on mount)
  useEffect(() => {
    (async () => {
      try {
        const [clinicsSnap, doctorsSnap, labsSnap, bannersSnap, categoriesSnap, districtsSnap] = await Promise.all([
          safeGetDocs(collection(db, 'clinics')),
          safeGetDocs(collection(db, 'doctors')),
          safeGetDocs(collection(db, 'laboratories')),
          safeGetDocs(collection(db, 'banners')),
          safeGetDocs(collection(db, 'categories')),
          safeGetDocs(collection(db, 'districts')),
        ]);

        if (!clinicsSnap.empty) {
          const fetchedClinics = clinicsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Clinic));
          setClinics(fetchedClinics);
          saveCache('clinics', fetchedClinics);
        }

        if (!doctorsSnap.empty) {
          const fetchedDoctors = doctorsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Doctor));
          setDoctors(fetchedDoctors);
          saveCache('doctors', fetchedDoctors);
        }

        if (!labsSnap.empty) {
          const fetchedLabs = labsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Laboratory));
          setLaboratories(fetchedLabs);
          saveCache('laboratories', fetchedLabs);
        }

        if (!bannersSnap.empty) {
          const fetchedBanners = bannersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Banner));
          setBanners(fetchedBanners);
          saveCache('banners', fetchedBanners);
        }

        if (!categoriesSnap.empty) {
          const fetchedCategories = categoriesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Category));
          setCategories(fetchedCategories);
          saveCache('categories', fetchedCategories);
        }

        if (!districtsSnap.empty) {
          const remoteDistricts = districtsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as District));
          const distMap = new Map<string, District>();
          DEFAULT_DISTRICTS.forEach(d => distMap.set(d.id, d));
          remoteDistricts.forEach(d => distMap.set(d.id, d));
          const merged = Array.from(distMap.values());
          saveCache('districts', merged);
          setDistricts(merged);
        }
      } catch (error) {
        console.warn("Could not fetch public data.", error);
      }
    })();
  }, []);

  // Realtime Clinic Listener (Only for selected clinic)
  useEffect(() => {
    let unsubSelectedClinic = () => {};
    if (selectedClinic) {
      unsubSelectedClinic = attachSafeSnapshot(doc(db, 'clinics', selectedClinic.id), (docSnap: any) => {
        if (docSnap.exists()) {
          const updatedClinic = { id: docSnap.id, ...docSnap.data() } as Clinic;
          setSelectedClinic(updatedClinic);
          setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
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
            saveCache('users', fetchedUsers);
          }, "Users (Admin)");
        }

        const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
        unsubChats = attachSafeSnapshot(chatQuery, (snapshot: any) => {
          const fetchedChats = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Chat));
          setChats(fetchedChats);
          saveCache('chats', fetchedChats);
        }, "Chats");

        let q = query(collection(db, 'appointments'));
        if (userRole === 'user') {
          q = query(collection(db, 'appointments'), where('patientId', '==', userId));
        }
        
        unsubAppointments = attachSafeSnapshot(q, (snapshot: any) => {
          const fetchedApts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Appointment));
          setAppointments(fetchedApts);
          saveCache('appointments', fetchedApts);
        }, "Appointments");

        // Realtime Notifications Listener for User
        const notifQuery = query(collection(db, 'notifications'), where('targetUserId', '==', userId));
        unsubNotifications = attachSafeSnapshot(notifQuery, (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data && data.title && data.body) {
                triggerPushNotificationUI(data.title, data.body);
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
    await signOut(auth);
    setRole(null);
    setUserProfile(null);
    setPatientTab('home');
    openAuthModal('user');
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    setUserProfile(prev => prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { ...data, updatedAt: new Date().toISOString() });
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
      const updated = [...prev, newClinic];
      saveCache('clinics', updated);
      return updated;
    });
    if (userProfile?.role !== 'clinic_owner') {
      setUserProfile(prev => prev ? { ...prev, role: 'clinic_owner' } : null);
      setRole('clinic_owner');
    }
    try {
      const ref = await addDoc(collection(db, 'clinics'), {
        ...clinicData,
        ownerId: firebaseUser.uid,
        createdAt: newClinic.createdAt,
        updatedAt: newClinic.updatedAt
      });
      setClinics(prev => prev.map(c => c.id === tempId ? { ...c, id: ref.id } : c));
      if (userProfile?.role !== 'clinic_owner') {
        await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'clinic_owner' }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.warn("Clinic creation notice (saved locally):", err);
    }
  };

  const updateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
    if (!firebaseUser) return;

    // Sanitize updates to strip out undefined values
    const cleanUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      const val = (updates as any)[key];
      if (val !== undefined) {
        cleanUpdates[key] = val;
      }
    });
    cleanUpdates.updatedAt = new Date().toISOString();

    setClinics(prev => {
      const updated = prev.map(c => c.id === clinicId ? { ...c, ...cleanUpdates } : c);
      saveCache('clinics', updated);
      return updated;
    });

    setSelectedClinic(prev => (prev && prev.id === clinicId) ? { ...prev, ...cleanUpdates } : prev);

    try {
      await setDoc(doc(db, 'clinics', clinicId), cleanUpdates, { merge: true });
    } catch (err) {
      console.warn("Clinic update notice (saved locally):", err);
    }
  };

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const myClinic = clinics.find(c => c.ownerId === firebaseUser.uid);
    if (!myClinic) return;
    const tempId = `doc-${Date.now()}`;
    const newDocObj: Doctor = {
      ...doctorData,
      id: tempId,
      clinicId: myClinic.id,
      createdAt: new Date().toISOString(),
    };
    setDoctors(prev => {
      const updated = [...prev, newDocObj];
      saveCache('doctors', updated);
      return updated;
    });
    try {
      const ref = await addDoc(collection(db, 'doctors'), {
        ...doctorData,
        clinicId: myClinic.id,
        createdAt: newDocObj.createdAt,
      });
      setDoctors(prev => prev.map(d => d.id === tempId ? { ...d, id: ref.id } : d));
    } catch (err) {
      console.warn("Doctor addition notice (saved locally):", err);
    }
  };

  const deleteDoctor = async (doctorId: string) => {
    if (!firebaseUser) return;
    setDoctors(prev => {
      const updated = prev.filter(d => d.id !== doctorId);
      saveCache('doctors', updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'doctors', doctorId));
    } catch (err) {
      console.warn("Doctor deletion notice (saved locally):", err);
    }
  };

  const addLaboratory = async (labData: Omit<Laboratory, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const myClinic = clinics.find(c => c.ownerId === firebaseUser.uid);
    if (!myClinic) return;
    const tempId = `lab-${Date.now()}`;
    const newLabObj: Laboratory = {
      ...labData,
      id: tempId,
      clinicId: myClinic.id,
      createdAt: new Date().toISOString(),
    };
    setLaboratories(prev => {
      const updated = [...prev, newLabObj];
      saveCache('laboratories', updated);
      return updated;
    });
    try {
      const ref = await addDoc(collection(db, 'laboratories'), {
        ...labData,
        clinicId: myClinic.id,
        createdAt: newLabObj.createdAt,
      });
      setLaboratories(prev => prev.map(l => l.id === tempId ? { ...l, id: ref.id } : l));
    } catch (err) {
      console.warn("Laboratory addition notice (saved locally):", err);
    }
  };

  const deleteLaboratory = async (labId: string) => {
    if (!firebaseUser) return;
    setLaboratories(prev => {
      const updated = prev.filter(l => l.id !== labId);
      saveCache('laboratories', updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'laboratories', labId));
    } catch (err) {
      console.warn("Laboratory deletion notice (saved locally):", err);
    }
  };

  const updateClinicWaitingPatients = async (clinicId: string, count: number) => {
    const safeCount = Math.max(0, count);
    const targetClinic = clinics.find(c => c.id === clinicId);

    setClinics(prev => {
      const updated = prev.map(c => c.id === clinicId ? { ...c, waitingPatients: safeCount } : c);
      saveCache('clinics', updated);
      return updated;
    });
    setSelectedClinic(prev => (prev && prev.id === clinicId) ? { ...prev, waitingPatients: safeCount } : prev);

    try {
      await updateDoc(doc(db, 'clinics', clinicId), { waitingPatients: safeCount, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Clinic queue notice (saved locally):", err);
    }

    // Send notifications to patients holding active OPD tokens for this clinic
    try {
      const activeClinicApts = appointments.filter(a => 
        a.clinicId === clinicId && 
        (a.status === 'confirmed' || a.status === 'upcoming')
      );

      for (const apt of activeClinicApts) {
        if (!apt.patientId) continue;
        const patientUser = users.find(u => u.uid === apt.patientId);
        const estWaitMins = safeCount * 10;
        
        sendAppNotification(
          `📢 OPD Queue Position Updated! (Token #${apt.tokenNumber || '—'})`,
          `Clinic Queue Update: ${safeCount} patient(s) currently ahead at ${targetClinic?.clinicName || 'Clinic'}. Projected wait time: ~${estWaitMins} mins.`,
          apt.patientId,
          patientUser?.fcmToken
        );
      }
    } catch (e) {
      console.warn("Queue notification notice:", e);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled') => {
    setAppointments(prev => {
      const updated = prev.map(a => a.id === appointmentId ? { ...a, status } : a);
      saveCache('appointments', updated);
      return updated;
    });
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Appointment status notice (saved locally):", err);
    }
  };

  const createBooking = async (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'createdAt'> & { patientName?: string; patientPhone?: string }): Promise<Appointment> => {
    if (!firebaseUser) {
      openAuthModal('user');
      throw new Error('Please log in or sign up to book an appointment.');
    }
    const name = appointmentData.patientName || userProfile?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Patient';
    const phone = appointmentData.patientPhone || userProfile?.phone || '';

    // Calculate Token Number automatically: (current clinic waiting patients || 0) + 1
    const targetClinic = clinics.find(c => c.id === appointmentData.clinicId);
    const currentWaiting = targetClinic?.waitingPatients ?? 0;
    const tokenNumber = currentWaiting + 1;

    const newAptData = {
      clinicId: appointmentData.clinicId || '',
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

    let createdApt: Appointment;

    try {
      const docRef = await addDoc(collection(db, 'appointments'), newAptData);
      createdApt = { id: docRef.id, ...newAptData };
    } catch (err) {
      console.warn("Booking notice (saved locally):", err);
      const tempId = `apt-${Date.now()}`;
      createdApt = { id: tempId, ...newAptData };
    }

    setAppointments(prev => {
      const updated = [...prev, createdApt];
      saveCache('appointments', updated);
      return updated;
    });

    // Update clinic waiting queue count in Firestore & local state
    if (appointmentData.clinicId) {
      updateClinicWaitingPatients(appointmentData.clinicId, tokenNumber);
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
    try {
      await updateDoc(doc(db, 'users', uid), { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("User status notice (saved locally):", err);
    }
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
    // 1. Save In-App Notification
    const notificationId = Date.now().toString();
    try {
      await setDoc(doc(db, 'notifications', notificationId), {
        id: notificationId,
        title,
        body,
        targetUserId,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.warn("App notification save notice:", err);
    }

    // 2. Trigger notification UI if for current user
    if (firebaseUser && targetUserId === firebaseUser.uid) {
      triggerPushNotificationUI(title, body);
    }

    // 3. If target token, send Push
    if (targetToken) {
        try {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, tokens: [targetToken] })
          });
        } catch (err) {
          console.warn("FCM Backend Proxy notice:", err);
        }
    }
  };

  const sendPushNotification = async (title: string, body: string, targetRole: UserRole | 'all' = 'all') => {
    if (userProfile?.role !== 'admin') return;
    
    const notificationId = Date.now().toString();
    try {
      await setDoc(doc(db, 'notifications', notificationId), {
        id: notificationId,
        title,
        body,
        targetRole,
        senderId: firebaseUser?.uid,
        createdAt: new Date().toISOString(),
        read: false
      });
    } catch (err) {
      console.warn("Push notification save notice:", err);
    }

    // Trigger local push notification UI immediately for sender/admin
    triggerPushNotificationUI(title, body);

    // 1. Filter target users and collect FCM tokens
    const targetUsers = targetRole === 'all' 
      ? users 
      : users.filter(u => u.role === targetRole);
    
    const tokens = targetUsers
      .map(u => u.fcmToken)
      .filter((token): token is string => !!token);

    // 2. Call backend proxy
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, tokens })
      });
    } catch (err) {
      console.warn("FCM Backend Proxy notice:", err);
    }
  };

  const requestPermissions = async () => {
    if (!firebaseUser) return;
    await requestPermissionsAndSave(firebaseUser.uid, setUserProfile);
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

  return (
    <AppContext.Provider value={{
      role, firebaseUser, userProfile, googleAccessToken,
      users, clinics, doctors, laboratories, appointments, reviews, banners, categories, chats, districts,
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
      addBanner, deleteBanner, toggleBannerStatus,
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
