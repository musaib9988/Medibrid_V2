import React, { useState } from 'react';
import { useApp, safeGetDoc } from '../context/AppContext';
import { 
  MapPin, Star, Stethoscope, TestTube, ArrowLeft, Clock, Activity, Building2, 
  MessageSquare, Calendar, CheckCircle2, X, User, Phone, FileText, ChevronRight, QrCode, Users
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LocationMap } from './LocationMap';
import { Doctor } from '../types';

export const ClinicProfileView: React.FC = () => {
  const { 
    selectedClinic, setSelectedClinic, clinics, doctors, laboratories, appointments, userProfile, 
    firebaseUser, setPatientTab, setActiveChatId, openAuthModal, createBooking 
  } = useApp();

  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Derive liveClinic to reactively listen to real-time Firestore queue updates
  const liveClinic = (clinics || []).find(c => c.id === selectedClinic?.id) || selectedClinic;

  // Booking Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');
  const [patientName, setPatientName] = useState(userProfile?.name || firebaseUser?.displayName || '');
  const [patientPhone, setPatientPhone] = useState(userProfile?.phone || '');
  const [symptoms, setSymptoms] = useState('');
  const [selectedService, setSelectedService] = useState('OPD Consultation');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  if (!liveClinic) return null;

  const clinicDoctors = doctors.filter(d => d.clinicId === liveClinic.id);
  const clinicLabs = laboratories.filter(l => l.clinicId === liveClinic.id);

  const handleStartChat = async () => {
    if (!firebaseUser) {
      openAuthModal('user');
      return;
    }
    setIsStartingChat(true);
    try {
      const chatId = `${firebaseUser.uid}_${liveClinic.id}`;
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await safeGetDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          patientId: firebaseUser.uid,
          patientName: userProfile?.name || firebaseUser.displayName || 'Patient',
          clinicId: liveClinic.id,
          clinicName: liveClinic.clinicName,
          lastMessage: 'Chat started',
          lastMessageTime: new Date().toISOString(),
          participants: [firebaseUser.uid, liveClinic.ownerId],
          readBy: [firebaseUser.uid]
        });
      }
      
      setActiveChatId(chatId);
      setSelectedClinic(null);
      setPatientTab('messages');
    } catch (e) {
      console.error("Error starting chat:", e);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleOpenBooking = (docItem?: Doctor) => {
    setSelectedDoctor(docItem || (clinicDoctors.length > 0 ? clinicDoctors[0] : null));
    setPatientName(userProfile?.name || firebaseUser?.displayName || '');
    setPatientPhone(userProfile?.phone || '');
    setBookingError('');
    setBookingSuccess(null);
    setIsBookingModalOpen(true);
  };

  const timeSlots = [
    '09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM',
    '02:00 PM', '02:45 PM', '03:30 PM', '04:15 PM', '05:00 PM', '06:00 PM'
  ];

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!firebaseUser) {
      openAuthModal('user');
      setBookingError('Please sign in or register to complete your appointment booking.');
      return;
    }

    if (!patientName.trim()) {
      setBookingError('Please enter the patient name.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const dateParts = bookingDate.split('-');
      let formattedDate = bookingDate;
      if (dateParts.length === 3) {
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }

      const doctorName = selectedDoctor ? `Dr. ${selectedDoctor.name}` : `${liveClinic.clinicName} OPD`;

      const bookingPayload = {
        clinicId: liveClinic.id,
        doctorId: selectedDoctor?.id || '',
        doctorName: doctorName,
        serviceName: selectedService,
        date: bookingDate,
        formattedDate: formattedDate,
        timeSlot: selectedTimeSlot,
        status: 'confirmed' as const,
        notes: symptoms,
        patientName: patientName || userProfile?.name || firebaseUser?.displayName || 'Patient',
        patientPhone: patientPhone || userProfile?.phone || '',
      };

      const createdApt = await createBooking(bookingPayload);

      setBookingSuccess({
        ...bookingPayload,
        tokenNumber: createdApt?.tokenNumber,
        clinicName: liveClinic.clinicName,
        address: `${liveClinic.address}, ${liveClinic.city}`,
        fee: selectedDoctor?.consultationFee || liveClinic.consultationFee || 400
      });
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setSelectedClinic(null)}
        className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Clinics
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Cover */}
        <div className="h-48 md:h-64 bg-slate-200 w-full relative">
          {liveClinic.coverImageUrl ? (
            <img src={liveClinic.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-teal-500 to-emerald-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        </div>
        
        {/* Header Info */}
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 -mt-12 md:-mt-16 mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm relative z-10">
              {liveClinic.logoUrl ? (
                <img src={liveClinic.logoUrl} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-3xl">
                  {(liveClinic.clinicName || 'C').charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">{liveClinic.clinicName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 text-sm">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {liveClinic.city}, {liveClinic.state}</span>
                <span className="flex items-center text-amber-500 font-bold"><Star className="w-4 h-4 mr-1 fill-current" /> 4.8 Rating</span>
                <span className="flex items-center"><Stethoscope className="w-4 h-4 mr-1" /> {clinicDoctors.length} Doctors</span>
                <span className="flex items-center"><TestTube className="w-4 h-4 mr-1" /> {clinicLabs.length} Labs</span>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-bold w-fit shadow-sm">
                <Users className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>OPD Queue: {liveClinic.waitingPatients || 0} Patients Currently Waiting</span>
              </div>
            </div>
            <div className="pb-2 w-full md:w-auto flex flex-col md:flex-row gap-3">
              <button 
                onClick={handleStartChat}
                disabled={isStartingChat}
                className="w-full md:w-auto bg-white text-teal-600 border border-teal-200 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 shadow-sm flex justify-center items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                {isStartingChat ? 'Opening...' : 'App Chat'}
              </button>

              <button 
                onClick={() => handleOpenBooking()}
                className="w-full md:w-auto bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
            </div>
          </div>

          {/* Real-time Waitlist Widget */}
          {(() => {
            const myClinicAppointment = firebaseUser ? appointments.find(a => a.clinicId === liveClinic.id && a.patientId === firebaseUser.uid && a.status !== 'cancelled') : null;
            return (
              <div className="mb-8 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-5 md:p-6 text-white border border-teal-700/60 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-[10px] text-teal-300 font-extrabold uppercase tracking-widest">Live OPD Tracking</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">Real-Time Waitlist</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">OPD Waiting Queue Status</h3>
                    <p className="text-xs text-teal-100/80">Current OPD patient queue updated live by clinic desk staff.</p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 w-full md:w-auto justify-around md:justify-start">
                    <div className="text-center px-3 border-r border-white/10">
                      <p className="text-2xl font-black text-amber-300">{liveClinic.waitingPatients || 0}</p>
                      <p className="text-[10px] text-teal-200 font-bold uppercase">Waiting Now</p>
                    </div>
                    <div className="text-center px-3 border-r border-white/10">
                      <p className="text-2xl font-black text-emerald-300">~{(liveClinic.waitingPatients || 0) * 10}m</p>
                      <p className="text-[10px] text-teal-200 font-bold uppercase">Est. Wait</p>
                    </div>
                    <div className="text-center px-3">
                      <p className="text-2xl font-black text-teal-200">#{(liveClinic.waitingPatients || 0) + 1}</p>
                      <p className="text-[10px] text-teal-200 font-bold uppercase">Next Token</p>
                    </div>
                  </div>
                </div>

                {/* User's Booked Token Info if applicable */}
                {myClinicAppointment ? (
                  <div className="mt-4 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-500/40">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 text-slate-950 text-base font-black px-3 py-1.5 rounded-xl shadow-sm">
                        Token #{myClinicAppointment.tokenNumber || '—'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Your Confirmed Token for {myClinicAppointment.doctorName || 'OPD'}</p>
                        <p className="text-[11px] text-emerald-200 mt-0.5">
                          {myClinicAppointment.formattedDate || 'Today'} • {myClinicAppointment.timeSlot} • Status: <span className="uppercase font-bold text-emerald-300">{myClinicAppointment.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-lg text-[11px] text-teal-100 font-bold">
                      {Math.max(0, (liveClinic.waitingPatients || 0))} Patients Currently Waiting
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="text-xs text-teal-200 font-medium">Want to skip waiting line? Book online to receive an instant OPD Token.</p>
                    <button 
                      onClick={() => handleOpenBooking()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap"
                    >
                      Get Token #{(liveClinic.waitingPatients || 0) + 1}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Building2 className="text-teal-600" /> About Clinic</h2>
                <p className="text-slate-600 leading-relaxed">
                  {liveClinic.about || liveClinic.description || "No description provided."}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-teal-600" /> Services</h2>
                <div className="flex flex-wrap gap-2">
                  {liveClinic.services?.length > 0 ? (
                    liveClinic.services.map(s => (
                      <span key={s} className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-sm">No services listed</span>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Stethoscope className="text-teal-600" /> Doctors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinicDoctors.length > 0 ? clinicDoctors.map(doc => (
                    <div key={doc.id} className="border border-slate-200 rounded-2xl p-4 flex gap-4 items-center justify-between bg-slate-50/50 hover:bg-white hover:border-teal-200 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0 overflow-hidden border border-slate-300">
                          {doc.photoUrl ? (
                            <img src={doc.photoUrl} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                              {(doc.name || 'D').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                          <p className="text-xs text-teal-600 font-medium">{doc.specialization}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Fee: ₹{doc.consultationFee || 400}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleOpenBooking(doc)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shrink-0 shadow-sm"
                      >
                        Book Slot
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No doctors added yet.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><TestTube className="text-teal-600" /> Laboratories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clinicLabs.length > 0 ? clinicLabs.map(lab => (
                    <div key={lab.id} className="border border-slate-200 rounded-xl p-4">
                      <h4 className="font-bold text-slate-800">{lab.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{lab.description}</p>
                    </div>
                  )) : (
                    <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No laboratories added yet.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-teal-600" /> Working Hours</h3>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const hours = liveClinic.workingHours?.[day];
                    return (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium">{day}</span>
                        <span className="text-slate-800 font-bold">
                          {hours?.isOpen ? `${hours.openTime} - ${hours.closeTime}` : <span className="text-slate-400 italic">Closed</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="text-teal-600" /> Location</h3>
                <p className="text-sm text-slate-600 mb-2">{liveClinic.address}</p>
                <p className="text-sm text-slate-600 mb-4">{liveClinic.locality && `${liveClinic.locality}, `}{liveClinic.city}, {liveClinic.state} {liveClinic.pinCode}</p>
                <div className="w-full h-48 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-200">
                  <LocationMap 
                    providerName={liveClinic.clinicName}
                    address={`${liveClinic.address}, ${liveClinic.city}`}
                    districtName={liveClinic.district || liveClinic.city || 'Srinagar'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: BOOK APPOINTMENT */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              /* SUCCESS STATE */
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Appointment Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-1">Your slot has been reserved successfully.</p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-5 rounded-2xl text-left space-y-3 relative overflow-hidden border border-teal-800/50 shadow-lg">
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Patient Ticket</p>
                        {bookingSuccess.tokenNumber && (
                          <span className="bg-emerald-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            Token #{bookingSuccess.tokenNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white">{bookingSuccess.doctorName}</h4>
                      <p className="text-xs text-teal-100">{bookingSuccess.clinicName}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                      <QrCode className="w-6 h-6 text-teal-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date & Time</span>
                      <strong className="text-white">{bookingSuccess.formattedDate}</strong>
                      <p className="text-teal-200 font-bold">{bookingSuccess.timeSlot}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Patient</span>
                      <strong className="text-white">{bookingSuccess.patientName || 'Patient'}</strong>
                      <p className="text-slate-300">{bookingSuccess.patientPhone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Consultation Fee</span>
                    <strong className="text-emerald-400 font-black text-sm">₹{bookingSuccess.fee} (Pay at Clinic)</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setSelectedClinic(null);
                      setPatientTab('appointments');
                    }}
                    className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    View My Appointments
                  </button>
                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="w-full bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* FORM STATE */
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Book Appointment</h3>
                    <p className="text-xs text-slate-500">{selectedClinic.clinicName}</p>
                  </div>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  {/* Select Doctor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Doctor / Specialist</label>
                    <select
                      value={selectedDoctor?.id || 'general'}
                      onChange={e => {
                        const d = clinicDoctors.find(docItem => docItem.id === e.target.value);
                        setSelectedDoctor(d || null);
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="general">🏥 General Clinic Consultation (Any Available Doctor)</option>
                      {clinicDoctors.map(docItem => (
                        <option key={docItem.id} value={docItem.id}>
                          👨‍⚕️ Dr. {docItem.name} ({docItem.specialization}) - ₹{docItem.consultationFee || 400}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                      <input 
                        type="date"
                        min={todayStr}
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Service Type</label>
                      <select
                        value={selectedService}
                        onChange={e => setSelectedService(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option>OPD Consultation</option>
                        <option>General Checkup</option>
                        <option>Follow-up Visit</option>
                        <option>Diagnostic Review</option>
                      </select>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Time Slot</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {timeSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border ${
                            selectedTimeSlot === slot 
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-teal-700">Patient Details</h4>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Patient Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          value={patientName}
                          onChange={e => setPatientName(e.target.value)}
                          placeholder="Full name of patient"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Contact Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="tel"
                          value={patientPhone}
                          onChange={e => setPatientPhone(e.target.value)}
                          placeholder="+91 94190 00000"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Symptoms / Notes (Optional)</label>
                      <textarea
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                        placeholder="e.g. Fever, joint pain, cough for 2 days..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs h-16"
                      />
                    </div>
                  </div>

                  {/* Fee Footer */}
                  <div className="bg-teal-50/80 border border-teal-100 rounded-2xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-500 text-[10px]">Consultation Fee</p>
                      <strong className="text-teal-900 text-sm font-black">
                        ₹{selectedDoctor?.consultationFee || selectedClinic.consultationFee || 400}
                      </strong>
                    </div>
                    <span className="text-[10px] text-teal-700 bg-white px-2 py-1 rounded-lg border border-teal-200 font-bold">
                      Pay at Clinic
                    </span>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmittingBooking ? 'Confirming Slot...' : 'Confirm & Book Slot'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
