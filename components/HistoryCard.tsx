import React, { useState, useEffect } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';

interface HistoryCardProps {
  appointment: HistoricalAppointment;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
  isThreadItem?: boolean;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ appointment, onUpdateStatus, onDelete, onFollowUp, onReschedule, onReminder, isThreadItem = false }) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [now, setNow] = useState(Date.now());

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
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      const apptTime = new Date(year, month - 1, day, hours, minutes).getTime();
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className={`relative overflow-hidden ${isThreadItem ? 'rounded-xl mt-2 first:mt-0 border-l-4 border-[#006b5f]/40' : 'rounded-2xl ambient-shadow'}`}>
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
          <span className="text-[10px] font-extrabold uppercase tracking-tight">Confirm</span>
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
          <span className="text-[10px] font-extrabold uppercase tracking-tight">Cancel</span>
        </button>
      </div>


      {/* Main Content Card */}
      <div 
        className={`relative z-10 ${isThreadItem ? 'bg-slate-50 p-2.5' : 'bg-white p-3'} transition-transform duration-300 ease-out border border-slate-100 ${isThreadItem ? 'rounded-xl' : 'rounded-2xl'} ${isSwiped ? '-translate-x-[60%]' : 'translate-x-0'}`}

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
        <div className="flex items-start gap-3">
          {/* Avatar - Hidden in thread view */}
          {!isThreadItem && (
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#f1f5f9] flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
              {appointment.contact.avatar.startsWith('http') ? (
                <img src={appointment.contact.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[14px] font-bold text-[#64748B]">
                  {appointment.contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {!isThreadItem && (
              <h3 className="text-[15px] font-bold text-[#131b2e] truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {appointment.contact.name}
              </h3>
            )}
            <p className="text-[13px] font-bold text-[#131b2e]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {formatDate(appointment.date)}, {formatTime(appointment.time)}
            </p>
            <p className="text-[11px] text-[#6b7a76] truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {appointment.address}
            </p>
          </div>

          {/* Status & Reschedule */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${config.bg} ${config.text} ${config.pulse}`}>
              {config.label}
            </span>
            {appointment.status === 'PENDING' ? (
              <button 
                onClick={() => onFollowUp(appointment)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a93349] text-white rounded-lg text-[10px] font-bold shadow-md active:scale-95 transition-all animate-bounce-subtle whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                FOLLOW UP
              </button>
            ) : appointment.status === 'CONFIRMED' ? (
              <div className="flex gap-1">
                <button 
                  onClick={() => onReminder(appointment)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-[#006b5f] text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[13px]">notifications_active</span>
                  REMIND
                </button>
                <button 
                  onClick={() => onReschedule(appointment)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
                >
                  Reschedule
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onReschedule(appointment)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#006b5f] text-white rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Reschedule
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-4">
          <button className="flex items-center gap-1 text-[#006b5f] text-[11px] font-bold">
            <span className="material-symbols-outlined text-[14px]">edit_note</span>
            Edit
          </button>
          <button className="text-[#bacac5] hover:text-[#006b5f] transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(appointment.id);
            }}
            className="text-[#f43f5e] hover:brightness-110 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
          
          {appointment.status === 'PENDING' && (
            <div className="ml-auto text-[10px] font-extrabold text-[#9a3412] flex items-center gap-1 bg-[#ffedd5] px-2.5 py-0.5 rounded-full border border-[#9a3412]/10 shadow-sm animate-pulse" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              Pending for: {formatElapsedTime(appointment.sentAt)}
            </div>
          )}

          {appointment.status === 'SENT' && (
            <div className="ml-auto text-[10px] font-extrabold text-[#3c4a46] flex items-center gap-1 bg-[#eaedff] px-2.5 py-0.5 rounded-full border border-[#eaedff]/20 shadow-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="material-symbols-outlined text-[12px]">hourglass_empty</span>
              Waiting: {formatElapsedTime(appointment.sentAt)}
            </div>
          )}

          {appointment.status === 'CONFIRMED' && (
            <div className="ml-auto text-[10px] font-extrabold text-[#065f46] flex items-center gap-1 bg-[#d1fae5] px-2.5 py-0.5 rounded-full border border-[#065f46]/10 shadow-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="material-symbols-outlined text-[12px]">alarm</span>
              Meeting in: {formatCountdown(appointment.date, appointment.time)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HistoryCard;
