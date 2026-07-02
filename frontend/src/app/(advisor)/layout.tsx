'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import TopNavbar from '@/components/layout/TopNavbar';

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && isAuthenticated && role !== 'advisor' && role !== 'admin') {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (isLoading || !isAuthenticated || (role !== 'advisor' && role !== 'admin')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-xs text-indigo-600 uppercase tracking-widest font-bold animate-pulse">Verifying Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <TopNavbar />
      <main className="flex-1 p-6 md:p-10 w-full max-w-[100%] mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
