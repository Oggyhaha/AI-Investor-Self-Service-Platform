'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { authAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Phone, Lock, Mail, ArrowRight, User, Calendar, Award } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Options: 'login' | 'signup' | 'staff'
  const [mode, setMode] = useState<'login' | 'signup' | 'staff'>('login');
  
  // Form states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1 = entry, 2 = verify otp
  
  // Investor Signup states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  
  // Staff states
  const [staffEmail, setStaffEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authAPI.sendOTP(phone);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error?.detail || 'Failed to send OTP. Check if phone is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456') {
      setError('Invalid OTP code. For demo use 123456');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await authAPI.verifyOTP(phone, otp);
      
      let resolvedName = 'Registered Investor';
      if (phone === '9876543210') resolvedName = 'Rajesh Kumar Sharma';
      else if (phone === '9876543211') resolvedName = 'Priya Mehta';
      else if (phone === '9876543212') resolvedName = 'Amit Patel';
      else if (fullName) resolvedName = fullName;

      login(data.access_token, {
        id: data.user_id,
        name: resolvedName,
        role: data.role as any
      });
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.detail || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !pan || !dob) {
      setError('Please fill in all the details');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authAPI.signup({
        full_name: fullName,
        email: email,
        phone: phone,
        pan: pan,
        date_of_birth: dob
      });
      setSuccess('Signup successful! Verify your number now.');
      setStep(2); // move straight to OTP verify
    } catch (err: any) {
      setError(err.response?.data?.error?.detail || 'Registration failed. Check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await authAPI.advisorLogin(staffEmail, password);
      
      login(data.access_token, {
        id: data.user_id,
        name: staffEmail.startsWith('sneha') ? 'Sneha Gupta' : 'Vikram Singh',
        role: data.role as any
      });
      
      // Correctly route to advisor portal
      router.push('/advisor');
    } catch (err: any) {
      setError(err.response?.data?.error?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="glow-primary -top-40 -left-40 opacity-70"></div>
      <div className="glow-secondary -bottom-20 -right-20 opacity-60"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="bg-gradient-indigo p-3.5 rounded-2xl shadow-lg shadow-indigo-500/15 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-gradient leading-none">AURA</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide mt-1">Investor Self-Service & Servicing Portal</p>
        </div>

        {/* Auth form Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 shadow-xl border border-slate-100 relative overflow-hidden">
          
          {/* Custom Tabs Navigation */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-6 border border-slate-200/50">
            <button
              onClick={() => { setMode('login'); setStep(1); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setStep(1); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setMode('staff'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === 'staff'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Advisor
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold leading-relaxed">
              {success}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Registered Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-semibold"
                          required
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2 block font-medium">Demo phones: 9876543210, 9876543211, 9876543212</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      <span>{loading ? 'Sending...' : 'Get Verification OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Verify Mobile OTP</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit code (e.g. 123456)"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all tracking-widest placeholder:tracking-normal placeholder:text-slate-400 font-bold"
                          required
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-semibold">
                        <span className="text-emerald-600">Demo Code: 123456</span>
                        <button type="button" onClick={() => setStep(1)} className="text-indigo-600 hover:text-indigo-700">Change Phone</button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      <span>{loading ? 'Logging in...' : 'Verify & Enter Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name (as in PAN)</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ramesh@example.com"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">PAN Card Number</label>
                        <input
                          type="text"
                          value={pan}
                          onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="10-char PAN"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase tracking-wider font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      <span>{loading ? 'Creating...' : 'Register Investor Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Verify Signup OTP</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter verification code"
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all tracking-widest placeholder:tracking-normal font-bold"
                          required
                        />
                      </div>
                      <span className="text-[10px] text-emerald-600 mt-2 block font-semibold">Demo Code: 123456</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      <span>{loading ? 'Verifying...' : 'Complete Verification'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {mode === 'staff' && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                <form onSubmit={handleStaffLogin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Advisor Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="advisor@abcmf.com or admin@abcmf.com"
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 font-semibold"
                        required
                      />
                    </div>
                    <div className="mt-2.5 text-[9px] text-slate-500 font-semibold flex flex-col gap-0.5 border-t border-slate-100 pt-2.5">
                      <span>Advisor: sneha@abcmf.com / advisor123</span>
                      <span>Admin: vikram@abcmf.com / admin123</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-gradient-indigo py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    <span>{loading ? 'Logging in...' : 'Sign In as Staff'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
