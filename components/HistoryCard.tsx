import React, { useState, useEffect } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';

interface HistoryCardProps {
  appointment: HistoricalAppointment;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
  onRebook: (appointment: HistoricalAppointment) => void;
  onEditNotes: (appointment: HistoricalAppointment) => void;
  isThreadItem?: boolean;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ 
  appointment, 
  onUpdateStatus, 
  onDelete, 
  onFollowUp, 
  onReschedule, 
  onReminder, 
  onRebook,
  onEditNotes,
  isThreadItem = false 
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPast = (() => {
    try {
      const [year, month, day] = appointment.date.split('-').map(Number);
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const apptTime = new Date(year, month - 1, day, hours, minutes).getTime();
      return apptTime < now;
    } catch (e) {
      return false;
    }
  })();

  useEffect(() => {
    if (appointment.status !== 'PENDING' && appointment.status !== 'SENT' && appointment.status !== 'CONFIRMED') return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [appointment.status]);

  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case 'SENT':
        return { bg: 'bg-[#eaedff]', text: 'text-[#6b7a76]', label: 'SENT', pulse: '' };
      case 'CONFIRMED':
        return { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', label: 'CONFIRMED', pulse: '' };
      case 'RESCHEDULED':
        return { bg: 'bg-[#fffbeb]', text: 'text-[#b45309]', label: 'RESCHEDULED', pulse: 'bounce-subtle' };
      case 'NO-SHOW':
        return { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', label: 'NO-SHOW', pulse: '' };
      case 'PENDING':
        return { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]', label: 'PENDING', pulse: 'status-pulse-amber' };
      case 'CANCELLED':
        return { bg: 'bg-slate-100', text: 'text-slate-500', label: 'CANCELLED', pulse: '' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-500', label: status, pulse: '' };
    }
  };

  const config = getStatusConfig(appointment.status);

  const formatElapsedTime = (sentAt: number) => {
    if (!sentAt || isNaN(sentAt)) return '';
    const diff = now - sentAt;
    const totalSecs = Math.floor(diff / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    const hrs = Math.floor(mins / 60);
    
    const formattedSecs = secs.toString().padStart(2, '0');
    
    if (hrs > 0) {
      const formattedMins = (mins % 60).toString().padStart(2, '0');
      return `${hrs}h ${formattedMins}m ${formattedSecs}s`;
    }
    const formattedMins = mins.toString().padStart(2, '0');
    return `${formattedMins}m ${formattedSecs}s`;
  };

  const formatCountdown = (dateStr: string, timeStr: string) => {
    try {
      if (!dateStr || !timeStr) return '';
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const apptTime = new Date(year, month - 1, day, hours, minutes).getTime();
      if (isNaN(apptTime)) return '';
      const diff = apptTime - now;

      if (diff <= 0) return 'Meeting Started';

      const totalSecs = Math.floor(diff / 1000);
      const secs = totalSecs % 60;
      const totalMins = Math.floor(totalSecs / 60);
      const mins = totalMins % 60;
      const hrs = Math.floor(totalMins / 60);

      const formattedSecs = secs.toString().padStart(2, '0');
      const formattedMins = mins.toString().padStart(2, '0');

      if (hrs > 0) return `${hrs}h ${formattedMins}m ${formattedSecs}s`;
      return `${formattedMins}m ${formattedSecs}s`;
    } catch (e) {
      return '';
    }
  };


  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'NO DATE';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'INVALID DATE';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    } catch (e) {
      return 'INVALID DATE';
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      if (!timeStr) return '';
      const [h, m] = timeStr.split(':');
      if (h === undefined || m === undefined) return '';
      const hr = parseInt(h);
      if (isNaN(hr)) return '';
      const ampm = hr >= 12 ? 'PM' : 'AM';
      return `${hr % 12 || 12}:${m} ${ampm}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`relative overflow-hidden ${isThreadItem ? 'rounded-xl mt-2 first:mt-0' : 'rounded-2xl ambient-shadow'}`}>
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex justify-end">
        <button 
          onClick={() => {
            onUpdateStatus(appointment.id, 'CONFIRMED');
            setIsSwiped(false);
          }}
          className="w-[30%] h-full bg-gradient-to-br from-[#006b5f] to-[#00574d] text-white flex flex-col items-center justify-center gap-1.5 border-l border-white/10"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <span className="txt-label-caps text-white text-[10px]">Confirm</span>
        </button>
        <button 
          onClick={() => {
            onUpdateStatus(appointment.id, 'CANCELLED');
            setIsSwiped(false);
          }}
          className="w-[30%] h-full bg-gradient-to-br from-[#f43f5e] to-[#e11d48] text-white flex flex-col items-center justify-center gap-1.5"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">block</span>
          </div>
          <span className="txt-label-caps text-white text-[10px]">Cancel</span>
        </button>
      </div>


      {/* Main Content Card */}
      <div 
        className={`relative z-10 w-full ${isThreadItem ? 'bg-slate-50 pl-4 pr-3 pt-3 pb-4' : 'bg-white p-3'} transition-transform duration-300 ease-out border border-slate-100 ${isThreadItem ? 'rounded-xl' : 'rounded-2xl'} ${isSwiped ? '-translate-x-[60%]' : 'translate-x-0'}`}

        onTouchStart={(e) => {
          const touch = e.touches[0];
          const startX = touch.clientX;
          const handleTouchEnd = (ee: TouchEvent) => {
            const endX = ee.changedTouches[0].clientX;
            if (startX - endX > 50) setIsSwiped(true);
            if (endX - startX > 50) setIsSwiped(false);
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd);
        }}
        onClick={() => {
          if (isSwiped) setIsSwiped(false);
        }}
      >
        <div className="flex flex-col gap-2.5">
          {/* Row 1: Info and Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar - Hidden in thread view */}
              {!isThreadItem && (
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#f1f5f9] flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                  {appointment.contact.avatar.startsWith('http') ? (
                    <img src={appointment.contact.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="txt-title text-[#64748B]">
                      {appointment.contact.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                {!isThreadItem && (
                  <h3 className="txt-title text-[#131b2e] truncate">
                    {appointment.contact.name}
                  </h3>
                )}
                <p className="txt-body font-bold text-[#131b2e] whitespace-nowrap truncate">
                  {formatDate(appointment.date)}, {formatTime(appointment.time)}
                </p>
                <p className="txt-caption text-[#6b7a76] truncate">
                  {appointment.address}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-2.5 py-0.5 rounded-full txt-label-caps text-[9px] ${config.bg} ${config.text} ${config.pulse} flex-shrink-0`}>
              {config.label}
            </span>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            {isPast ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRebook(appointment);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006b5f] text-white rounded-lg txt-label-caps shadow-sm active:scale-95 hover:bg-[#00574d] transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                REBOOK
              </button>
            ) : appointment.status === 'PENDING' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowUp(appointment);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a93349] text-white rounded-lg txt-label-caps shadow-sm active:scale-95 hover:bg-[#8f283b] transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                FOLLOW UP
              </button>
            ) : appointment.status === 'CONFIRMED' ? (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReminder(appointment);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#006b5f] text-white rounded-lg txt-label-caps shadow-sm active:scale-95 hover:bg-[#00574d] transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                  REMIND
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule(appointment);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg txt-label-caps shadow-sm active:scale-95 hover:bg-slate-200 transition-all whitespace-nowrap"
                >
                  Reschedule
                </button>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(appointment);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#006b5f] text-white rounded-lg txt-label-caps shadow-sm active:scale-95 hover:bg-[#00574d] transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Reschedule
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-start min-h-[48px]">
          {confirmDelete ? (
            <div className="flex items-center justify-between w-full py-1">
              <span className="txt-caption font-bold text-[#f43f5e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Delete appointment?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg txt-label-caps transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(appointment.id);
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 bg-[#f43f5e] hover:bg-rose-600 text-white rounded-lg txt-label-caps transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center flex-shrink-0 gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPast) {
                      onEditNotes(appointment);
                    } else {
                      onReschedule(appointment);
                    }
                  }}
                  aria-label={isPast ? 'Notes' : 'Edit'}
                  className={`flex items-center justify-center text-[#006b5f] hover:bg-[#006b5f]/5 rounded-xl transition-all ${isThreadItem ? 'w-12 h-12 ml-0' : 'px-3 -ml-3 gap-1.5 min-h-[48px]'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{isPast ? 'description' : 'edit_note'}</span>
                  {!isThreadItem && (isPast ? 'Notes' : 'Edit')}
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  aria-label="Delete"
                  className="text-[#f43f5e] hover:brightness-110 transition-colors w-12 h-12 flex items-center justify-center hover:bg-rose-50 rounded-xl"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              
              {isPast ? (
                <div 
                  className={`${isThreadItem ? 'ml-4 mr-0 px-2 py-0.5 text-[10px]' : 'ml-6 mr-0 px-2.5 py-1'} txt-label-caps text-[#5F6368] flex items-center gap-1 bg-[#F1F3F4] rounded-full border border-slate-200/50 shadow-sm whitespace-nowrap flex-shrink-0`} 
                >
                  <span className="material-symbols-outlined text-[12px] text-[#5F6368]">done</span>
                  {appointment.status === 'CONFIRMED' ? 'Completed' : (isThreadItem ? 'Past' : 'Past Event')}
                </div>
              ) : (
                <>
                  {appointment.status === 'PENDING' && (
                    <div 
                      className={`${isThreadItem ? 'ml-4 mr-0 px-2 py-0.5 text-[10px]' : 'ml-6 mr-0 px-2.5 py-1'} txt-label-caps text-[#9a3412] flex items-center gap-1 bg-[#ffedd5] rounded-full border border-[#9a3412]/10 shadow-sm animate-pulse whitespace-nowrap flex-shrink-0`} 
                    >
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {isThreadItem ? 'Pend: ' : 'Pending: '}{formatElapsedTime(appointment.sentAt)}
                    </div>
                  )}

                  {appointment.status === 'SENT' && (
                    <div 
                      className={`${isThreadItem ? 'ml-4 mr-0 px-2 py-0.5 text-[10px]' : 'ml-6 mr-0 px-2.5 py-1'} txt-label-caps text-[#3c4a46] flex items-center gap-1 bg-[#eaedff] rounded-full border border-[#eaedff]/20 shadow-sm whitespace-nowrap flex-shrink-0`} 
                    >
                      <span className="material-symbols-outlined text-[12px]">hourglass_empty</span>
                      {isThreadItem ? 'Wait: ' : 'Waiting: '}{formatElapsedTime(appointment.sentAt)}
                    </div>
                  )}

                  {appointment.status === 'CONFIRMED' && (
                    <div 
                      className={`${isThreadItem ? 'ml-4 mr-0 px-2 py-0.5 text-[10px]' : 'ml-6 mr-0 px-2.5 py-1'} txt-label-caps text-[#065f46] flex items-center gap-1 bg-[#d1fae5] rounded-full border border-[#065f46]/10 shadow-sm whitespace-nowrap flex-shrink-0`} 
                    >
                      <span className="material-symbols-outlined text-[12px]">alarm</span>
                      {isThreadItem ? 'In: ' : 'Meeting in: '}{formatCountdown(appointment.date, appointment.time)}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default HistoryCard;
