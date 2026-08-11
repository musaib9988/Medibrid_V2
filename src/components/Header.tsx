import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  const { userProfile } = useApp();
  
  return (
    <header className="flex items-center justify-between w-full bg-white px-4 py-3 rounded-full shadow-sm border border-slate-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
          M
        </div>
        <span className="font-bold text-slate-800 text-lg">MediBrid</span>
      </div>
      
      {userProfile?.city && (
        <div className="flex items-center gap-1 text-slate-500 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span className="truncate max-w-[120px]">{userProfile.district || userProfile.city}</span>
        </div>
      )}
    </header>
  );
};
