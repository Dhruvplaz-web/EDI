'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, Sun, Moon, Settings, User, LogOut, Globe, Shield, 
  ChevronRight, Bell, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

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
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* ========================================================================= */}
      {/* 1. SINGLE UNIFIED LEFT SIDEBAR (Clinical Platinum Design)                */}
      {/* ========================================================================= */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 shadow-sm z-30 transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Top: Logo & Praxis AI App Title */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-900 flex items-center justify-center shadow-sm shrink-0">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight leading-none">Praxis AI</h1>
            <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider">Tele-Psychiatry</span>
          </div>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            {role === 'clinician' ? 'Clinical Navigation' : 'Patient Navigation'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-900 font-semibold border-r-4 border-blue-700 shadow-sm'
                    : isDarkMode 
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                    isActive ? 'bg-blue-200/60 text-blue-900' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Footer: Settings, Dark/Light Mode Toggle, & Profile Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'settings' 
                  ? 'bg-blue-50 text-blue-900 font-bold border-r-2 border-blue-700' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Toggle Light / Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          {/* User Profile Avatar Footer Button */}
          <button
            onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
            className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-900 dark:text-white">{userName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userSubtitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. FULL-SCREEN CANVAS & TOP HEADER                                        */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        
        {/* Top Header Bar */}
        <header className={`h-16 border-b px-8 flex items-center justify-between shrink-0 shadow-sm transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              {activeNavItem.label}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <span className="bg-teal-50 text-teal-700 border border-teal-200 font-medium px-3 py-1 rounded-full text-xs flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> HIPAA Encrypted
            </span>

            {/* i18n Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-xs font-mono">
              <Globe className="w-3.5 h-3.5 ml-1.5 text-teal-600 dark:text-teal-400" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-lg ${language === 'en' ? 'bg-blue-900 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded-lg ${language === 'hi' ? 'bg-blue-900 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded-lg ${language === 'mr' ? 'bg-blue-900 text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              >
                मराठी
              </button>
            </div>

            {/* Interactive User Avatar Badge */}
            <button
              onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
              className="w-9 h-9 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-500/40 shadow-sm hover:scale-105 transition-transform"
              title="Click to view User Profile Info"
            >
              {userName.charAt(0)}
            </button>
          </div>
        </header>

        {/* User Profile Info Dropdown Modal */}
        {isProfileModalOpen && (
          <div className="absolute top-18 right-8 z-50 w-80 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-3 font-sans">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{userName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userSubtitle}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Account Role:</span>
                <span className="font-bold text-teal-700 dark:text-teal-400 uppercase">{role}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Level:</span>
                <span className="font-bold text-slate-900 dark:text-white">HIPAA Verified</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => { onTabChange('settings'); setIsProfileModalOpen(false); }}
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center"
              >
                <Settings className="w-3.5 h-3.5 mr-1" /> Profile Settings
              </button>
              <Link href="/api/logout" className="text-xs font-semibold text-rose-600 hover:underline flex items-center">
                <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
              </Link>
            </div>
          </div>
        )}

        {/* Main Dashboard Canvas - Expanded to Fill 100% Screen Width */}
        <main className="flex-1 w-full min-h-screen p-6 md:p-8 space-y-6 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
