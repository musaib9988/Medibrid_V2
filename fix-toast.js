import fs from 'fs';

const toastComponent = `import React from 'react';
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
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-md bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-2xl p-4 shadow-2xl shadow-teal-900/20 border border-teal-400/30 flex items-start gap-3 backdrop-blur-md"
        >
          <div className="bg-white/20 text-white p-2.5 rounded-xl shrink-0 mt-0.5 shadow-inner border border-white/20">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white truncate drop-shadow-sm">{notification.title}</h4>
            <p className="text-xs text-teal-50 mt-0.5 leading-snug line-clamp-2 drop-shadow-sm">{notification.body}</p>
          </div>
          <button
            onClick={onClose}
            className="text-teal-100 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
`;

fs.writeFileSync('src/components/NotificationToast.tsx', toastComponent);

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<meta name="theme-color" content="#ffffff" />', '<meta name="theme-color" content="#0d9488" />');
fs.writeFileSync('index.html', html);
