import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Building2, LayoutDashboard, Image as ImageIcon, Trash2, Plus, Bell, ShieldAlert, 
  Ban, CheckCircle2, LogOut, Grid, CheckCircle, Search, Settings, Activity, FileText,
  MapPin, FolderTree, Star, Radio, Edit3, HeartPulse, RefreshCw, AlertTriangle
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const AdminPanel: React.FC = () => {
  const { 
    users, clinics, doctors, laboratories, appointments, userProfile, banners, categories, districts,
    updateUserStatus, deleteUser, deleteClinic, sendPushNotification, updateClinic, logoutUser,
    addCategory, deleteCategory, addDistrict, deleteDistrict, toggleDistrictStatus
  } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clinics' | 'banners' | 'notifications' | 'categories' | 'districts'>('dashboard');

  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '' });
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // District state
  const [newDistrict, setNewDistrict] = useState({ name: '' });
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);

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
  let timeGreeting = 'Good Morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good Afternoon';
  else if (hour >= 17) timeGreeting = 'Good Evening';

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Musaib';
  const pendingClinics = clinics.filter(c => c.status === 'pending');

  const NavItem = ({ icon: Icon, label, id, badge }: any) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => id && setActiveTab(id)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg mb-1 transition-colors ${isActive ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {badge && (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            {firstName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-slate-900 leading-none">MediBrid</h2>
              <span className="bg-teal-100 text-teal-700 text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border border-teal-200">Admin</span>
            </div>
            <p className="text-[10px] text-slate-500">J&K Health Partner CMS</p>
          </div>
        </div>
        
        <div className="p-3 flex-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
          <NavItem icon={Building2} label="Providers Directory" id="clinics" />
          <NavItem icon={Activity} label="Doctor Availability" />
          <NavItem icon={Users} label="Patient Accounts" id="users" />
          <NavItem icon={ImageIcon} label="App Banners" id="banners" badge={banners.filter(b => b.active).length || undefined} />
          <NavItem icon={Grid} label="Categories CMS" id="categories" />
          <NavItem icon={HeartPulse} label="Medical Specialties" />
          <NavItem icon={Building2} label="Facility Types" />
          <NavItem icon={MapPin} label="J&K Districts" id="districts" badge={districts.filter(d => d.active).length || undefined} />
          <NavItem icon={FolderTree} label="Service Catalog" />
          <NavItem icon={FileText} label="Appointments" />
          <NavItem icon={Star} label="Reviews Moderation" />
          <NavItem icon={Edit3} label="Homepage Manager" />
          <NavItem icon={Radio} label="Broadcast Center" id="notifications" />
          <NavItem icon={Activity} label="Activity Audit Log" />
          <NavItem icon={Settings} label="Settings & Reset" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="p-6 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <span className="text-xl">🌅</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 leading-none">{timeGreeting}, {firstName}</h1>
                  <span className="bg-slate-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-full border border-slate-200 font-bold uppercase tracking-wider">Super Admin</span>
                </div>
                <p className="text-xs text-slate-400">Control the MediBrid platform directory, providers, categories, and settings.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Add Provider
              </button>
              <button className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={logoutUser} className="border border-rose-200 text-rose-700 bg-rose-50 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-rose-100 transition-colors">
                <LogOut className="w-4 h-4" /> Logout Admin
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Total Providers</p>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">{clinics.length}</h2>
                    <p className="text-[10px] text-slate-500">{clinics.filter(c => c.verified).length} Verified</p>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Pending Approval</p>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">{pendingClinics.length}</h2>
                    <p className="text-[10px] text-slate-500">{pendingClinics.length > 0 ? `${pendingClinics.length} Action Required` : 'Up to date'}</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Total Patients</p>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">{users.length}</h2>
                    <p className="text-[10px] text-slate-500">J&K Demo Accounts</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Appointments</p>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1">{appointments.length}</h2>
                    <p className="text-[10px] text-slate-500">0 Today</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-slate-300">Admin Quick Management Actions</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <Plus className="w-5 h-5 text-teal-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Add Provider</span>
                  </button>
                  <button className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Verification Queue</span>
                  </button>
                  <button onClick={() => setActiveTab('categories')} className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <Grid className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Categories CMS</span>
                  </button>
                  <button onClick={() => setActiveTab('districts')} className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">J&K Districts</span>
                  </button>
                  <button onClick={() => setActiveTab('banners')} className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <ImageIcon className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Homepage Layout</span>
                  </button>
                  <button onClick={() => setActiveTab('notifications')} className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-slate-50 p-4 rounded-xl text-left transition-colors flex flex-col gap-3 group">
                    <Bell className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">Broadcast Alert</span>
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900">7-Day Appointment Activity Trend</h3>
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Real-Time</span>
                </div>
                <div className="space-y-4">
                  {[
                    { day: 'Thu 6', val: 90, label: '4 Appts' },
                    { day: 'Fri 7', val: 90, label: '4 Appts' },
                    { day: 'Sat 8', val: 75, label: '3 Appts' },
                    { day: 'Sun 9', val: 50, label: '2 Appts' },
                    { day: 'Mon 10', val: 75, label: '3 Appts' },
                    { day: 'Tue 11', val: 90, label: '4 Appts' },
                    { day: 'Wed 12', val: 75, label: '3 Appts' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-4 text-xs font-medium">
                      <span className="text-slate-400 w-12">{row.day}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: `${row.val}%` }}></div>
                      </div>
                      <span className="text-teal-400 w-12 text-right">{row.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-sm font-bold text-slate-900">Pending Provider Approvals</h3>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">{pendingClinics.length} Pending</span>
                </div>
                {pendingClinics.length > 0 ? (
                  <div className="space-y-3">
                    {pendingClinics.map(clinic => (
                      <div key={clinic.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{clinic.clinicName}</h4>
                          <p className="text-xs text-slate-500">{clinic.city}</p>
                        </div>
                        <button onClick={() => setActiveTab('clinics')} className="bg-teal-600 text-white px-3 py-1.5 rounded text-xs font-bold">Review</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-400">All provider verification applications are up to date!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
              {/* Existing Tab Components Wrapped in Dark Theme */}
              
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Registered Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                          <th className="pb-3 font-bold">Name</th>
                          <th className="pb-3 font-bold">Email</th>
                          <th className="pb-3 font-bold">Phone</th>
                          <th className="pb-3 font-bold">Role</th>
                          <th className="pb-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {users.map(user => (
                          <tr key={user.uid} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="py-3 font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                {user.status === 'blocked' && <span className="text-[10px] text-red-600 font-bold uppercase">Blocked</span>}
                              </div>
                            </td>
                            <td className="py-3 text-slate-600">{user.email}</td>
                            <td className="py-3 text-slate-600">{user.phone || 'N/A'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                user.role === 'clinic_owner' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-teal-100 text-teal-700 border border-teal-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => updateUserStatus(user.uid, user.status === 'blocked' ? 'active' : 'blocked')}
                                  className={`p-1.5 rounded transition-colors ${user.status === 'blocked' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                  {user.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>
                                <button onClick={() => deleteUser(user.uid)} className="p-1.5 bg-rose-100 text-rose-700 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'clinics' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Providers Directory</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-sm">
                          <th className="pb-3 font-bold">Clinic Name</th>
                          <th className="pb-3 font-bold">City</th>
                          <th className="pb-3 font-bold">Status</th>
                          <th className="pb-3 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {clinics.map(clinic => (
                          <tr key={clinic.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="py-3 font-medium text-slate-900">{clinic.clinicName}</td>
                            <td className="py-3 text-slate-600">{clinic.city}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                                clinic.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                clinic.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                'bg-rose-100 text-rose-700 border border-rose-200'
                              }`}>
                                {clinic.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => updateClinic(clinic.id, { verified: !clinic.verified })}
                                  className={`p-1.5 rounded transition-colors ${clinic.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => updateClinic(clinic.id, { status: clinic.status === 'suspended' ? 'active' : 'suspended' as any })}
                                  className={`p-1.5 rounded transition-colors ${clinic.status === 'suspended' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                  {clinic.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                </button>
                                <button onClick={() => deleteClinic(clinic.id)} className="p-1.5 bg-rose-100 text-rose-700 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'banners' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">App Banners</h2>
                    <button onClick={() => setIsAddingBanner(true)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Banner
                    </button>
                  </div>

                  {isAddingBanner && (
                    <div className="bg-slate-100/50 p-6 rounded-xl border border-slate-200 mb-6">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">New Banner</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                          <input type="text" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Image URL</label>
                          <input type="text" value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Target Link (Optional)</label>
                          <input type="text" value={newBanner.link} onChange={e => setNewBanner({...newBanner, link: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAddingBanner(false)} className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-slate-900">Cancel</button>
                        <button onClick={handleAddBanner} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">Save Banner</button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map(banner => (
                      <div key={banner.id} className="relative rounded-xl overflow-hidden group border border-slate-800 h-40">
                        <img src={banner.imageUrl} alt={banner.title} className={`w-full h-full object-cover transition-all ${!banner.active && 'opacity-50 grayscale'}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent p-4 flex flex-col justify-end">
                          <h4 className="text-slate-900 font-bold">{banner.title}</h4>
                          {banner.link && <p className="text-teal-700 text-[10px] truncate">{banner.link}</p>}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button onClick={() => handleToggleBanner(banner.id, banner.active)} className={`px-2 py-1 rounded text-xs font-bold ${banner.active ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-900'}`}>
                            {banner.active ? 'Active' : 'Hidden'}
                          </button>
                          <button onClick={() => handleDeleteBanner(banner.id)} className="p-1.5 bg-rose-100 text-rose-700 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {banners.length === 0 && <div className="col-span-2 py-10 text-center text-slate-500">No banners found</div>}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-6">Broadcast Alert</h2>
                  <div className="max-w-xl bg-slate-100/50 p-6 rounded-xl border border-slate-200">
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                      <input type="text" value={notifData.title} onChange={e => setNotifData({...notifData, title: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Message Body</label>
                      <textarea value={notifData.body} onChange={e => setNotifData({...notifData, body: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 h-24" />
                    </div>
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Target Audience</label>
                      <select value={notifData.targetRole} onChange={e => setNotifData({...notifData, targetRole: e.target.value as any})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900">
                        <option value="all">All Users</option>
                        <option value="patient">Patients Only</option>
                        <option value="clinic_owner">Clinic Owners Only</option>
                      </select>
                    </div>
                    <button 
                      onClick={async () => {
                        if(!notifData.title || !notifData.body) return;
                        setIsSending(true);
                        try {
                          await sendPushNotification(notifData.title, notifData.body, notifData.targetRole);
                          setSendSuccess(true);
                          setNotifData({title:'', body:'', targetRole:'all'});
                          setTimeout(() => setSendSuccess(false), 3000);
                        } finally {
                          setIsSending(false);
                        }
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send Broadcast'}
                    </button>
                    {sendSuccess && <p className="mt-4 text-emerald-700 text-sm text-center">Broadcast sent successfully!</p>}
                  </div>
                </div>
              )}

              
              {activeTab === 'districts' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">J&K Districts & Service Coverage</h2>
                    <button onClick={() => setIsAddingDistrict(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add District
                    </button>
                  </div>
                  
                  {isAddingDistrict && (
                    <div className="bg-slate-100/50 p-6 rounded-xl border border-slate-200 mb-6 flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">District Name (e.g. Srinagar, Anantnag)</label>
                        <input type="text" value={newDistrict.name} onChange={e => setNewDistrict({...newDistrict, name: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsAddingDistrict(false)} className="px-4 py-2.5 text-sm text-slate-500 font-bold">Cancel</button>
                        <button onClick={async () => {
                          if (newDistrict.name) {
                            await addDistrict(newDistrict);
                            setNewDistrict({name:''});
                            setIsAddingDistrict(false);
                          }
                        }} className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold">Save</button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {districts.map(dist => (
                      <div key={dist.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-teal-600" />
                            </div>
                            <h3 className="font-bold text-slate-900">{dist.name}</h3>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                            dist.active ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                            'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {dist.active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div className="bg-slate-50 p-2 rounded">Clinics: <span className="text-slate-900 font-bold">{clinics.filter(c => c.district?.toLowerCase() === dist.name.toLowerCase()).length}</span></div>
                          <div className="bg-slate-50 p-2 rounded">Doctors: <span className="text-slate-900 font-bold">{doctors.filter(d => d.district?.toLowerCase() === dist.name.toLowerCase()).length}</span></div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button 
                            onClick={() => toggleDistrictStatus(dist.id, !dist.active)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${!dist.active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                          >
                            {dist.active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => deleteDistrict(dist.id)} className="p-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {districts.length === 0 && (
                      <div className="col-span-2 p-8 text-center text-slate-500 bg-[#020617] rounded-xl border border-dashed border-slate-800">
                        No districts configured. Add a district to enable localized clinic listings.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Categories CMS</h2>
                    <button onClick={() => setIsAddingCategory(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                  {isAddingCategory && (
                    <div className="bg-slate-100/50 p-6 rounded-xl border border-slate-200 mb-6 flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                        <input type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Icon URL (Optional)</label>
                        <input type="text" value={newCategory.icon} onChange={e => setNewCategory({...newCategory, icon: e.target.value})} className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2.5 text-sm text-slate-500 font-bold">Cancel</button>
                        <button onClick={async () => {
                          if (newCategory.name) {
                            await addCategory(newCategory);
                            setNewCategory({name:'', icon:''});
                            setIsAddingCategory(false);
                          }
                        }} className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold">Save</button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-700">{cat.name}</span>
                        <button onClick={() => deleteCategory(cat.id)} className="text-rose-700 hover:bg-rose-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
