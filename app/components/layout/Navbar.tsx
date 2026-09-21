"use client";

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  Sparkles, 
  Layers, 
  BarChart3, 
  Users, 
  MessageSquare,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar({ 
  activeTab = 'Overview', 
  onTabChange = (_tab) => {}, 
  searchQuery = '', 
  onSearchChange = (_query) => {},
  onLogout = () => {},
  unreadNotifications = 3
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Prefetch main routes so tab navigation is instant
    router.prefetch('/dashboard');
    router.prefetch('/risk-signals');
    router.prefetch('/students');
    router.prefetch('/messages');
  }, [router]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      auth.logout();
    }
  };

  const navItems = [
    { name: 'Overview', icon: BarChart3, href: '/dashboard' },
    { name: 'Students', icon: Users, href: '/students' },
    { name: 'Messages', label: 'Messages & Outreach', icon: MessageSquare, href: '/messages' },
    { name: 'Risk Signals', icon: ShieldAlert, href: '/risk-signals' },
    { name: 'Reports', icon: Layers, href: '/reports' }
  ];

  const handleNavClick = (name, href) => {
    if (onTabChange) {
      onTabChange(name);
    } else if (href) {
      router.push(href);
    }
  };

  const userName = auth.user?.name || 'Anurag';
  const userEmail = auth.user?.email || 'anurag@institution.edu';
  const userRole = auth.user?.role || 'Lead Educator';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-20 gap-5">
          
          {/* Left: StudyShield Logo & Brand */}
          <div className="flex items-center shrink-0 sm:min-w-[190px] lg:min-w-[220px]">
            <div 
              onClick={() => handleNavClick('Overview', '/dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-xl tracking-tight font-sans">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">
                  StudyShield
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 tracking-wider uppercase mt-1 hidden sm:inline-block">
                  Retention Intelligence
                </span>
              </div>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center justify-center space-x-1 lg:space-x-1.5 flex-1 px-2" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.name || (item.name === 'Messages' && (activeTab === 'Messages & Outreach' || activeTab === 'Messages'));
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name, item.href)}
                  onMouseEnter={() => {
                    if (item.href) router.prefetch(item.href);
                  }}
                  className={`px-3.5 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-150 relative whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50/90 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label || item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 lg:left-3.5 lg:right-3.5 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Notifications, Educator Profile, Mobile Menu */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 sm:min-w-[190px] lg:min-w-[220px]">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notification Slideout / Dropdown */}
              {showNotifications && (
                <div className="absolute right-[-48px] sm:right-0 mt-2 w-[calc(100vw-32px)] max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900">Live Alerts</h4>
                      <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 font-medium rounded-full">
                        {unreadNotifications} new
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Mark read
                    </button>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Rahul Sharma transitioned to High Risk</p>
                        <p className="text-xs text-slate-500 mt-0.5">12 consecutive days of inactivity detected</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">8 mins ago</span>
                      </div>
                    </div>

                    <div className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Priya Mehta missed Thermodynamics Quiz</p>
                        <p className="text-xs text-slate-500 mt-0.5">Recommended action: Review student</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">24 mins ago</span>
                      </div>
                    </div>

                    <div className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">Weekly Retention Model Synced</p>
                        <p className="text-xs text-slate-500 mt-0.5">248 students analyzed with formula R(t)</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-center">
                    <button 
                      onClick={() => {
                        setShowNotifications(false);
                        handleNavClick('Activity', '/dashboard');
                      }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      View all activity feed &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Educator Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                aria-label="User profile"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{userName}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{userRole}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200/60">
                      Educator Workspace
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleNavClick('Students', '/students');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      Manage Students
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleNavClick('Messages', '/messages');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      Messages & Outreach
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleNavClick('Reports', '/dashboard');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      Retention Reports
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  handleNavClick(item.name, item.href);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
                  activeTab === item.name || (item.name === 'Messages' && (activeTab === 'Messages & Outreach' || activeTab === 'Messages'))
                    ? 'text-emerald-700 bg-emerald-50 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label || item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
