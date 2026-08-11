import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Star, Stethoscope, TestTube, ArrowLeft, Clock, Activity, Building2, MessageSquare } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LocationMap } from './LocationMap';

export const ClinicProfileView: React.FC = () => {
  const { selectedClinic, setSelectedClinic, doctors, laboratories, userProfile, setPatientTab, setActiveChatId, openAuthModal, startGoogleChat } = useApp();
  const [isStartingChat, setIsStartingChat] = useState(false);

  if (!selectedClinic) return null;

  const handleStartChat = async () => {
    if (!userProfile) {
      openAuthModal('user');
      return;
    }
    setIsStartingChat(true);
    try {
      // Create a unique chat ID based on patient and clinic
      const chatId = `${userProfile.uid}_${selectedClinic.id}`;
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          patientId: userProfile.uid,
          patientName: userProfile.name,
          clinicId: selectedClinic.id,
          clinicName: selectedClinic.clinicName,
          lastMessage: 'Chat started',
          lastMessageTime: new Date().toISOString(),
          participants: [userProfile.uid, selectedClinic.ownerId],
          readBy: [userProfile.uid]
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

  const clinicDoctors = doctors.filter(d => d.clinicId === selectedClinic.id);
  const clinicLabs = laboratories.filter(l => l.clinicId === selectedClinic.id);

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
          {selectedClinic.coverImageUrl ? (
            <img src={selectedClinic.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-teal-500 to-emerald-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        </div>
        
        {/* Header Info */}
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 -mt-12 md:-mt-16 mb-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm relative z-10">
              {selectedClinic.logoUrl ? (
                <img src={selectedClinic.logoUrl} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-3xl">
                  {selectedClinic.clinicName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-800">{selectedClinic.clinicName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 text-sm">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {selectedClinic.city}, {selectedClinic.state}</span>
                <span className="flex items-center text-amber-500 font-bold"><Star className="w-4 h-4 mr-1 fill-current" /> 4.8 Rating</span>
                <span className="flex items-center"><Stethoscope className="w-4 h-4 mr-1" /> {clinicDoctors.length} Doctors</span>
                <span className="flex items-center"><TestTube className="w-4 h-4 mr-1" /> {clinicLabs.length} Labs</span>
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
                onClick={() => {
                  if (!userProfile) {
                    openAuthModal('user');
                    return;
                  }
                  startGoogleChat(selectedClinic.email, selectedClinic.clinicName);
                }}
                className="w-full md:w-auto bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 shadow-sm flex justify-center items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Google Chat
              </button>

              <button className="w-full md:w-auto bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-md">
                Book Appointment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2"><Building2 className="text-teal-600" /> About Clinic</h2>
                <p className="text-slate-600 leading-relaxed">
                  {selectedClinic.about || selectedClinic.description || "No description provided."}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-teal-600" /> Services</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedClinic.services?.length > 0 ? (
                    selectedClinic.services.map(s => (
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
                    <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex-shrink-0">
                        {doc.photoUrl && <img src={doc.photoUrl} alt={doc.name} className="w-full h-full rounded-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{doc.name}</h4>
                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                      </div>
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
                    const hours = selectedClinic.workingHours?.[day];
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
                <p className="text-sm text-slate-600 mb-2">{selectedClinic.address}</p>
                <p className="text-sm text-slate-600 mb-4">{selectedClinic.locality && `${selectedClinic.locality}, `}{selectedClinic.city}, {selectedClinic.state} {selectedClinic.pinCode}</p>
                <div className="w-full h-48 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-200">
                  <LocationMap 
                    providerName={selectedClinic.clinicName}
                    address={`${selectedClinic.address}, ${selectedClinic.city}`}
                    districtName={selectedClinic.district || selectedClinic.city || 'Srinagar'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
