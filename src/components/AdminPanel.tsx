import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './Header';
import { Users, Building2, LayoutDashboard, Image as ImageIcon, Trash2, Plus, Bell, ShieldAlert, Ban, CheckCircle2, LogOut, Grid, CheckCircle } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const AdminPanel: React.FC = () => {
  const { 
    users, clinics, doctors, laboratories, appointments, userProfile, banners, categories,
    updateUserStatus, deleteUser, deleteClinic, sendPushNotification, updateClinic, logoutUser,
    addCategory, deleteCategory
  } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clinics' | 'banners' | 'notifications' | 'categories'>('dashboard');

  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '' });
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // Category state
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Notification state
  const [notifData, setNotifData] = useState({ title: '', body: '', targetRole: 'all' as any });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleAddBanner = async () => {
    if (!newBanner.title || !newBanner.imageUrl) return;
    try {
      const bannerId = Date.now().toString();
      await setDoc(doc(db, 'banners', bannerId), {
        id: bannerId,
        title: newBanner.title,
        imageUrl: newBanner.imageUrl,
        link: newBanner.link,
        active: true,
        createdAt: new Date().toISOString()
      });
      setNewBanner({ title: '', imageUrl: '', link: '' });
      setIsAddingBanner(false);
    } catch (e) {
      console.error('Error adding banner:', e);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      await setDoc(doc(db, 'banners', bannerId), { active: !currentStatus }, { merge: true });
    } catch (e) {
      console.error('Error toggling banner:', e);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
    } catch (e) {
      console.error('Error deleting banner:', e);
    }
  };

  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17) timeGreeting = 'Good evening';

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Admin';

  return (
    <div className="flex flex-col gap-6 w-full">
      <Header />
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'dashboard' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'users' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Registered Users
        </button>
        <button 
          onClick={() => setActiveTab('clinics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'clinics' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Registered Clinics
        </button>
        <button 
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'banners' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'notifications' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          Push Notifications
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'categories' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          Categories
        </button>

        <button 
          onClick={logoutUser}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 ml-auto"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">{timeGreeting}, {firstName}</h1>
                <p className="text-slate-500 text-sm">Platform Overview</p>
              </div>
              <button 
                onClick={logoutUser}
                className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Users</p>
                <p className="text-2xl font-black text-slate-800">{users.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Clinics</p>
                <p className="text-2xl font-black text-slate-800">{clinics.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Doctors</p>
                <p className="text-2xl font-black text-slate-800">{doctors.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Total Labs</p>
                <p className="text-2xl font-black text-slate-800">{laboratories.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold">Appointments</p>
                <p className="text-2xl font-black text-slate-800">{appointments.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-4">Registered Users</h1>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-bold">Name</th>
                    <th className="pb-3 font-bold">Email</th>
                    <th className="pb-3 font-bold">Phone</th>
                    <th className="pb-3 font-bold">Role</th>
                    <th className="pb-3 font-bold">Joined (Time)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map(user => (
                    <tr key={user.uid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          {user.status === 'blocked' && <span className="text-[10px] text-red-500 font-bold uppercase">Blocked</span>}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{user.email}</td>
                      <td className="py-3 text-slate-600">{user.phone || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'clinic_owner' ? 'bg-amber-100 text-amber-700' :
                          'bg-teal-100 text-teal-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
                              try {
                                await updateUserStatus(user.uid, newStatus);
                              } catch (err) {
                                console.error("Failed to update user status:", err);
                              }
                            }}
                            title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                            className={`p-1.5 rounded-lg transition-colors ${user.status === 'blocked' ? 'bg-teal-50 text-teal-600 hover:bg-teal-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                          >
                            {user.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteUser(user.uid);
                              } catch (err) {
                                console.error("Failed to delete user:", err);
                              }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'clinics' && (
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-4">Registered Clinics</h1>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-bold">Clinic Name</th>
                    <th className="pb-3 font-bold">Phone</th>
                    <th className="pb-3 font-bold">City</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Registered (Time)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {clinics.map(clinic => (
                    <tr key={clinic.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">{clinic.clinicName}</td>
                      <td className="py-3 text-slate-600">{clinic.phone}</td>
                      <td className="py-3 text-slate-600">{clinic.city}, {clinic.state}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          clinic.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          clinic.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {clinic.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(clinic.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={async () => {
                              const newVerified = !clinic.verified;
                              try {
                                await updateClinic(clinic.id, { verified: newVerified });
                              } catch (err) {
                                console.error("Failed to update verification:", err);
                              }
                            }}
                            title={clinic.verified ? 'Unverify Clinic' : 'Verify Clinic'}
                            className={`p-1.5 rounded-lg transition-colors ${clinic.verified ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              const newStatus = clinic.status === 'suspended' ? 'active' : 'suspended';
                              try {
                                await updateClinic(clinic.id, { status: newStatus as any });
                              } catch (err) {
                                console.error("Failed to update status:", err);
                              }
                            }}
                            title={clinic.status === 'suspended' ? 'Activate Clinic' : 'Suspend Clinic'}
                            className={`p-1.5 rounded-lg transition-colors ${clinic.status === 'suspended' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                          >
                            {clinic.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteClinic(clinic.id);
                              } catch (err) {
                                console.error("Failed to delete clinic:", err);
                              }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clinics.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No clinics registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-slate-800">Manage Banners</h1>
              <button 
                onClick={() => setIsAddingBanner(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Banner
              </button>
            </div>

            {isAddingBanner && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-lg font-bold text-slate-800 mb-4">New Banner</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Banner Title</label>
                    <input 
                      type="text" 
                      value={newBanner.title} 
                      onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                      placeholder="e.g. Free Health Checkup"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Image URL or Upload</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newBanner.imageUrl} 
                        onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                        placeholder="https://... or choose preset below"
                      />
                      <label className="px-4 py-3 bg-teal-50 text-teal-700 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-teal-100 shrink-0">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewBanner({...newBanner, imageUrl: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Quick Banner Presets (Click to use):</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'General Health', url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80' },
                        { label: 'Lab Tests', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80' },
                        { label: 'Dental Care', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80' },
                        { label: 'Heart & Cardio', url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewBanner({...newBanner, imageUrl: preset.url})}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Link URL (Optional)</label>
                    <input 
                      type="text" 
                      value={newBanner.link} 
                      onChange={e => setNewBanner({...newBanner, link: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddingBanner(false)} className="px-4 py-2 text-slate-600 font-bold">Cancel</button>
                  <button onClick={handleAddBanner} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Save Banner</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map(banner => (
                <div key={banner.id} className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col ${banner.active ? 'border-teal-200' : 'border-slate-200 opacity-70'}`}>
                  <div className="h-40 bg-slate-100 w-full overflow-hidden">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{banner.title}</h3>
                      {banner.link && <a href={banner.link} target="_blank" rel="noreferrer" className="text-teal-600 text-xs hover:underline truncate block mt-1">{banner.link}</a>}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${banner.active ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                        <span className="text-sm font-bold text-slate-600">{banner.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleBanner(banner.id, banner.active)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200">
                          {banner.active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {banners.length === 0 && !isAddingBanner && (
                <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No banners created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Bell className="text-teal-600" /> Send Push Notifications
            </h1>
            
            <div className="max-w-xl bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Notification Title</label>
                  <input 
                    type="text" 
                    value={notifData.title}
                    onChange={e => setNotifData({...notifData, title: e.target.value})}
                    placeholder="e.g. Platform Update"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Message Body</label>
                  <textarea 
                    value={notifData.body}
                    onChange={e => setNotifData({...notifData, body: e.target.value})}
                    placeholder="Enter your message here..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Audience</label>
                  <select 
                    value={notifData.targetRole}
                    onChange={e => setNotifData({...notifData, targetRole: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="all">All Users</option>
                    <option value="user">Patients Only</option>
                    <option value="clinic_owner">Clinic Owners Only</option>
                  </select>
                </div>

                {sendSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold animate-in fade-in zoom-in">
                    Notification sent successfully!
                  </div>
                )}

                <button 
                  onClick={async () => {
                    if (!notifData.title || !notifData.body) return;
                    setIsSending(true);
                    try {
                      await sendPushNotification(notifData.title, notifData.body, notifData.targetRole);
                      setSendSuccess(true);
                      setNotifData({ title: '', body: '', targetRole: 'all' });
                      setTimeout(() => setSendSuccess(false), 3000);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={isSending || !notifData.title || !notifData.body}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? 'Sending...' : <><Bell className="w-4 h-4" /> Send Notification</>}
                </button>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">FCM Integration Note</h3>
              <p className="text-xs text-slate-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
                In this preview environment, "Push Notifications" are simulated by saving to the database. 
                In a production build, this action would trigger a Cloud Function that sends actual push notifications 
                using <strong>Firebase Admin SDK</strong> to users' registered <strong>FCM Tokens</strong>.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold text-slate-800">Clinic Categories</h1>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-teal-700 transition-all text-sm"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {isAddingCategory && (
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category Name</label>
                    <input 
                      type="text" 
                      value={newCategory.name}
                      onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="e.g. Dentistry"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Icon URL (Optional)</label>
                    <input 
                      type="text" 
                      value={newCategory.icon}
                      onChange={e => setNewCategory({...newCategory, icon: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategory({ name: '', icon: '' });
                    }}
                    className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (!newCategory.name) return;
                      await addCategory(newCategory.name, newCategory.icon);
                      setIsAddingCategory(false);
                      setNewCategory({ name: '', icon: '' });
                    }}
                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md"
                  >
                    Save Category
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="relative group bg-white p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 hover:border-teal-200 transition-all shadow-sm">
                  <button 
                    onClick={() => {
                      if (confirm(`Delete category ${cat.name}?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {cat.icon ? (
                    <img src={cat.icon} alt={cat.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                      <Grid className="w-6 h-6" />
                    </div>
                  )}
                  <span className="font-bold text-slate-700 text-sm text-center">{cat.name}</span>
                </div>
              ))}
              {categories.length === 0 && !isAddingCategory && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No categories found. Click "Add Category" to start.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
