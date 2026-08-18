import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastProps {
  notification: { id: string; title: string; body: string } | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  // Auto-dismiss to mimic native behavior
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[95vw] max-w-[400px] bg-white/75 backdrop-blur-[32px] text-slate-900 rounded-[28px] p-4 shadow-[0_16px_40px_rgb(0,0,0,0.15)] border border-white/60 flex flex-col gap-1 overflow-hidden cursor-pointer active:scale-95 transition-transform"
          onClick={onClose}
        >
          {/* Native Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
                <img src="/logo.webp" onError={(e) => (e.currentTarget.src = '/icon-192.svg')} className="w-full h-full object-contain" alt="App" />
              </div>
              <span className="text-[12px] font-semibold text-slate-600 tracking-wide">MEDIBRID</span>
            </div>
            <span className="text-[12px] text-slate-400 font-medium">now</span>
          </div>

          {/* Native Content */}
          <div className="pl-1 mt-0.5">
            <h4 className="font-bold text-[15px] text-slate-900 leading-tight tracking-tight">{notification.title}</h4>
            <p className="text-[13px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{notification.body}</p>
          </div>
          
          {/* Subtle drag indicator */}
          <div className="w-10 h-1 bg-slate-300/80 rounded-full mx-auto mt-2 mb-[-6px]"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
