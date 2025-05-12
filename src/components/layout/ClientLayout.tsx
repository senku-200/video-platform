'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Providers } from '@/app/providers';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from "@/components/layout/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <AuthProvider>
      <Providers>
        <div className="min-h-screen bg-gray-50">
          {!hideSidebar && (
            <Sidebar 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
          <main className={`min-h-screen transition-all duration-300 ${!hideSidebar && isSidebarOpen ? 'lg:ml-64' : !hideSidebar ? 'lg:ml-20' : ''}`}>
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </Providers>
    </AuthProvider>
  );
} 