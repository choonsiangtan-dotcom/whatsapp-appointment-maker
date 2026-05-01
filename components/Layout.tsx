
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 bg-background-light dark:bg-slate-950">
      {/* Phone Frame */}
      <div className="relative w-full max-w-[390px] h-screen md:h-[844px] bg-background-light dark:bg-background-dark md:rounded-[2.5rem] md:shadow-xl overflow-hidden md:border-[6px] border-slate-900 dark:border-slate-800 transition-all duration-500 pt-[env(safe-area-inset-top)]">
        
        {/* Main Content Area */}
        <div className="relative h-full flex flex-col pt-12 pb-8 px-5 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
