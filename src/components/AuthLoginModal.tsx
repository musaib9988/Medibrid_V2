import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, User, Phone, X, MapPin } from 'lucide-react';

export const AuthLoginModal: React.FC = () => {
  const { isAuthModalOpen, authModalRole, closeAuthModal, loginWithFirebaseEmail, registerWithFirebaseEmail, loginWithGoogle, resetPassword } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'user' | 'clinic_owner'>(authModalRole as 'user' | 'clinic_owner');

  useEffect(() => {
    if (isAuthModalOpen) {
      setSelectedRole(authModalRole as 'user' | 'clinic_owner');
    }
  }, [isAuthModalOpen, authModalRole]);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isForgotPassword) {
        if (!email) return setError('Please enter your email to reset password.');
        await resetPassword(email);
        setResetSent(true);
        return;
      }

      if (isLogin) {
        await loginWithFirebaseEmail(email, password);
      } else {
        if (selectedRole === 'clinic_owner' && password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await registerWithFirebaseEmail(email, password, name, phone, selectedRole, district);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-xl">
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {!isForgotPassword && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setSelectedRole('user'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                selectedRole === 'user' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('clinic_owner'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                selectedRole === 'clinic_owner' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500'
              }`}
            >
              Clinic Partner
            </button>
          </div>
        )}

        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
          {isForgotPassword 
            ? 'Reset Password' 
            : isLogin 
              ? selectedRole === 'clinic_owner' ? 'Clinic Sign In' : 'Welcome Back' 
              : selectedRole === 'clinic_owner' ? 'Register Your Clinic' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg mb-4 text-center font-bold">
            Password reset link sent to your email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={selectedRole === 'clinic_owner' ? "Owner Full Name" : "Full Name"}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" 
                  placeholder={selectedRole === 'clinic_owner' ? "Mobile Number" : "Phone Number"}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Your District (e.g. Srinagar)"
                  required={selectedRole === 'user'}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
            />
          </div>

          {!isForgotPassword && (
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          )}

          {!isLogin && !isForgotPassword && selectedRole === 'clinic_owner' && (
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                placeholder="Confirm Password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          )}

          <button type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-colors">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Sign In' : selectedRole === 'clinic_owner' ? 'Create Clinic Account' : 'Sign Up'}
          </button>
        </form>

        {!isForgotPassword && (
          <>
            <div className="mt-6 flex items-center justify-center space-x-2">
              <span className="h-px bg-slate-200 flex-1"></span>
              <span className="text-xs text-slate-400 uppercase font-bold">Or</span>
              <span className="h-px bg-slate-200 flex-1"></span>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full mt-6 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 text-center flex flex-col gap-3">
          {!isForgotPassword && isLogin && (
            <button 
              onClick={() => setIsForgotPassword(true)}
              className="text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              Forgot Password?
            </button>
          )}
          
          {isForgotPassword ? (
            <button 
              onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
              className="text-sm font-bold text-teal-600 hover:underline"
            >
              Back to Sign In
            </button>
          ) : (
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-teal-600 hover:underline"
            >
              {isLogin 
                ? selectedRole === 'clinic_owner' ? "Don't have a clinic account? Register" : "Don't have an account? Sign up" 
                : selectedRole === 'clinic_owner' ? "Already have a clinic account? Sign In" : "Already have an account? Log in"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
