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
import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, getDoc } from 'firebase/firestore';
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
  Chat
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
  registerWithFirebaseEmail: (email: string, pass: string, name: string, phone: string, role: UserRole) => Promise<void>;
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
  createBooking: (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'patientPhone' | 'createdAt'>) => Promise<void>;
  
  // Admin Management
  updateUserStatus: (uid: string, status: 'active' | 'blocked') => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  deleteClinic: (clinicId: string) => Promise<void>;
  sendPushNotification: (title: string, body: string, targetRole?: UserRole | 'all') => Promise<void>;
  requestPermissions: () => Promise<void>;
  addCategory: (name: string, icon?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [patientTab, setPatientTab] = useState<'home' | 'discover' | 'appointments' | 'profile' | 'messages'>('home');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'clinics' | 'appointments' | 'settings' | 'banners'>('dashboard');
  const [doctorTab, setDoctorTab] = useState<'dashboard' | 'doctors' | 'laboratories' | 'appointments' | 'profile' | 'messages'>('dashboard');

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeGoogleSpace, setActiveGoogleSpace] = useState<any | null>(null);

  const startGoogleChat = async (email: string, displayName: string) => {
    if (!googleAccessToken) {
      console.error("No Google Access Token. Cannot start Google Chat.");
      return;
    }
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces:setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          space: {
            spaceType: 'DIRECT_MESSAGE',
            singleUserBotDm: false
          },
          memberships: [
            {
              member: {
                name: `users/${email}`,
                type: 'HUMAN'
              }
            }
          ]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      setActiveGoogleSpace(data);
      if (role === 'clinic_owner') {
        setDoctorTab('messages');
      } else {
        setPatientTab('messages');
      }
    } catch (err: any) {
      console.error("Failed to start Google Chat:", err);
      alert("Failed to start Google Chat: " + err.message);
    }
  };

  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('user');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(true);

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
          unsubProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              if (isAdminEmail && profile.role !== 'admin') {
                profile.role = 'admin';
                setDoc(docRef, { role: 'admin' }, { merge: true }).catch(console.error);
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
                setDoc(docRef, adminProfile, { merge: true }).catch(console.error);
                setUserProfile(adminProfile);
                setRole('admin');
              } else {
                setRole((prev) => prev || 'user'); // default assumption, but don't overwrite optimistic role
              }
            }
          }, (error) => console.error("Snapshot error on user profile:", error));
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

  // Realtime Data Fetching Based on Role
  useEffect(() => {
    let unsubClinics = () => {};
    let unsubDoctors = () => {};
    let unsubLabs = () => {};
    let unsubBanners = () => {};
    let unsubCategories = () => {};

    try {
      unsubClinics = onSnapshot(collection(db, 'clinics'), (snapshot) => {
        setClinics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clinic)));
      }, (error) => console.error("Snapshot error on clinics:", error));
      unsubDoctors = onSnapshot(collection(db, 'doctors'), (snapshot) => {
        setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor)));
      }, (error) => console.error("Snapshot error on doctors:", error));
      unsubLabs = onSnapshot(collection(db, 'laboratories'), (snapshot) => {
        setLaboratories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Laboratory)));
      }, (error) => console.error("Snapshot error on laboratories:", error));
      unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
        setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
      }, (error) => console.error("Snapshot error on banners:", error));
      unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }, (error) => {
        // Silently handle if categories collection is not yet set up or permissions are propagating
        console.info("Categories collection sync notice:", error.message);
      });
    } catch (error) {
      console.warn("Could not fetch realtime data. Check Firestore permissions.", error);
    }

    let unsubAppointments = () => {};
    let unsubUsers = () => {};
    let unsubChats = () => {};

    if (firebaseUser && userProfile) {
      try {
        if (userProfile.role === 'admin') {
          unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
          }, (error) => console.error("Snapshot error on users (admin):", error));
        }

        const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', firebaseUser.uid));
        unsubChats = onSnapshot(chatQuery, (snapshot) => {
          setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
        }, (error) => console.error("Snapshot error on chats:", error));

        let q = query(collection(db, 'appointments'));
        if (userProfile.role === 'user') {
          q = query(collection(db, 'appointments'), where('patientId', '==', firebaseUser.uid));
        } else if (userProfile.role === 'clinic_owner') {
          const myClinic = clinics.find(c => c.ownerId === firebaseUser.uid);
          if (myClinic) {
            q = query(collection(db, 'appointments'), where('clinicId', '==', myClinic.id));
          }
        }
        unsubAppointments = onSnapshot(q, (snapshot) => {
          setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
        }, (error) => console.error("Snapshot error on appointments:", error));
      } catch (error) {
         console.warn("Could not fetch appointments.", error);
      }
    }

    return () => {
      unsubClinics();
      unsubDoctors();
      unsubLabs();
      unsubBanners();
      unsubCategories();
      unsubAppointments();
      unsubUsers();
      unsubChats();
    };
  }, [firebaseUser, userProfile, clinics.length]);

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

  const registerWithFirebaseEmail = async (email: string, pass: string, name: string, phone: string, assignedRole: UserRole) => {
    const isAdminEmail = email.trim().toLowerCase() === 'malikmusaib928@gmail.com';
    const finalRole = isAdminEmail ? 'admin' : assignedRole;
    setRole(finalRole); // Optimistic UI update
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      uid: userCred.user.uid,
      email,
      name: name || (isAdminEmail ? 'Admin Malik' : 'User'),
      phone,
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
        const docSnap = await getDoc(docRef);
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

  const createClinic = async (clinicData: Omit<Clinic, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) throw new Error('Must be logged in');
    const newClinic = {
      ...clinicData,
      ownerId: firebaseUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'clinics'), newClinic);
    // Optionally update user role to clinic_owner if not already
    if (userProfile?.role !== 'clinic_owner') {
      await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'clinic_owner' }, { merge: true });
    }
  };

  const updateClinic = async (clinicId: string, updates: Partial<Clinic>) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'clinics', clinicId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const addDoctor = async (doctorData: Omit<Doctor, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const myClinic = clinics.find(c => c.ownerId === firebaseUser.uid);
    if (!myClinic) return;
    await addDoc(collection(db, 'doctors'), {
      ...doctorData,
      clinicId: myClinic.id,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteDoctor = async (doctorId: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'doctors', doctorId));
  };

  const addLaboratory = async (labData: Omit<Laboratory, 'id' | 'clinicId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const myClinic = clinics.find(c => c.ownerId === firebaseUser.uid);
    if (!myClinic) return;
    await addDoc(collection(db, 'laboratories'), {
      ...labData,
      clinicId: myClinic.id,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteLaboratory = async (labId: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'laboratories', labId));
  };

  const createBooking = async (appointmentData: Omit<Appointment, 'id' | 'patientId' | 'patientName' | 'patientPhone' | 'createdAt'>) => {
    if (!firebaseUser || !userProfile) return;
    await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      patientId: firebaseUser.uid,
      patientName: userProfile.name,
      patientPhone: userProfile.phone || '',
      createdAt: new Date().toISOString(),
    });
  };

  const updateUserStatus = async (uid: string, status: 'active' | 'blocked') => {
    if (userProfile?.role !== 'admin') return;
    await updateDoc(doc(db, 'users', uid), { status, updatedAt: new Date().toISOString() });
  };

  const deleteUser = async (uid: string) => {
    if (userProfile?.role !== 'admin') return;
    await deleteDoc(doc(db, 'users', uid));
  };

  const deleteClinic = async (clinicId: string) => {
    if (userProfile?.role !== 'admin') return;
    await deleteDoc(doc(db, 'clinics', clinicId));
  };

  const sendPushNotification = async (title: string, body: string, targetRole: UserRole | 'all' = 'all') => {
    if (userProfile?.role !== 'admin') return;
    
    const notificationId = Date.now().toString();
    await setDoc(doc(db, 'notifications', notificationId), {
      id: notificationId,
      title,
      body,
      targetRole,
      senderId: firebaseUser?.uid,
      createdAt: new Date().toISOString(),
      read: false
    });

    // 1. Filter target users and collect FCM tokens
    const targetUsers = targetRole === 'all' 
      ? users 
      : users.filter(u => u.role === targetRole);
    
    const tokens = targetUsers
      .map(u => u.fcmToken)
      .filter((token): token is string => !!token);

    if (tokens.length === 0) {
      console.warn("No FCM tokens found for target audience.");
      return;
    }

    // 2. Call backend proxy to send actual push via FCM
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, tokens })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send push notification');
      console.log(`Push Notification Sent via Backend:`, data);
    } catch (err) {
      console.error("FCM Backend Proxy Error:", err);
      // We don't throw here to avoid breaking the UI, but we log it
      alert("Note: Notification saved to DB, but push delivery failed. Please check FCM_SERVER_KEY in settings.");
    }
  };

  const requestPermissions = async () => {
    if (!firebaseUser) return;
    await requestPermissionsAndSave(firebaseUser.uid, setUserProfile);
  };

  const addCategory = async (name: string, icon?: string) => {
    if (userProfile?.role !== 'admin') return;
    await addDoc(collection(db, 'categories'), {
      name,
      icon: icon || '',
      active: true,
      createdAt: new Date().toISOString()
    });
  };

  const deleteCategory = async (id: string) => {
    if (userProfile?.role !== 'admin') return;
    await deleteDoc(doc(db, 'categories', id));
  };

  return (
    <AppContext.Provider value={{
      role, firebaseUser, userProfile, googleAccessToken,
      users, clinics, doctors, laboratories, appointments, reviews, banners, categories, chats,
      patientTab, setPatientTab,
      adminTab, setAdminTab,
      doctorTab, setDoctorTab,
      activeChatId, setActiveChatId,
      activeGoogleSpace, setActiveGoogleSpace, startGoogleChat,
      selectedClinic, setSelectedClinic,
      isAuthModalOpen, authModalRole, openAuthModal, closeAuthModal,
      isWelcomeModalOpen, setIsWelcomeModalOpen,
      loginWithFirebaseEmail, registerWithFirebaseEmail, resetPassword, loginWithGoogle, logoutUser,
      createClinic, updateClinic, addDoctor, deleteDoctor, addLaboratory, deleteLaboratory, createBooking,
      updateUserStatus, deleteUser, deleteClinic, sendPushNotification, requestPermissions,
      addCategory, deleteCategory
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
