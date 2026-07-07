import React from 'react';
import { HistoricalAppointment } from '../types';

interface DashboardProps {
  appointments: HistoricalAppointment[];
  todayAppointmentsCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, todayAppointmentsCount }) => {
  const [currentActiveIndex, setCurrentActiveIndex] = React.useState(0);
  const [displayedIndex, setDisplayedIndex] = React.useState(0);
  const [isFading, setIsFading] = React.useState(false);
  const bubbleRowRef = React.useRef<HTMLDivElement>(null);
  const [userHasSelected, setUserHasSelected] = React.useState(false);

  React.useEffect(() => {
    setUserHasSelected(false);
  }, [appointments]);

  // 1. Calculate closestIndex (closest appointment to the live system clock on boot)
  const closestIndex = React.useMemo(() => {
    if (appointments.length === 0) return 0;
    const now = Date.now();
    let minIndex = 0;
    let minDiff = Infinity;
    
    appointments.forEach((appt, index) => {
      try {
        const [year, month, day] = appt.date.split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const apptTime = new Date(year, month - 1, day, hours, minutes).getTime();
        const diff = Math.abs(apptTime - now);
        if (diff < minDiff) {
          minDiff = diff;
          minIndex = index;
        }
      } catch (e) {
        // ignore parsing errors
      }
    });
    return minIndex;
  }, [appointments]);

  // Set initial active index to closestIndex on initial mount
  React.useEffect(() => {
    setCurrentActiveIndex(closestIndex);
    setDisplayedIndex(closestIndex);
  }, [closestIndex]);

  // 1.5. Calculate today's reactive appointments count (timezone safe)
  const todayAppointmentsCountDynamic = React.useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return appointments.filter(appt => appt.date === todayStr).length;
  }, [appointments]);

  const showEmptyCard = appointments.length === 0 || (todayAppointmentsCountDynamic === 0 && !userHasSelected);

  // 2. Identify if an index matches current hour running timeline ("NOW")
  const isNowIndex = React.useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentHour = now.getHours();

    return appointments.findIndex(appt => {
      if (appt.date !== todayStr) return false;
      const [h] = appt.time.split(':').map(Number);
      return h === currentHour;
    });
  }, [appointments]);

  // 3. Scroll top Bubble Row horizontally to center selected node
  React.useEffect(() => {
    if (bubbleRowRef.current) {
      const activeBubble = document.getElementById(`bubble-node-${currentActiveIndex}`);
      if (activeBubble) {
        const container = bubbleRowRef.current;
        const containerWidth = container.offsetWidth;
        const bubbleLeft = activeBubble.offsetLeft;
        const bubbleWidth = activeBubble.offsetWidth;
        container.scrollTo({
          left: bubbleLeft - (containerWidth / 2) + (bubbleWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [currentActiveIndex]);

  // 4. Manage the cross-fade animation when changing active appointment
  React.useEffect(() => {
    if (currentActiveIndex !== displayedIndex) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplayedIndex(currentActiveIndex);
        setIsFading(false);
      }, 100); // 100ms fade out, 100ms fade in = 200ms total
      return () => clearTimeout(timer);
    }
  }, [currentActiveIndex, displayedIndex]);

  // Helper to format 24h time to 12h AM/PM
  const formatTime12h = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':');
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const hr12 = hr % 12 || 12;
      return `${hr12}:${m} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const activeAppt = appointments[displayedIndex] || appointments[0] || null;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      
      {/* TIMELINE Header Block */}
      <div className="flex flex-col px-1 flex-shrink-0" style={{ marginBottom: '8px' }}>
        <h2 className="text-[20px] font-extrabold tracking-tight text-[#131b2e] dark:text-slate-100 font-display uppercase leading-none">
          TIMELINE
        </h2>
        <span 
          className="text-slate-400 dark:text-slate-500 text-[13px] font-medium"
          style={{ marginTop: '4px', lineHeight: '1' }}
        >
          {formattedDate}
        </span>
      </div>
      
      {/* 🟢 1. TOP TIMELINE COMPACT BUBBLE ROW */}
      <div className="flex-shrink-0 py-3 border-b border-[#bacac5]/10 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm -mx-4 px-4 overflow-hidden">
        <div 
          ref={bubbleRowRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{ scrollPaddingLeft: '16px', scrollPaddingRight: '16px' }}
        >
          {appointments.map((appt, index) => {
            const isSelected = index === currentActiveIndex;
            const isNow = index === isNowIndex;

            return (
              <div
                key={appt.id}
                id={`bubble-node-${index}`}
                onClick={() => {
                  setCurrentActiveIndex(index);
                  setUserHasSelected(true);
                }}
                className={`snap-center flex flex-col items-center flex-shrink-0 transition-all duration-300 ${
                  isSelected ? 'scale-105' : 'opacity-65 scale-95'
                } cursor-pointer`}
                style={{ width: '64px' }}
              >
                {/* Bubble Circle */}
                <div 
                  className={`rounded-full transition-all duration-300 ${
                    isSelected 
                      ? 'bg-[#006b5f] text-white concentric-bubble' 
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                  }`}
                  style={{
                    width: isSelected ? '46px' : '52px',
                    height: isSelected ? '46px' : '52px',
                    margin: isSelected ? '5px' : '2px', // Centers it within the same 56px visual bounding box
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      lineHeight: '1',
                      transform: 'translateY(1px)', // typographical vertical centering correction
                      display: 'inline-block'
                    }}
                  >
                    {appt.time}
                  </span>
                </div>

                {/* Sub-label client first name or NOW */}
                <span 
                  className={`text-[10px] font-bold text-center w-full truncate tracking-wider uppercase ${
                    isSelected ? 'text-[#006b5f] dark:text-teal-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={{ marginTop: '4px', display: 'block' }}
                >
                  {isNow ? 'NOW' : appt.contact.name.trim().split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔗 2. SINGLE DIRECTION HERO CARD (NON-SCROLL CONTAINER) */}
      <div className="flex-1 w-full min-h-0 relative my-4 flex items-center justify-center p-2">
        {showEmptyCard ? (
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-[#bacac5]/20 dark:border-slate-800 shadow-xl dark:shadow-slate-950/40 p-6 flex flex-col items-center justify-center h-[360px] text-center">
            <div className="w-12 h-12 rounded-full bg-[#006b5f]/5 flex items-center justify-center text-[#006b5f] mb-3">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <h3 className="text-[18px] font-extrabold text-[#131b2e] dark:text-slate-100 font-display">
              {appointments.length === 0 ? 'No Bookings Scheduled' : 'All done for today!'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-[200px]">
              {appointments.length === 0 
                ? 'Schedule and confirm client sessions to populate your timeline.'
                : 'No remaining appointments scheduled for the rest of today.'}
            </p>
          </div>
        ) : (
          /* Premium Capsule Card with Cross-fade transition */
          <div className={`w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-[#bacac5]/20 dark:border-slate-800 shadow-xl dark:shadow-slate-950/40 p-6 flex flex-col justify-between h-[360px] transition-opacity duration-100 ease-in-out ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}>
            
            {/* Layer 1: Header Label */}
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-1">
                NEXT APPOINTMENT
              </span>

              {/* Layer 2: Massive Serif/Bold Name */}
              <h2 className="text-[30px] font-extrabold text-[#131b2e] dark:text-slate-100 font-serif leading-[1.1] tracking-tight mt-1 mb-3 line-clamp-2">
                {activeAppt?.contact?.name}
              </h2>
            </div>

            {/* Layer 3: Badge Row */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#006b5f] text-white px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                {activeAppt ? formatTime12h(activeAppt.time) : ''}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {activeAppt?.notes || 'General Session'}
              </span>
            </div>

            {/* Layers 4 & 5: Interactive Action Blocks */}
            <div className="space-y-2 mt-auto">
              {/* Location Block */}
              <div 
                onClick={() => activeAppt && window.open(`https://maps.google.com/?q=${encodeURIComponent(activeAppt.address)}`, '_system')}
                className="bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/15 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors border border-blue-100/30 dark:border-blue-900/20"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <span className="text-xs font-bold truncate flex-1">
                  {activeAppt?.address || 'No Address Provided'}
                </span>
              </div>

              {/* Mobile Block */}
              <div 
                onClick={() => activeAppt && window.open(`tel:${activeAppt.selectedPhoneNumber}`, '_system')}
                className="bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/15 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors border border-blue-100/30 dark:border-blue-900/20"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="text-xs font-bold truncate flex-1">
                  {activeAppt?.selectedPhoneNumber || 'No Phone Registered'}
                </span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ⚓ 3. FIXED BOTTOM SNAPSHOT FOOTER */}
      <div 
        className="flex-shrink-0 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-3.5 mb-[76px] shadow-sm flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-[#006b5f]/10 dark:bg-teal-500/10 flex items-center justify-center text-[#006b5f] dark:text-teal-400 flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider leading-none">
              Today's Snapshot
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-none truncate whitespace-nowrap">
              Total appointments today
            </p>
          </div>
        </div>
        <div className="bg-[#006b5f] text-white font-extrabold px-3 py-1 rounded-lg text-xs shadow-sm flex-shrink-0 ml-2">
          {todayAppointmentsCountDynamic} {todayAppointmentsCountDynamic === 1 ? 'Booking' : 'Bookings'}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
