import React from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastProps {
  notification: { id: string; title: string; body: string } | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/30 flex items-start gap-3 backdrop-blur-md"
        >
          <div className="bg-teal-500/20 text-teal-400 p-2.5 rounded-xl shrink-0 mt-0.5 border border-teal-500/30">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{notification.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug line-clamp-2">{notification.body}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
