import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobBoard | Find your next career opportunity',
  description: 'Apply to engineering, design, product, and sales jobs or post listings to recruit top candidate talent.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              className: 'dark:bg-slate-800 dark:text-white dark:border-slate-700 border border-slate-100 font-medium text-sm rounded-xl px-4 py-3 shadow-lg',
              success: {
                iconTheme: {
                  primary: '#4f46e5',
                  secondary: '#.../vercel.json', // ignore or customize
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
