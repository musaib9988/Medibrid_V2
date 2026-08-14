import fs from 'fs';

// 1. Capture prompt globally in index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('window.deferredPWAInstallPrompt')) {
  const scriptToAdd = `
    <script>
      window.deferredPWAInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPWAInstallPrompt = e;
        // Dispatch custom event so React can pick it up immediately
        window.dispatchEvent(new Event('pwa-prompt-ready'));
      });
    </script>
  </head>`;
  html = html.replace('</head>', scriptToAdd);
  fs.writeFileSync('index.html', html);
}

// 2. Update InstallPWA.tsx to use the global prompt
const pwaComponent = `import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      if ((window as any).deferredPWAInstallPrompt) {
        setDeferredPrompt((window as any).deferredPWAInstallPrompt);
        setIsVisible(true);
      }
    };

    // Check immediately in case it already fired
    checkPrompt();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const readyHandler = () => {
      checkPrompt();
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-ready', readyHandler);
    
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-ready', readyHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or unsupported browsers: just give instructions
      alert("Tap the Share button in your browser and select 'Add to Home Screen' to install.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
    (window as any).deferredPWAInstallPrompt = null;
  };

  if (!isVisible) {
    // If we can't detect it automatically, let's at least show a manual button on mobile 
    // to give iOS instructions or act as a manual trigger
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/30 flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex flex-col">
          <h4 className="font-bold text-sm text-white">Install App</h4>
          <p className="text-xs text-slate-300 mt-0.5">Add to Home Screen</p>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Install
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-teal-500/30 flex items-center justify-between gap-3 backdrop-blur-md">
      <div className="flex flex-col">
        <h4 className="font-bold text-sm text-white">Install MediBridge</h4>
        <p className="text-xs text-slate-300 mt-0.5">Add to home screen for native experience & notifications</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleInstallClick}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Install
        </button>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/InstallPWA.tsx', pwaComponent);
