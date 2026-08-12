import React from 'react';
import { motion } from 'motion/react';
import { MapPin, ChevronRight, Building2, ExternalLink, Instagram, Compass } from 'lucide-react';

interface UnserviceableLocationViewProps {
  currentDistrict: string;
  pincode?: string;
  liveDistricts: string[];
  onChangeLocationClick: () => void;
  onRegisterClick?: () => void;
}

export const UnserviceableLocationView: React.FC<UnserviceableLocationViewProps> = ({
  currentDistrict,
  pincode = '192303',
  liveDistricts = ['Shopian', 'Srinagar', 'Budgam'],
  onChangeLocationClick,
  onRegisterClick,
}) => {
  const displayLocation = currentDistrict 
    ? `${currentDistrict}${pincode ? ` ${pincode}` : ''}`
    : `Pulwama ${pincode}`;

  const liveDistrictsText = liveDistricts.length > 0 
    ? `${liveDistricts.join(', ')}, J&K (Expanding soon!)`
    : 'Shopian, Srinagar, Budgam, J&K (Expanding soon!)';

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 bg-slate-50 font-sans animate-in fade-in">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        
        {/* Top Location Pin Icon inside Soft Pink Circle */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 shadow-xs relative"
        >
          <div className="w-12 h-12 rounded-full bg-rose-100/80 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-rose-500 fill-rose-500/20" />
          </div>
          <span className="absolute -top-1 -right-1 text-lg">🤩</span>
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-2xl sm:text-3xl font-black text-rose-950 mb-3 tracking-tight"
        >
          Oops! It's not you, it's us 🤩
        </motion.h1>

        {/* Red / Pink Message Subtitle */}
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-rose-800/90 text-sm sm:text-base font-semibold max-w-xs mb-8 leading-relaxed"
        >
          <span className="font-extrabold text-rose-900">MediBrid</span> isn't available in{' '}
          <span className="underline decoration-rose-300 font-bold">{displayLocation}</span> yet. We are actively expanding to new regions.
        </motion.p>

        {/* Service Availability Information Card */}
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm text-center space-y-3 mb-6 relative overflow-hidden"
        >
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            SERVICE AVAILABILITY
          </div>
          
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            To maintain high quality standards, <strong className="text-slate-900 font-bold">MediBrid</strong> launches district-by-district with fully verified clinics & doctors.
          </p>

          <p className="text-xs text-slate-500 font-normal leading-relaxed pt-1">
            If you are a local clinic or doctor in <strong className="text-slate-800 font-semibold">{currentDistrict || 'this area'}</strong>, you can register today to get booked.
          </p>

          {onRegisterClick && (
            <button
              onClick={onRegisterClick}
              className="mt-2 text-xs text-teal-700 font-bold hover:text-teal-800 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register Clinic or Doctor in {currentDistrict || 'Area'}</span>
            </button>
          )}
        </motion.div>

        {/* Option Action Cards */}
        <motion.div 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full space-y-3 mb-10"
        >
          {/* Card 1: Try a different address */}
          <div 
            onClick={onChangeLocationClick}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Try a different address
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Select another supported area
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Card 2: Follow us on Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-xs group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-pink-700 transition-colors">
                  Follow us on Instagram
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Get updates @medibrid.in
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        {/* Footer: WE'RE LIVE IN */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center space-y-1"
        >
          <div className="text-[10px] font-extrabold uppercase text-amber-500 tracking-widest">
            WE'RE LIVE IN
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800">
            {liveDistrictsText}
          </p>
        </motion.div>

      </div>
    </div>
  );
};
