import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TeamHQ — Team Performance Tracker',
  description:
    'Track team performance, manage projects, monitor deadlines, and generate end-of-month reports. Built for managers who want clarity.',
  keywords: ['team management', 'performance tracking', 'project management', 'task tracker'],
};

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
