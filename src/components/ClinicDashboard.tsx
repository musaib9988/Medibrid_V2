import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { ClinicOnboarding } from './ClinicOnboarding';
import { 
  Users, Calendar, Activity, CheckCircle2, ChevronRight, Stethoscope, TestTube, 
  LayoutDashboard, User, MessageSquare, LogOut, Plus, Trash2, X, Edit2, Upload, 
  MapPin, Clock, Building2, Check, Phone, Mail, Sparkles 
} from 'lucide-react';
import { MessagesTab } from './MessagesTab';
import { uploadFileWithFallback } from '../utils/imageCompressor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ClinicDashboard: React.FC = () => {
  const { 
    clinics, doctors, laboratories, appointments, firebaseUser, userProfile, 
    doctorTab, setDoctorTab, logoutUser, updateClinic, addDoctor, deleteDoctor, 
    addLaboratory, deleteLaboratory, sendPushNotification, updateClinicWaitingPatients, updateAppointmentStatus
  } = useApp();
  
  const myClinic = clinics.find(c => c.ownerId === firebaseUser?.uid) || clinics.find(c => c.id === userProfile?.clinicId) || clinics[0];

  // New Appointment Bell Chime & Toast Notification
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);
  const prevAptLength = React.useRef(appointments.length);

  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.15); // E6
      
      gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 1.5);
    } catch (err) {
      console.error("Audio bell error:", err);
    }
  };

  React.useEffect(() => {
    if (myClinic) {
      const myApts = appointments.filter(a => a.clinicId === myClinic.id);
      if (myApts.length > prevAptLength.current) {
        playBellSound();
        const newest = myApts[myApts.length - 1];
        if (newest) {
          setNewBookingAlert(`🔔 New Appointment Booked by ${newest.patientName || 'Patient'}! Assigned Token #${newest.tokenNumber || 'New'}`);
        }
      }
      prevAptLength.current = myApts.length;
    }
  }, [appointments, myClinic]);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Saving...');
  const [errorMsg, setErrorMsg] = useState('');

  // Doctor Form State
  const [docData, setDocData] = useState({
    name: '',
    specialization: 'General Physician',
    qualification: '',
    experienceYears: 5,
    consultationFee: 300,
    phone: '',
    email: '',
    photoUrl: '',
    photoFile: null as File | null,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timings: '09:00 AM - 05:00 PM'
  });

  // Lab Form State
  const [labData, setLabData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    tests: 'Full Body Checkup, Blood Sugar, CBC, Lipid Profile',
    timings: '08:00 AM - 08:00 PM'
  });

  // Edit Profile Form State
  const [editData, setEditData] = useState({
    clinicName: '',
    clinicType: 'General Clinic',
    description: '',
    about: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    logoUrl: '',
    logoFile: null as File | null,
    coverImageUrl: '',
    coverFile: null as File | null,
    emergencyAvailable: false,
    services: [] as string[],
    newService: '',
    workingHours: DAYS.reduce((acc, day) => {
      acc[day] = { isOpen: true, openTime: '09:00', closeTime: '17:00' };
      return acc;
    }, {} as Record<string, any>)
  });

  if (!myClinic) {
    return (
      <div className="flex flex-col gap-6 w-full pb-20">
        <Header />
        <ClinicOnboarding />
      </div>
    );
  }

  const myDoctors = doctors.filter(d => d.clinicId === myClinic.id);
  const myLabs = laboratories.filter(l => l.clinicId === myClinic.id);
  const myAppointments = appointments.filter(a => a.clinicId === myClinic.id);

  // Calculate profile completion
  let completionSteps = 0;
  let totalSteps = 4;
  if (myClinic.coverImageUrl) completionSteps++;
  if (myClinic.logoUrl) completionSteps++;
  if (myDoctors.length > 0) completionSteps++;
  if (myLabs.length > 0) completionSteps++;
  const completionPercentage = Math.round((completionSteps / totalSteps) * 100);

  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17) timeGreeting = 'Good evening';

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Dr. User';

  const openEditProfileModal = () => {
    setEditData({
      clinicName: myClinic.clinicName || '',
      clinicType: myClinic.clinicType || 'General Clinic',
      description: myClinic.description || '',
      about: myClinic.about || '',
      phone: myClinic.phone || '',
      email: myClinic.email || '',
      whatsapp: myClinic.whatsapp || '',
      address: myClinic.address || '',
      locality: myClinic.locality || '',
      city: myClinic.city || '',
      district: myClinic.district || '',
      state: myClinic.state || '',
      pinCode: myClinic.pinCode || '',
      logoUrl: myClinic.logoUrl || '',
      logoFile: null,
      coverImageUrl: myClinic.coverImageUrl || '',
      coverFile: null,
      emergencyAvailable: myClinic.emergencyAvailable || false,
      services: myClinic.services || [],
      newService: '',
      workingHours: myClinic.workingHours || DAYS.reduce((acc, day) => {
        acc[day] = { isOpen: true, openTime: '09:00', closeTime: '17:00' };
        return acc;
      }, {} as Record<string, any>)
    });
    setErrorMsg('');
    setIsEditProfileOpen(true);
  };

  const uploadFileHelper = async (file: File, path: string) => {
    return await uploadFileWithFallback(file, path);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('Uploading images...');
    setErrorMsg('');
    try {
      let logoUrl = editData.logoUrl;
      let coverImageUrl = editData.coverImageUrl;

      const uploadTasks = [];
      
      if (editData.logoFile) {
        uploadTasks.push(
          uploadFileHelper(editData.logoFile, `clinics/${myClinic.id}/logo_${Date.now()}`)
            .then(url => { logoUrl = url; })
        );
      }
      if (editData.coverFile) {
        uploadTasks.push(
          uploadFileHelper(editData.coverFile, `clinics/${myClinic.id}/cover_${Date.now()}`)
            .then(url => { coverImageUrl = url; })
        );
      }

      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }

      setSaveMessage('Saving profile...');
      await updateClinic(myClinic.id, {
        clinicName: editData.clinicName,
        clinicType: editData.clinicType,
        description: editData.description,
        about: editData.about,
        phone: editData.phone,
        email: editData.email,
        whatsapp: editData.whatsapp,
        address: editData.address,
        locality: editData.locality,
        city: editData.city,
        district: editData.district,
        state: editData.state,
        pinCode: editData.pinCode,
        logoUrl,
        coverImageUrl,
        emergencyAvailable: editData.emergencyAvailable,
        services: editData.services,
        workingHours: editData.workingHours
      });

      setIsEditProfileOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('Uploading photo...');
    setErrorMsg('');
    try {
      let photoUrl = docData.photoUrl;
      if (docData.photoFile) {
        photoUrl = await uploadFileHelper(docData.photoFile, `doctors/${myClinic.id}/doc_${Date.now()}`);
      }

      setSaveMessage('Adding doctor...');
      await addDoctor({
        name: docData.name,
        specialization: docData.specialization,
        qualification: docData.qualification,
        experienceYears: Number(docData.experienceYears),
        consultationFee: Number(docData.consultationFee),
        phone: docData.phone,
        email: docData.email,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
        availableDays: docData.availableDays,
        timings: docData.timings,
        rating: 5.0
      });

      setDocData({
        name: '',
        specialization: 'General Physician',
        qualification: '',
        experienceYears: 5,
        consultationFee: 300,
        phone: '',
        email: '',
        photoUrl: '',
        photoFile: null,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timings: '09:00 AM - 05:00 PM'
      });
      setIsAddDoctorOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const testsList = labData.tests.split(',').map(t => t.trim()).filter(Boolean);
      await addLaboratory({
        name: labData.name,
        description: labData.description,
        phone: labData.phone,
        email: labData.email,
        availableTests: testsList,
        timings: labData.timings
      });

      setLabData({
        name: '',
        description: '',
        phone: '',
        email: '',
        tests: 'Full Body Checkup, Blood Sugar, CBC, Lipid Profile',
        timings: '08:00 AM - 08:00 PM'
      });
      setIsAddLabOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add laboratory');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAppointmentStatus = async (aptId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateAppointmentStatus(aptId, newStatus);
    } catch (e) {
      console.error("Failed to update appointment status:", e);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      <Header />
      
      {doctorTab === 'dashboard' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
            <div>
              <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{timeGreeting}, {firstName}</h1>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                Managing <span className="font-bold text-slate-800">{myClinic.clinicName}</span>
                {myClinic.verified ? (
                  <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold">
                    Pending Verification
                  </span>
                )}
              </p>
            </div>

            <button 
              onClick={openEditProfileModal}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit Clinic Profile
            </button>
            <button 
              onClick={logoutUser}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl font-bold hover:bg-rose-100 transition-colors shadow-sm border border-rose-100 text-sm"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>

          {/* Completion Banner */}
          {completionPercentage < 100 && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Clinic Profile {completionPercentage}% Complete
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                    {completionSteps}/{totalSteps} Steps
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3">
                  <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <div className="text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {!myClinic.coverImageUrl && (
                    <button onClick={openEditProfileModal} className="text-left font-medium text-slate-700 hover:text-teal-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Add cover image
                    </button>
                  )}
                  {!myClinic.logoUrl && (
                    <button onClick={openEditProfileModal} className="text-left font-medium text-slate-700 hover:text-teal-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Add clinic logo
                    </button>
                  )}
                  {myDoctors.length === 0 && (
                    <button onClick={() => setIsAddDoctorOpen(true)} className="text-left font-medium text-slate-700 hover:text-teal-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Add your first doctor
                    </button>
                  )}
                  {myLabs.length === 0 && (
                    <button onClick={() => setIsAddLabOpen(true)} className="text-left font-medium text-slate-700 hover:text-teal-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Add laboratory information
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={openEditProfileModal}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 shrink-0 shadow-md w-full md:w-auto"
              >
                Complete Profile
              </button>
            </div>
          )}
        
          {/* New Booking Alert Toast */}
          {newBookingAlert && (
            <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <p className="font-bold text-sm">{newBookingAlert}</p>
              </div>
              <button 
                onClick={() => setNewBookingAlert(null)}
                className="text-emerald-100 hover:text-white p-1 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Real-time Waitlist & OPD Queue Control Widget */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 md:p-6 mb-8 shadow-md border border-teal-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-bold text-lg text-white">Real-Time OPD Waitlist Control</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Reflected Live on Patient App
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Manage how many patients are currently waiting in your OPD clinic queue and call tokens sequentially.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => updateClinicWaitingPatients(myClinic.id, -1)}
                  disabled={(myClinic.waitingPatients || 0) <= 0}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-black text-lg flex items-center justify-center transition-colors active:scale-95"
                  title="Decrease waiting queue by 1"
                >
                  -
                </button>
                <div className="text-center px-3">
                  <p className="text-2xl font-black text-amber-300">{myClinic.waitingPatients || 0}</p>
                  <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Waiting</p>
                </div>
                <button 
                  onClick={() => updateClinicWaitingPatients(myClinic.id, 1)}
                  className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-lg flex items-center justify-center transition-colors active:scale-95 shadow-sm"
                  title="Increase waiting queue by 1"
                >
                  +
                </button>
              </div>

              <div className="h-8 w-px bg-white/20 hidden sm:block mx-1"></div>

              <button 
                onClick={() => {
                  if ((myClinic.waitingPatients || 0) > 0) {
                    updateClinicWaitingPatients(myClinic.id, -1);
                    setNewBookingAlert(`📢 Calling Next Patient in Queue!`);
                  }
                }}
                disabled={(myClinic.waitingPatients || 0) <= 0}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Call Next Patient</span>
              </button>

              <button 
                onClick={() => updateClinicWaitingPatients(myClinic.id, 'reset')}
                className="text-[11px] font-bold text-teal-200 hover:text-white bg-white/10 px-3 py-2.5 rounded-xl transition-colors"
                title="Reset queue to 0"
              >
                Clear Queue
              </button>
            </div>
          </div>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div 
              onClick={() => setDoctorTab('doctors')} 
              className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col items-start hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 mb-3 group-hover:scale-110 transition-transform"><Stethoscope className="w-5 h-5"/></div>
              <p className="text-3xl font-black text-slate-800">{myDoctors.length}</p>
              <p className="text-xs text-slate-600 font-bold uppercase mt-1 flex items-center justify-between w-full">
                Doctors <ChevronRight className="w-3.5 h-3.5 text-blue-400"/>
              </p>
            </div>

            <div 
              onClick={() => setDoctorTab('laboratories')} 
              className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col items-start hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600 mb-3 group-hover:scale-110 transition-transform"><TestTube className="w-5 h-5"/></div>
              <p className="text-3xl font-black text-slate-800">{myLabs.length}</p>
              <p className="text-xs text-slate-600 font-bold uppercase mt-1 flex items-center justify-between w-full">
                Laboratories <ChevronRight className="w-3.5 h-3.5 text-purple-400"/>
              </p>
            </div>

            <div 
              onClick={() => setDoctorTab('appointments')} 
              className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex flex-col items-start hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600 mb-3 group-hover:scale-110 transition-transform"><Calendar className="w-5 h-5"/></div>
              <p className="text-3xl font-black text-slate-800">{myAppointments.length}</p>
              <p className="text-xs text-slate-600 font-bold uppercase mt-1 flex items-center justify-between w-full">
                Appointments <ChevronRight className="w-3.5 h-3.5 text-teal-400"/>
              </p>
            </div>

            <div 
              onClick={() => setDoctorTab('appointments')} 
              className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col items-start hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 mb-3 group-hover:scale-110 transition-transform"><Users className="w-5 h-5"/></div>
              <p className="text-3xl font-black text-slate-800">{new Set(myAppointments.map(a => a.patientId)).size}</p>
              <p className="text-xs text-slate-600 font-bold uppercase mt-1 flex items-center justify-between w-full">
                Patients <ChevronRight className="w-3.5 h-3.5 text-amber-400"/>
              </p>
            </div>
          </div>

          {/* Quick Actions & Recent Appointments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Recent Appointments</h3>
                <button onClick={() => setDoctorTab('appointments')} className="text-teal-600 text-sm font-bold flex items-center hover:underline">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {myAppointments.length > 0 ? (
                <div className="space-y-3">
                  {myAppointments.slice(0, 4).map(apt => (
                    <div key={apt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-slate-50 rounded-xl gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-800">{apt.patientName}</p>
                          {apt.tokenNumber && (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                              Token #{apt.tokenNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{apt.doctorName ? `Dr. ${apt.doctorName} • ` : ''}{apt.formattedDate || 'Today'} at {apt.timeSlot}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                          apt.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : 
                          apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">No appointments yet.</p>
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 mb-4">Quick Management</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsAddDoctorOpen(true)}
                    className="w-full flex items-center justify-between p-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-sm transition-colors border border-teal-100"
                  >
                    <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Add Doctor</span>
                    <Plus className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setIsAddLabOpen(true)}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl font-bold text-sm transition-colors border border-purple-100"
                  >
                    <span className="flex items-center gap-2"><TestTube className="w-4 h-4"/> Add Laboratory</span>
                    <Plus className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={openEditProfileModal}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-sm transition-colors border border-slate-200"
                  >
                    <span className="flex items-center gap-2"><Edit2 className="w-4 h-4"/> Update Hours & Services</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Verification Status:</span>
                <span className={`font-bold ${myClinic.verified ? 'text-teal-600' : 'text-amber-600'}`}>
                  {myClinic.verified ? 'Verified' : 'Under Review'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {doctorTab === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-teal-600"/> Clinic Appointments</h2>
              <p className="text-slate-500 text-sm">View and update appointment statuses for your clinic.</p>
            </div>
          </div>

          {myAppointments.length > 0 ? (
            <div className="space-y-4">
              {myAppointments.map(apt => (
                <div key={apt.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800 text-lg">{apt.patientName}</h4>
                      {apt.tokenNumber && (
                        <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-md shadow-sm">
                          Token #{apt.tokenNumber}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                        apt.status === 'confirmed' ? 'bg-teal-100 text-teal-700' : 
                        apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {apt.doctorName ? `Doctor: Dr. ${apt.doctorName}` : 'General Visit'} • Phone: {apt.patientPhone || 'Not provided'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Date: <span className="font-bold text-slate-700">{apt.formattedDate || 'Scheduled'}</span> at <span className="font-bold text-slate-700">{apt.timeSlot}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    {apt.status !== 'confirmed' && (
                      <button 
                        onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmed')}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700"
                      >
                        Confirm
                      </button>
                    )}
                    {apt.status !== 'completed' && (
                      <button 
                        onClick={() => handleUpdateAppointmentStatus(apt.id, 'completed')}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                      >
                        Mark Completed
                      </button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button 
                        onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No appointments scheduled yet</p>
              <p className="text-sm text-slate-500 mt-1">When patients book visits with your clinic, they will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* DOCTORS TAB */}
      {doctorTab === 'doctors' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Stethoscope className="text-teal-600"/> Clinic Doctors ({myDoctors.length})</h2>
              <p className="text-slate-500 text-sm">Manage the medical team at {myClinic.clinicName}.</p>
            </div>
            <button 
              onClick={() => setIsAddDoctorOpen(true)}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Doctor
            </button>
          </div>

          {myDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDoctors.map(doc => (
                <div key={doc.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex gap-4 items-start relative group">
                  <img 
                    src={doc.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'} 
                    alt={doc.name} 
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200" 
                  />
                  <div className="flex-1 pr-8">
                    <h4 className="font-bold text-slate-800 text-base">{doc.name}</h4>
                    <p className="text-teal-600 text-xs font-bold">{doc.specialization}</p>
                    <p className="text-slate-500 text-xs mt-1">{doc.qualification} • {doc.experienceYears} Years Exp.</p>
                    <p className="text-slate-700 text-xs font-bold mt-2">Fee: ₹{doc.consultationFee}</p>
                    {doc.timings && <p className="text-slate-500 text-[11px] mt-0.5">Timing: {doc.timings}</p>}
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm(`Remove Dr. ${doc.name}?`)) {
                        deleteDoctor(doc.id);
                      }
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No doctors added yet</p>
              <p className="text-sm text-slate-500 mb-4">Add your doctors so patients can find them and book appointments.</p>
              <button 
                onClick={() => setIsAddDoctorOpen(true)}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700"
              >
                Add First Doctor
              </button>
            </div>
          )}
        </div>
      )}

      {/* LABORATORIES TAB */}
      {doctorTab === 'laboratories' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><TestTube className="text-purple-600"/> Clinic Laboratories ({myLabs.length})</h2>
              <p className="text-slate-500 text-sm">Manage diagnostic facilities connected to your clinic.</p>
            </div>
            <button 
              onClick={() => setIsAddLabOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Laboratory
            </button>
          </div>

          {myLabs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLabs.map(lab => (
                <div key={lab.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-base">{lab.name}</h4>
                    <button 
                      onClick={() => {
                        if (confirm(`Remove ${lab.name}?`)) {
                          deleteLaboratory(lab.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {lab.description && <p className="text-slate-600 text-xs mb-3">{lab.description}</p>}
                  {lab.availableTests && lab.availableTests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {lab.availableTests.map((t, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {lab.timings && <p className="text-slate-500 text-[11px]">Timings: {lab.timings}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <TestTube className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No laboratory added yet</p>
              <p className="text-sm text-slate-500 mb-4">Add your diagnostic lab facilities for patient information.</p>
              <button 
                onClick={() => setIsAddLabOpen(true)}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700"
              >
                Add First Laboratory
              </button>
            </div>
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {doctorTab === 'messages' && (
        <MessagesTab />
      )}

      {/* PROFILE / SETTINGS TAB */}
      {doctorTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Clinic Profile & Settings</h2>
            <button 
              onClick={openEditProfileModal}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-teal-700 shadow-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden border border-teal-200">
              {myClinic.logoUrl ? (
                <img src={myClinic.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                (myClinic.clinicName || 'C').charAt(0)
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-xl">{myClinic.clinicName}</h3>
              <p className="text-teal-600 text-sm font-bold">{myClinic.clinicType}</p>
              <p className="text-slate-500 text-sm mt-1">{myClinic.address}, {myClinic.city}, {myClinic.state}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                <span>📞 {myClinic.phone || 'No phone'}</span>
                <span>✉️ {myClinic.email || 'No email'}</span>
                <span>💬 WhatsApp: {myClinic.whatsapp || 'Not added'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600"/> Working Hours</h4>
              {DAYS.map(day => {
                const h = myClinic.workingHours?.[day];
                return (
                  <div key={day} className="flex justify-between text-xs border-b border-slate-200/60 pb-1.5 last:border-0">
                    <span className="font-medium text-slate-600">{day}</span>
                    <span className="font-bold text-slate-800">
                      {h?.isOpen ? `${h.openTime} - ${h.closeTime}` : <span className="text-slate-400">Closed</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-600"/> Services Provided</h4>
              <div className="flex flex-wrap gap-1.5">
                {myClinic.services && myClinic.services.length > 0 ? (
                  myClinic.services.map((s, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No services listed yet.</p>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={logoutUser}
            className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100 mt-6"
          >
            <span className="font-bold text-red-600 flex items-center gap-2"><LogOut className="w-5 h-5"/> Log Out</span>
            <span className="text-red-400 font-bold">›</span>
          </button>
        </div>
      )}
      
      {/* Fixed Bottom Navigation Tabs - Fixed in one place */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] pointer-events-none pb-2 px-3 md:hidden">
        <div className="pointer-events-auto max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-2 flex justify-around items-center">
          <button onClick={() => setDoctorTab('dashboard')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'dashboard' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </button>
          <button onClick={() => setDoctorTab('appointments')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'appointments' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Visits</span>
          </button>
          <button onClick={() => setDoctorTab('doctors')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'doctors' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500'}`}>
            <Stethoscope className="w-5 h-5" />
            <span className="text-[10px]">Doctors</span>
          </button>
          <button onClick={() => setDoctorTab('laboratories')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'laboratories' ? 'text-purple-700 font-bold bg-purple-50' : 'text-slate-500'}`}>
            <TestTube className="w-5 h-5" />
            <span className="text-[10px]">Labs</span>
          </button>
          <button onClick={() => setDoctorTab('messages')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'messages' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Chats</span>
          </button>
          <button onClick={() => setDoctorTab('profile')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${doctorTab === 'profile' ? 'text-teal-700 font-bold bg-teal-50' : 'text-slate-500'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      </div>

      {/* MODAL: EDIT CLINIC PROFILE */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button 
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-teal-600" /> Edit Clinic Profile
            </h2>
            <p className="text-slate-500 text-sm mb-6">Update images, address, timings, and services for {myClinic.clinicName}.</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{errorMsg}</div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase text-teal-700">1. Basic Details</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Name *</label>
                  <input 
                    type="text" 
                    value={editData.clinicName} 
                    onChange={e => setEditData({...editData, clinicName: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Type</label>
                    <select 
                      value={editData.clinicType} 
                      onChange={e => setEditData({...editData, clinicType: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                    >
                      <option>General Clinic</option>
                      <option>Multi-Specialty Clinic</option>
                      <option>Specialty Clinic</option>
                      <option>Diagnostic Center</option>
                      <option>Healthcare Center</option>
                      <option>Hospital</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Tagline/Description</label>
                    <input 
                      type="text" 
                      value={editData.description} 
                      onChange={e => setEditData({...editData, description: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      placeholder="e.g. Modern healthcare in Jammu" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">About Clinic</label>
                  <textarea 
                    value={editData.about} 
                    onChange={e => setEditData({...editData, about: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20" 
                    placeholder="Full detailed description of facility and specialties..." 
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase text-teal-700">2. Logo & Cover Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Logo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setEditData({...editData, logoFile: e.target.files?.[0] || null})}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Or enter image URL:</p>
                    <input 
                      type="url" 
                      value={editData.logoUrl} 
                      onChange={e => setEditData({...editData, logoUrl: e.target.value})} 
                      placeholder="https://..." 
                      className="w-full p-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cover Banner Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setEditData({...editData, coverFile: e.target.files?.[0] || null})}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700" 
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Or enter image URL:</p>
                    <input 
                      type="url" 
                      value={editData.coverImageUrl} 
                      onChange={e => setEditData({...editData, coverImageUrl: e.target.value})} 
                      placeholder="https://..." 
                      className="w-full p-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase text-teal-700">3. Location & Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={editData.phone} 
                      onChange={e => setEditData({...editData, phone: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={editData.email} 
                      onChange={e => setEditData({...editData, email: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                    <input 
                      type="tel" 
                      value={editData.whatsapp} 
                      onChange={e => setEditData({...editData, whatsapp: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Address *</label>
                    <input 
                      type="text" 
                      value={editData.address} 
                      onChange={e => setEditData({...editData, address: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input 
                      type="text" 
                      value={editData.city} 
                      onChange={e => setEditData({...editData, city: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                    <input 
                      type="text" 
                      value={editData.district} 
                      onChange={e => setEditData({...editData, district: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      placeholder="e.g. Srinagar"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                    <input 
                      type="text" 
                      value={editData.state} 
                      onChange={e => setEditData({...editData, state: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours & Emergency */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm uppercase text-teal-700">4. Working Hours</h3>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="checkbox" 
                      checked={editData.emergencyAvailable} 
                      onChange={e => setEditData({...editData, emergencyAvailable: e.target.checked})}
                      className="w-4 h-4 text-teal-600 rounded" 
                    />
                    24/7 Emergency Available
                  </label>
                </div>

                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs gap-2">
                      <label className="flex items-center gap-2 font-bold text-slate-700 w-28">
                        <input 
                          type="checkbox" 
                          checked={editData.workingHours[day]?.isOpen} 
                          onChange={e => setEditData({
                            ...editData,
                            workingHours: {
                              ...editData.workingHours,
                              [day]: { ...editData.workingHours[day], isOpen: e.target.checked }
                            }
                          })}
                          className="w-3.5 h-3.5 text-teal-600 rounded" 
                        />
                        {day}
                      </label>
                      {editData.workingHours[day]?.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={editData.workingHours[day]?.openTime || '09:00'} 
                            onChange={e => setEditData({
                              ...editData,
                              workingHours: {
                                ...editData.workingHours,
                                [day]: { ...editData.workingHours[day], openTime: e.target.value }
                              }
                            })}
                            className="p-1 border border-slate-200 rounded bg-white text-xs" 
                          />
                          <span className="text-slate-400">to</span>
                          <input 
                            type="time" 
                            value={editData.workingHours[day]?.closeTime || '17:00'} 
                            onChange={e => setEditData({
                              ...editData,
                              workingHours: {
                                ...editData.workingHours,
                                [day]: { ...editData.workingHours[day], closeTime: e.target.value }
                              }
                            })}
                            className="p-1 border border-slate-200 rounded bg-white text-xs" 
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm uppercase text-teal-700">5. Services Offered</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editData.newService} 
                    onChange={e => setEditData({...editData, newService: e.target.value})} 
                    placeholder="Add service (e.g. Vaccination, X-Ray)" 
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" 
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (editData.newService.trim()) {
                        setEditData({
                          ...editData,
                          services: [...editData.services, editData.newService.trim()],
                          newService: ''
                        });
                      }
                    }}
                    className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editData.services.map((s, idx) => (
                    <span key={idx} className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      {s}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-600" 
                        onClick={() => setEditData({...editData, services: editData.services.filter((_, i) => i !== idx)})} 
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditProfileOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {saveMessage}
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCTOR */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button 
              onClick={() => setIsAddDoctorOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal-600" /> Add New Doctor
            </h2>
            <p className="text-slate-500 text-sm mb-6">Add a practitioner to {myClinic.clinicName}.</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{errorMsg}</div>
            )}

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                <input 
                  type="text" 
                  value={docData.name} 
                  onChange={e => setDocData({...docData, name: e.target.value})} 
                  placeholder="e.g. Dr. Aamir Khan" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialization *</label>
                  <input 
                    type="text" 
                    value={docData.specialization} 
                    onChange={e => setDocData({...docData, specialization: e.target.value})} 
                    placeholder="e.g. Cardiologist" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                  <input 
                    type="text" 
                    value={docData.qualification} 
                    onChange={e => setDocData({...docData, qualification: e.target.value})} 
                    placeholder="e.g. MBBS, MD" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Exp.</label>
                  <input 
                    type="number" 
                    value={docData.experienceYears} 
                    onChange={e => setDocData({...docData, experienceYears: Number(e.target.value)})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input 
                    type="number" 
                    value={docData.consultationFee} 
                    onChange={e => setDocData({...docData, consultationFee: Number(e.target.value)})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timings / Working Hours</label>
                <input 
                  type="text" 
                  value={docData.timings} 
                  onChange={e => setDocData({...docData, timings: e.target.value})} 
                  placeholder="e.g. Mon-Fri 10:00 AM - 04:00 PM" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setDocData({...docData, photoFile: e.target.files?.[0] || null})}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700" 
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddDoctorOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {saveMessage}
                    </>
                  ) : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LABORATORY */}
      {isAddLabOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button 
              onClick={() => setIsAddLabOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">
              <TestTube className="w-6 h-6 text-purple-600" /> Add Laboratory Facility
            </h2>
            <p className="text-slate-500 text-sm mb-6">Add diagnostic laboratory services connected to {myClinic.clinicName}.</p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{errorMsg}</div>
            )}

            <form onSubmit={handleAddLabSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Laboratory Name *</label>
                <input 
                  type="text" 
                  value={labData.name} 
                  onChange={e => setLabData({...labData, name: e.target.value})} 
                  placeholder="e.g. CarePath Diagnostics" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <input 
                  type="text" 
                  value={labData.description} 
                  onChange={e => setLabData({...labData, description: e.target.value})} 
                  placeholder="e.g. Automated Blood Analyzer & Pathology Lab" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Available Tests (Comma Separated)</label>
                <textarea 
                  value={labData.tests} 
                  onChange={e => setLabData({...labData, tests: e.target.value})} 
                  placeholder="Full Body Checkup, CBC, Sugar, Thyroid Profile, Lipid Profile" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lab Phone</label>
                  <input 
                    type="tel" 
                    value={labData.phone} 
                    onChange={e => setLabData({...labData, phone: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Timings</label>
                  <input 
                    type="text" 
                    value={labData.timings} 
                    onChange={e => setLabData({...labData, timings: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddLabOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : 'Add Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
