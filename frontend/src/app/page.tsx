'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    
    if (token && user) {
      const target = user.role === 'investor' ? '/dashboard' : '/advisor';
      router.replace(target);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-indigo-600 uppercase tracking-widest font-bold animate-pulse">Loading AURA...</span>
      </div>
    </div>
  );
}
