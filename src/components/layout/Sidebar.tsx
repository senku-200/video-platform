'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  HomeIcon, 
  VideoCameraIcon, 
  CloudArrowUpIcon as CloudUploadIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as CloseIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const menuItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Upload', href: '/upload', icon: CloudUploadIcon },
    { name: 'Video Chat', href: '/video-chat', icon: VideoCameraIcon },
  ];

  return (
    <>
      {/* Toggle Button */}
      {/* Removed hamburger/toggle button */}
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        id="sidebar"
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          bg-gray-900 text-white
          ${isOpen ? 'w-64' : 'w-20'}
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-3">
            <VideoCameraIcon className="w-8 h-8 text-blue-500" />
            {isOpen && <span className="text-xl font-bold">VidPlatform</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`
                    flex items-center
                    ${isOpen ? 'px-4' : 'justify-center px-2'}
                    py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  onMouseEnter={() => !isOpen && setShowTooltip(item.name)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <item.icon className="w-6 h-6 flex-shrink-0" />
                  {isOpen && <span className="ml-3">{item.name}</span>}
                </Link>
                
                {/* Tooltip */}
                {showTooltip === item.name && !isOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
} 