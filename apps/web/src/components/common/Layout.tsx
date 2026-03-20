import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useProjectStore } from '../../stores/projectStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { error, clearError } = useProjectStore();

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Error Banner */}
        {error && (
          <div className="flex-shrink-0 bg-red-900/30 border-b border-red-700/50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-red-300 truncate mr-4">{error}</span>
            <button onClick={clearError} className="text-xs text-red-400 hover:text-red-200 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Page Content - extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
