import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Calendar, 
  Building2, 
  Pill, 
  Sparkles, 
  CheckCircle2, 
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { NotificationPreferences as INotificationPreferences } from '../types';

export const NotificationPreferences: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { userProfile, updateProfile, requestPermissions, firebaseUser } = useApp();

  const currentPrefs: INotificationPreferences = {
    appointmentReminders: userProfile?.notificationPreferences?.appointmentReminders ?? true,
    clinicUpdates: userProfile?.notificationPreferences?.clinicUpdates ?? true,
    medicineAlerts: userProfile?.notificationPreferences?.medicineAlerts ?? true,
    healthAnnouncements: userProfile?.notificationPreferences?.healthAnnouncements ?? false,
  };

  const [prefs, setPrefs] = useState<INotificationPreferences>(currentPrefs);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check device permission state
  const isBrowserNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permissionStatus = isBrowserNotificationSupported ? Notification.permission : 'unsupported';

  const handleToggle = async (key: keyof INotificationPreferences) => {
    const updated = {
      ...prefs,
      [key]: !prefs[key],
    };
    setPrefs(updated);
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (firebaseUser) {
        await updateProfile({
          notificationPreferences: updated,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableSystemNotifications = async () => {
    try {
      await requestPermissions(true);
    } catch (e) {
      console.warn("Could not request notification permissions:", e);
    }
  };

  return (
    <div className="space-y-5">
      {/* Device Push Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
        permissionStatus === 'granted' 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
          : permissionStatus === 'denied'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-teal-50/80 border-teal-200 text-teal-900'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          permissionStatus === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'
        }`}>
          {permissionStatus === 'granted' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Smartphone className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">
              {permissionStatus === 'granted' 
                ? 'Device Push Alerts Active' 
                : permissionStatus === 'denied'
                  ? 'Browser Alerts Blocked'
                  : 'Enable Push Notifications'}
            </h4>
            {permissionStatus === 'granted' && (
              <span className="text-[10px] font-extrabold uppercase bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full">
                Enabled
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            {permissionStatus === 'granted'
              ? 'Your device is verified to receive instant OPD token calls and real-time medical updates.'
              : permissionStatus === 'denied'
                ? 'Notifications are blocked in your browser/app settings. Please allow notifications in site settings to receive live alerts.'
                : 'Turn on system push alerts so you never miss an OPD token or doctor schedule change.'}
          </p>
          {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
            <button
              onClick={handleEnableSystemNotifications}
              className="mt-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              Allow Device Notifications
            </button>
          )}
        </div>
      </div>

      {/* Preferences Header & Status */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Alert Categories</h3>
          <p className="text-xs text-slate-500">Choose which updates you want to receive</p>
        </div>
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-in fade-in flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      {/* Preference Toggles List */}
      <div className="space-y-3">
        {/* Appointment Reminders */}
        <div 
          onClick={() => handleToggle('appointmentReminders')}
          className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Appointment Reminders</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Real-time OPD token call-ins, queue rank alerts, and estimated consultation timings.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.appointmentReminders}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              prefs.appointmentReminders ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Clinic & OPD Updates */}
        <div 
          onClick={() => handleToggle('clinicUpdates')}
          className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Clinic & OPD Updates</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Doctor availability shifts, emergency clinic notices, and schedule updates in your district.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.clinicUpdates}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              prefs.clinicUpdates ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Medicine & Prescription Alerts */}
        <div 
          onClick={() => handleToggle('medicineAlerts')}
          className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Medicine & Prescription Alerts</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Prescription upload verifications, pharmacy order dispatch, and dosage reminders.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.medicineAlerts}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              prefs.medicineAlerts ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Health Advisories & Announcements */}
        <div 
          onClick={() => handleToggle('healthAnnouncements')}
          className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer group select-none"
        >
          <div className="flex items-start gap-3.5 pr-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Health Bulletins & Camps</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Seasonal health advisories, vaccination drives, and free medical camps across Jammu & Kashmir.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.healthAnnouncements}
            className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              prefs.healthAnnouncements ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* Security and Cloud Sync Footer */}
      <div className="bg-slate-100/80 rounded-2xl p-3.5 flex items-center gap-2.5 text-slate-600 text-xs">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          Preferences are automatically synced with your secure MediBrid cloud profile.
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full bg-[#2D8C7C] hover:bg-teal-700 text-white py-3 rounded-full font-bold shadow-md transition-colors text-sm"
        >
          Done
        </button>
      )}
    </div>
  );
};
