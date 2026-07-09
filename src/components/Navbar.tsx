'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sun, Moon, Briefcase, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-xl">
              <div className="bg-indigo-600 dark:bg-indigo-500 p-1.5 rounded-lg text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <span>JobBoard</span>
            </Link>
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Browse Jobs
            </Link>

            {user && user.role === 'JOB_SEEKER' && (
              <Link
                href="/seeker"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/seeker')
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Seeker Dashboard
              </Link>
            )}

            {user && user.role === 'EMPLOYER' && (
              <Link
                href="/employer"
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/employer')
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Employer Dashboard
              </Link>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User credentials / Auth triggers */}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {user.role.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800">
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2 text-base font-medium rounded-md px-3 ${
              isActive('/') 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Browse Jobs
          </Link>

          {user && user.role === 'JOB_SEEKER' && (
            <Link
              href="/seeker"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-base font-medium rounded-md px-3 ${
                isActive('/seeker')
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Seeker Dashboard
            </Link>
          )}

          {user && user.role === 'EMPLOYER' && (
            <Link
              href="/employer"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-base font-medium rounded-md px-3 ${
                isActive('/employer')
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Employer Dashboard
            </Link>
          )}

          {user ? (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
