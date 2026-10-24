'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, Sun, Moon, Settings, User, LogOut, Globe, Shield, 
  ChevronRight, Bell, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { purgeAllSoapDraftsOnLogoutOrIdle } from '@/lib/clinical/soap-draft-storage';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarLayoutProps {
  role: 'patient' | 'clinician';
  userName: string;
  userSubtitle: string;
  avatarUrl?: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function SidebarLayout({
  role,
  userName,
  userSubtitle,
  navItems,
  activeTab,
  onTabChange,
  children
}: SidebarLayoutProps) {
  const { language, setLanguage } = useLanguage();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const activeNavItem = navItems.find(item => item.id === activeTab) || navItems[0];

  return (
    <div className={`min-h-screen w-full flex font-sans antialiased transition-colors duration-200 ${
      isDarkMode ? 'bg-[#09090B] text-[#FAFAFA]' : 'bg-[#F8F9FA] text-[#09090B]'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. SINGLE UNIFIED LEFT SIDEBAR (Minimal Futuristic Luxury Light)          */}
      {/* ========================================================================= */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 z-30 transition-colors ${
        isDarkMode 
          ? 'bg-[#121215]/95 border-[#27272A] backdrop-blur-xl' 
          : 'bg-white/95 border-[#E4E4E7] backdrop-blur-xl shadow-[1px_0_3px_rgba(0,0,0,0.01)]'
      }`}>
        
        {/* Top: Brand Logo & Title */}
        <div className="p-6 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0F6FF] dark:bg-[#1E293B] border border-[#0066FF]/20 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-[#0066FF]" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-semibold tracking-tight text-[#09090B] dark:text-white leading-none">
                Praxis AI
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
            </div>
            <span className="text-[10px] text-[#71717A] font-medium tracking-wide block mt-1">
              Clinical Tele-Psychiatry
            </span>
          </div>
        </div>

        {/* Middle: Left-Aligned Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-[#A1A1AA]">
            {role === 'clinician' ? 'Clinical Workspace' : 'Patient Services'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#F0F6FF] text-[#0066FF] font-semibold border-r-2 border-[#0066FF]'
                    : isDarkMode 
                      ? 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]' 
                      : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#09090B] font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0066FF]' : 'text-[#71717A]'}`} strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                    isActive 
                      ? 'bg-[#0066FF] text-white' 
                      : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#71717A]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Footer: Settings, Theme Toggle, & Profile Card */}
        <div className="p-4 border-t border-[#E4E4E7] dark:border-[#27272A] space-y-3">
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'settings' 
                  ? 'bg-[#F0F6FF] text-[#0066FF] font-semibold' 
                  : 'text-[#71717A] hover:text-[#09090B] dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" strokeWidth={1.75} />
              <span>Settings</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#F4F4F5] dark:bg-[#18181B] text-[#71717A] hover:text-[#09090B] dark:hover:text-white border border-[#E4E4E7] dark:border-[#27272A] transition-all"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#0066FF]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* User Profile Card */}
          <button
            onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
            className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] hover:border-[#D4D4D8] transition-all text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#09090B] dark:bg-white flex items-center justify-center text-white dark:text-[#09090B] font-semibold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-[#09090B] dark:text-white">{userName}</p>
              <p className="text-[10px] text-[#71717A] truncate">{userSubtitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA]" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. FULL-SCREEN CANVAS & TOP HEADER                                        */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        
        {/* Top Header Bar */}
        <header className={`h-16 border-b px-8 flex items-center justify-between shrink-0 transition-colors ${
          isDarkMode 
            ? 'bg-[#121215]/90 border-[#27272A] backdrop-blur-xl' 
            : 'bg-white/90 border-[#E4E4E7] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)]'
        }`}>
          <div>
            <h2 className="text-base font-semibold text-[#09090B] dark:text-white tracking-tight">
              {activeNavItem.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <span className="bg-[#F4F4F5] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] border border-[#E4E4E7] dark:border-[#27272A] font-medium px-3 py-1 rounded-full text-xs flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] mr-2" />
              HIPAA Protected
            </span>

            {/* Language Selector */}
            <div className="flex items-center space-x-1 bg-[#F4F4F5] dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-lg p-0.5 text-xs">
              <Globe className="w-3.5 h-3.5 ml-1.5 text-[#71717A]" strokeWidth={1.75} />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${language === 'en' ? 'bg-white dark:bg-[#27272A] text-[#09090B] dark:text-white shadow-sm' : 'text-[#71717A]'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${language === 'hi' ? 'bg-white dark:bg-[#27272A] text-[#09090B] dark:text-white shadow-sm' : 'text-[#71717A]'}`}
              >
                HI
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${language === 'mr' ? 'bg-white dark:bg-[#27272A] text-[#09090B] dark:text-white shadow-sm' : 'text-[#71717A]'}`}
              >
                MR
              </button>
            </div>

            {/* Profile Avatar Trigger */}
            <button
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
              className="w-8 h-8 rounded-lg bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] font-semibold text-xs flex items-center justify-center border border-[#E4E4E7] dark:border-[#27272A] hover:opacity-90 transition-opacity"
              title="User Account"
            >
              {userName.charAt(0)}
            </button>
          </div>
        </header>

        {/* User Profile Modal */}
        {isProfileModalOpen && (
          <div className="absolute top-18 right-8 z-50 w-80 p-5 bg-white/95 dark:bg-[#18181B]/95 border border-[#E4E4E7] dark:border-[#27272A] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4 font-sans backdrop-blur-xl">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <div className="w-10 h-10 rounded-xl bg-[#09090B] dark:bg-white flex items-center justify-center text-white dark:text-[#09090B] font-semibold text-sm">
                {userName.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-[#09090B] dark:text-white text-sm">{userName}</h4>
                <p className="text-xs text-[#71717A]">{userSubtitle}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#52525B] dark:text-[#A1A1AA]">
              <div className="flex justify-between">
                <span>Account Role</span>
                <span className="font-semibold text-[#09090B] dark:text-white uppercase">{role}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Level</span>
                <span className="font-semibold text-[#0066FF]">HIPAA Verified</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E4E7] dark:border-[#27272A] flex justify-between items-center">
              <button
                onClick={() => { onTabChange('settings'); setIsProfileModalOpen(false); }}
                className="text-xs font-medium text-[#52525B] hover:text-[#09090B] dark:hover:text-white flex items-center"
              >
                <Settings className="w-3.5 h-3.5 mr-1 text-[#71717A]" strokeWidth={1.75} /> Settings
              </button>
              <Link 
                href="/api/logout" 
                onClick={() => purgeAllSoapDraftsOnLogoutOrIdle()} 
                className="text-xs font-medium text-[#DC2626] hover:underline flex items-center"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Sign Out
              </Link>
            </div>
          </div>
        )}

        {/* Main Dashboard Canvas */}
        <main className="flex-1 w-full min-h-screen p-8 md:p-10 space-y-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
