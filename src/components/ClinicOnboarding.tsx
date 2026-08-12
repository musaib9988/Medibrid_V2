import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { uploadFileWithFallback } from '../utils/imageCompressor';
import { Building2, MapPin, Clock, Stethoscope, Users, TestTube, ShieldCheck, UploadCloud, ChevronRight, ChevronLeft, Check, Plus, Trash2, X } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ClinicOnboarding: React.FC = () => {
  const { firebaseUser } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for clinic data
  const [clinicData, setClinicData] = useState({
    clinicName: '',
    description: '',
    about: '',
    clinicType: 'General Clinic',
    logoFile: null as File | null,
    coverFile: null as File | null,
    logoUrl: '',
    coverUrl: '',
    address: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    phone: '',
    email: '',
    whatsapp: '',
    workingHours: DAYS.reduce((acc, day) => {
      acc[day] = { isOpen: true, openTime: '09:00', closeTime: '17:00' };
      return acc;
    }, {} as Record<string, any>),
    emergencyAvailable: false,
    services: [] as string[],
    newService: '',
    verificationDocs: [] as File[]
  });

  const handleUploadImage = async (file: File, path: string) => {
    return await uploadFileWithFallback(file, path);
  };

  const submitClinicData = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      let logoUrl = '';
      let coverImageUrl = '';
      
      if (clinicData.logoFile) {
        logoUrl = await handleUploadImage(clinicData.logoFile, `clinics/${firebaseUser.uid}/logo_${Date.now()}`);
      }
      if (clinicData.coverFile) {
        coverImageUrl = await handleUploadImage(clinicData.coverFile, `clinics/${firebaseUser.uid}/cover_${Date.now()}`);
      }

      const docUrls = [];
      for (const file of clinicData.verificationDocs) {
        const url = await handleUploadImage(file, `clinics/${firebaseUser.uid}/docs/${file.name}_${Date.now()}`);
        docUrls.push(url);
      }

      const newClinic = {
        ownerId: firebaseUser.uid,
        clinicName: clinicData.clinicName,
        logoUrl,
        coverImageUrl,
        description: clinicData.description,
        about: clinicData.about,
        clinicType: clinicData.clinicType,
        phone: clinicData.phone,
        email: clinicData.email,
        whatsapp: clinicData.whatsapp,
        address: clinicData.address,
        locality: clinicData.locality,
        city: clinicData.city,
        district: clinicData.district,
        state: clinicData.state,
        pinCode: clinicData.pinCode,
        workingHours: clinicData.workingHours,
        emergencyAvailable: clinicData.emergencyAvailable,
        services: clinicData.services,
        specializations: [],
        status: 'pending',
        verified: false,
        verificationDocs: docUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'clinics'), newClinic);
      
      // Update local state to step 8 (success preview)
      setStep(8);
    } catch (err: any) {
      setError(err.message || 'Failed to save clinic data');
    }
    setLoading(false);
  };

  if (step === 8) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Your Clinic Profile Is Ready!</h2>
        <p className="text-slate-600 mb-6">Your clinic has been registered and is pending verification. You can now access your dashboard.</p>
        
        <button onClick={() => window.location.reload()} className="bg-teal-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-teal-700 shadow-lg">
          Go to Clinic Dashboard
        </button>
      </div>
    );
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-800">Set Up Your Clinic</h1>
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className={`flex-shrink-0 flex items-center ${s !== 1 ? 'ml-2' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === s ? 'bg-teal-600 text-white' : 
                step > s ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s !== 7 && <div className={`w-8 h-1 ml-2 rounded-full ${step > s ? 'bg-teal-200' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}

        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 className="text-teal-600"/> Tell Us About Your Clinic</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Clinic Name *</label>
              <input type="text" value={clinicData.clinicName} onChange={e => setClinicData({...clinicData, clinicName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" placeholder="e.g. HealthCare Plus" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clinic Type</label>
                <select value={clinicData.clinicType} onChange={e => setClinicData({...clinicData, clinicType: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <option>General Clinic</option>
                  <option>Multi-Specialty Clinic</option>
                  <option>Specialty Clinic</option>
                  <option>Diagnostic Center</option>
                  <option>Healthcare Center</option>
                  <option>Hospital</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Short Description</label>
                <input type="text" value={clinicData.description} onChange={e => setClinicData({...clinicData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. Best care in city" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">About Clinic</label>
              <textarea value={clinicData.about} onChange={e => setClinicData({...clinicData, about: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24" placeholder="Detailed description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clinic Logo</label>
                <input type="file" accept="image/*" onChange={e => setClinicData({...clinicData, logoFile: e.target.files?.[0] || null})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={e => setClinicData({...clinicData, coverFile: e.target.files?.[0] || null})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="text-teal-600"/> Where Is Your Clinic Located?</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Address *</label>
              <input type="text" value={clinicData.address} onChange={e => setClinicData({...clinicData, address: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Street address" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Area / Locality</label><input type="text" value={clinicData.locality} onChange={e => setClinicData({...clinicData, locality: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">City *</label><input type="text" value={clinicData.city} onChange={e => setClinicData({...clinicData, city: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">District *</label><input type="text" value={clinicData.district} onChange={e => setClinicData({...clinicData, district: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">State *</label><input type="text" value={clinicData.state} onChange={e => setClinicData({...clinicData, state: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required /></div>
              <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">PIN Code *</label><input type="text" value={clinicData.pinCode} onChange={e => setClinicData({...clinicData, pinCode: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Clinic Phone *</label><input type="tel" value={clinicData.phone} onChange={e => setClinicData({...clinicData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Clinic Email</label><input type="email" value={clinicData.email} onChange={e => setClinicData({...clinicData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Number</label><input type="tel" value={clinicData.whatsapp} onChange={e => setClinicData({...clinicData, whatsapp: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-teal-600"/> When Is Your Clinic Open?</h2>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Emergency Services</h4>
                <p className="text-xs text-amber-700 mt-0.5">Are emergency services available 24/7?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={clinicData.emergencyAvailable} onChange={e => setClinicData({...clinicData, emergencyAvailable: e.target.checked})} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                  <div className="flex items-center gap-3 w-1/3">
                    <input type="checkbox" checked={clinicData.workingHours[day].isOpen} onChange={e => setClinicData({
                      ...clinicData, 
                      workingHours: {...clinicData.workingHours, [day]: {...clinicData.workingHours[day], isOpen: e.target.checked}}
                    })} className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" />
                    <span className="font-bold text-slate-700 text-sm">{day}</span>
                  </div>
                  {clinicData.workingHours[day].isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={clinicData.workingHours[day].openTime} onChange={e => setClinicData({
                        ...clinicData, 
                        workingHours: {...clinicData.workingHours, [day]: {...clinicData.workingHours[day], openTime: e.target.value}}
                      })} className="p-2 border border-slate-200 rounded-lg text-sm bg-white" />
                      <span className="text-slate-400 text-sm">to</span>
                      <input type="time" value={clinicData.workingHours[day].closeTime} onChange={e => setClinicData({
                        ...clinicData, 
                        workingHours: {...clinicData.workingHours, [day]: {...clinicData.workingHours[day], closeTime: e.target.value}}
                      })} className="p-2 border border-slate-200 rounded-lg text-sm bg-white" />
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm italic font-medium flex-1 px-2">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><TestTube className="text-teal-600"/> What Services Does Your Clinic Provide?</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {['General Consultation', 'Specialist Consultation', 'Health Checkup', 'Vaccination', 'Diagnostic Tests', 'Blood Tests', 'Home Sample Collection', 'Teleconsultation', 'Emergency Care'].map(service => (
                <button 
                  key={service}
                  onClick={() => {
                    const services = clinicData.services.includes(service)
                      ? clinicData.services.filter(s => s !== service)
                      : [...clinicData.services, service];
                    setClinicData({...clinicData, services});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                    clinicData.services.includes(service) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={clinicData.newService} 
                onChange={e => setClinicData({...clinicData, newService: e.target.value})} 
                placeholder="Add custom service..." 
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                onKeyDown={e => {
                  if (e.key === 'Enter' && clinicData.newService.trim()) {
                    setClinicData({
                      ...clinicData, 
                      services: [...clinicData.services, clinicData.newService.trim()],
                      newService: ''
                    });
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (clinicData.newService.trim()) {
                    setClinicData({
                      ...clinicData, 
                      services: [...clinicData.services, clinicData.newService.trim()],
                      newService: ''
                    });
                  }
                }}
                className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 flex items-center justify-center px-6 font-bold"
              >
                Add
              </button>
            </div>
            
            {clinicData.services.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Selected Services</h4>
                <div className="flex flex-wrap gap-2">
                  {clinicData.services.map(s => (
                    <span key={s} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 border border-teal-100">
                      {s}
                      <X className="w-3 h-3 cursor-pointer hover:text-teal-900" onClick={() => setClinicData({...clinicData, services: clinicData.services.filter(serv => serv !== s)})} />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5 animate-in fade-in text-center py-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Add Your Doctors</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">You can add multiple doctors to your clinic now or add them later from your Clinic Dashboard.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => alert('Doctor management will be handled in the Dashboard after onboarding.')} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Doctor
              </button>
              <button onClick={nextStep} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200">
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5 animate-in fade-in text-center py-8">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TestTube className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Add Your Laboratories</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">You can add multiple laboratories connected with your clinic now or add them later.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => alert('Laboratory management will be handled in the Dashboard after onboarding.')} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Laboratory
              </button>
              <button onClick={nextStep} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200">
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="text-teal-600"/> Verify Your Clinic</h2>
            <p className="text-slate-600 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              Verification helps patients identify trusted healthcare providers on MediBrid. Upload your registration certificate or other valid documents.
            </p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <label className="block text-sm font-bold text-teal-600 cursor-pointer hover:underline mb-1">
                Click to upload documents
                <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={e => {
                  if (e.target.files) {
                    setClinicData({...clinicData, verificationDocs: [...clinicData.verificationDocs, ...Array.from(e.target.files)]})
                  }
                }} />
              </label>
              <p className="text-xs text-slate-500">Supported formats: PDF, JPG, PNG.</p>
            </div>

            {clinicData.verificationDocs.length > 0 && (
              <div className="mt-4 space-y-2">
                {clinicData.verificationDocs.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                    <button onClick={() => setClinicData({...clinicData, verificationDocs: clinicData.verificationDocs.filter((_, i) => i !== idx)})} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <div className="bg-white p-6 border-t border-slate-200 flex items-center justify-between">
        <button 
          onClick={prevStep} 
          disabled={step === 1}
          className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-colors ${step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        
        {step < 7 ? (
          <button 
            onClick={nextStep}
            disabled={step === 1 && !clinicData.clinicName}
            className="flex items-center gap-2 bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 shadow-sm disabled:opacity-50"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={submitClinicData}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Complete Registration'} <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
