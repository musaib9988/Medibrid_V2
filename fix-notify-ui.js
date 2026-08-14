import fs from 'fs';

const patientHomePath = 'src/components/PatientHome.tsx';
let content = fs.readFileSync(patientHomePath, 'utf8');

const notifyComponent = `
      {/* Test OS Notification Banner */}
      <div className="mx-4 mt-6 p-4 bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl shadow-lg border border-teal-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm">System Push Notifications</h3>
          <p className="text-xs text-teal-50 mt-1">Receive background updates even when the app is closed.</p>
        </div>
        <button 
          onClick={async () => {
            let perm = Notification.permission;
            if (perm === 'default') {
              perm = await Notification.requestPermission();
            }
            if (perm === 'granted') {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification("MediBrid Update", {
                    body: "Your medicine has been dispatched! Track your order now.",
                    icon: "/icon-192.svg",
                    badge: "/icon-192.svg",
                    vibrate: [200, 100, 200]
                  });
                });
              }
            } else {
              alert("You have blocked notifications. Please allow them in site settings.");
            }
          }}
          className="bg-white text-teal-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-teal-50 transition-colors whitespace-nowrap"
        >
          Test Push Notification
        </button>
      </div>
`;

if (!content.includes('System Push Notifications')) {
  // Insert it after the welcome banner (which is the first <div className="mx-4 mt-4 ... bg-teal-600">)
  content = content.replace(
    /(<div className="mx-4 mt-4[^>]*bg-teal-600[^>]*>[\s\S]*?<\/div>)/,
    `$1\n${notifyComponent}`
  );
  fs.writeFileSync(patientHomePath, content);
}
