import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500); // 2.5 seconds splash
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-900"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <div className="w-32 h-32 mx-auto bg-white rounded-3xl p-4 shadow-xl mb-6 flex items-center justify-center"><img src="/icon.svg" alt="MediBrid Logo" className="w-full h-full object-contain" /></div>
        <p className="text-sm text-slate-500 font-medium">Your Health Partner across Jammu & Kashmir.</p>
      </motion.div>
    </motion.div>
  );
};
