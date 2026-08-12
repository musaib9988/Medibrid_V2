import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, MapPin, Phone, Droplet, User as UserIcon } from 'lucide-react';

export const ProfileEditForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile, updateProfile } = useApp();
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    district: userProfile?.district || '',
    bloodGroup: userProfile?.bloodGroup || '',
    age: userProfile?.age || '',
    gender: userProfile?.gender || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Age</label>
          <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
          <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">District</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input type="text" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">Blood Group</label>
        <div className="relative">
          <Droplet className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input type="text" value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full bg-[#2D8C7C] text-white py-3 rounded-full font-bold shadow-md hover:bg-teal-700 transition-colors mt-4">
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};
