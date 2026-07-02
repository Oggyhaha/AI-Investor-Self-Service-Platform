'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  RefreshCw,
  MessageSquare,
  FileText,
  ShieldCheck,
  Users,
  Ticket,
  User,
  LogOut,
  Sparkles,
  Bell,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopNavbar() {
  const pathname = usePathname();
  const { role, logout, user } = useAuth();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await notificationAPI.getAll();
      return data;
    },
    enabled: !!user && user.role === 'investor',
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await notificationAPI.markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNavItems = () => {
    if (role === 'advisor' || role === 'admin') {
      return [
        {
          label: role === 'admin' ? 'System Analytics' : 'Support Queue',
          href: '/advisor',
          icon: LayoutDashboard,
        },
      ];
    }

    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
      { label: 'SIP Mandates', href: '/sips', icon: RefreshCw },
      { label: 'Chat Assistant', href: '/chat', icon: MessageSquare, highlight: true },
      { label: 'Statements', href: '/statements', icon: FileText },
      { label: 'KYC Status', href: '/kyc', icon: ShieldCheck },
      { label: 'Nominees', href: '/nominees', icon: Users },
      { label: 'Service Tickets', href: '/tickets', icon: Ticket },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="glass-navbar sticky top-0 w-full z-45 px-6 md:px-12 py-3.5">
      <div className="max-w-[100%] mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="bg-gradient-indigo p-2.5 rounded-xl shadow-md shadow-indigo-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-gradient leading-none">AURA</h1>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mt-0.5">Mutual Fund Services</span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links with separators */}
        <div className="hidden lg:flex items-center">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <div key={item.href} className="flex items-center">
                {idx > 0 && (
                  <div className="h-5 w-[1px] bg-slate-200/80 mx-2 shrink-0" />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200",
                    isActive
                      ? item.highlight
                        ? "bg-gradient-indigo text-white shadow-md shadow-indigo-500/10"
                        : "bg-indigo-50/60 text-indigo-600 font-bold"
                      : item.highlight
                        ? "text-indigo-600 hover:bg-indigo-50/40 border border-indigo-200/50 border-dashed"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {isActive && !item.highlight && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Right: Quick actions, notifications & profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Notifications bell */}
          {user?.role === 'investor' && (
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-80 glass-card rounded-2xl p-4 shadow-xl z-50 text-slate-800"
                  >
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          All caught up! No new notifications.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n: any) => (
                          <div
                            key={n.id}
                            className={cn(
                              "p-2.5 rounded-xl border text-xs transition-colors",
                              n.is_read
                                ? 'bg-slate-50/50 border-slate-100 text-slate-500'
                                : 'bg-indigo-50/30 border-indigo-100/50 text-slate-800'
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-1 font-bold text-slate-800">
                              <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{n.title}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed mb-1 text-slate-600">{n.message}</p>
                            <span className="text-[9px] text-slate-400">{formatDate(n.created_at)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User profile dropdown avatar */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-1 block">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100/30 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-3 border-t border-slate-100 pt-3 flex flex-col gap-1 overflow-hidden"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
