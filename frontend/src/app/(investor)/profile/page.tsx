'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI } from '@/lib/api';
import { CheckCircle2, User, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['investor-profile-details'],
    queryFn: async () => {
      const { data } = await profileAPI.get();
      return data;
    },
  });

  // Pre-fill editable state when profile loads
  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setPincode(profile.pincode || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      setSuccessMsg(null);
      setErrorMsg(null);
      const res = await profileAPI.update(data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investor-profile-details'] });
      setSuccessMsg('Contact profile details updated successfully.');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.detail || 'Failed to update contact profile details.');
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="flex-1 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-800/40 w-1/4 rounded-xl" />
        <div className="h-64 bg-slate-800/40 rounded-2xl border border-white/5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="glow-secondary bottom-10 -left-10 opacity-20"></div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide text-white">Contact Profile</h1>
        <p className="text-sm text-slate-400 font-medium">Verify your registered details and update your contact preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start z-10">
        
        {/* Readonly details */}
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Credentials</h3>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Investor Name</p>
                <p className="font-semibold text-white mt-0.5">{profile.full_name}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Investor ID Reference</p>
              <p className="font-semibold text-white mt-0.5">{profile.investor_id}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">PAN Number</p>
              <p className="font-semibold text-white mt-0.5">{profile.pan}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Risk Profile Class</p>
              <span className="inline-block mt-1 font-bold text-xs uppercase tracking-widest text-gradient">
                {profile.risk_profile}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col gap-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Update Contact Coordinates</h3>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ email, phone, address, city, state, pincode });
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Residency Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px] font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                  className="w-full bg-slate-900/60 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full md:w-auto bg-gradient-indigo py-3 px-8 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <span>{updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
