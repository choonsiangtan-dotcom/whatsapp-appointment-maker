import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'schedule' | 'history' | 'settings';
  onPageChange: (page: 'schedule' | 'history' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 bg-[#faf8ff]">
      {/* Phone Frame */}
      <div className="relative w-full max-w-[390px] h-screen md:h-[844px] bg-[#faf8ff] md:rounded-[2.5rem] md:shadow-xl overflow-hidden transition-all duration-500">

        {/* ── Top App Bar ── */}
        <header className="absolute top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-white/90 backdrop-blur-md border-b border-[#bacac5]/20 shadow-[0_1px_8px_rgba(0,107,95,0.06)]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Logo group */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b5f] text-[20px]">
              calendar_month
            </span>
            <div>
              <h1 className="text-[16px] font-extrabold tracking-tight text-[#006b5f] leading-none" style={{ fontFamily: 'Manrope, sans-serif' }}>
                WhatsAppointment
              </h1>
              <p className="text-[8px] uppercase tracking-[0.14em] text-[#6b7a76] font-bold leading-none mt-0.5">
                Schedule &amp; send in seconds
              </p>
            </div>
          </div>

          {/* Hamburger */}
          <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f2f3ff] transition-colors text-[#6b7a76]">
            <span className="material-symbols-outlined text-[18px]">menu</span>
          </button>
        </header>

        {/* ── Scrollable Content ── */}
        <div
          className="relative h-full flex flex-col pt-[60px] pb-[70px] px-4 overflow-y-auto overflow-x-hidden hide-scrollbar"
        >
          {children}
        </div>

        {/* ── Bottom Nav Bar ── */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 h-[64px] flex justify-around items-center px-4 bg-white/85 backdrop-blur-md border-t border-[#bacac5]/20 shadow-[0_-4px_12px_rgba(45,140,140,0.05)] rounded-t-2xl"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Schedule */}
          <div 
            onClick={() => onPageChange('schedule')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${currentPage === 'schedule' ? 'bg-[#eaedff] text-[#006b5f]' : 'text-[#6b7a76] hover:text-[#006b5f]'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentPage === 'schedule' ? "'FILL' 1" : "''" }}>
              add_circle
            </span>
            <span className="text-[10px] font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Schedule</span>
          </div>

          {/* History */}
          <div 
            onClick={() => onPageChange('history')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${currentPage === 'history' ? 'bg-[#eaedff] text-[#006b5f]' : 'text-[#6b7a76] hover:text-[#006b5f]'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentPage === 'history' ? "'FILL' 1" : "''" }}>
              history
            </span>
            <span className="text-[10px] font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>History</span>
          </div>

          {/* Settings */}
          <div 
            onClick={() => onPageChange('settings')}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${currentPage === 'settings' ? 'bg-[#eaedff] text-[#006b5f]' : 'text-[#6b7a76] hover:text-[#006b5f]'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: currentPage === 'settings' ? "'FILL' 1" : "''" }}>
              settings
            </span>
            <span className="text-[10px] font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Settings</span>
          </div>

        </nav>

      </div>
    </div>
  );
};

export default Layout;
