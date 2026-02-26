
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 bg-background-light dark:bg-background-dark">
      {/* Phone Frame */}
      <div className="relative w-full max-w-[390px] h-screen md:h-[844px] bg-slate-100 dark:bg-[#020617] md:rounded-[3rem] md:shadow-2xl overflow-hidden md:border-[8px] border-slate-900 dark:border-slate-800 transition-all duration-500">

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Main Content Area */}
        <div className="relative h-full flex flex-col pt-14 pb-8 px-6 overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
