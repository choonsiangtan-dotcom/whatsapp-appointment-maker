import React, { useState } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';
import HistoryCard from './HistoryCard';

interface ContactHistoryGroupProps {
  appointments: HistoricalAppointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
}

const ContactHistoryGroup: React.FC<ContactHistoryGroupProps> = ({ 
  appointments, 
  onUpdateStatus, 
  onDelete, 
  onFollowUp, 
  onReschedule,
  onReminder
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  // If no appointments, render nothing
  if (appointments.length === 0) return null;

  const contact = appointments[0].contact;

  // Determine the most urgent status
  const statusPriority: Record<AppointmentStatus, number> = {
    PENDING: 1,
    RESCHEDULED: 2,
    SENT: 3,
    CONFIRMED: 4,
    'NO-SHOW': 5,
    CANCELLED: 6
  };

  const mostUrgentAppt = [...appointments].sort((a, b) => {
    return statusPriority[a.status] - statusPriority[b.status];
  })[0];
  
  const dominantStatus = mostUrgentAppt.status;

  const getStatusConfig = (status: AppointmentStatus) => {
    switch (status) {
      case 'SENT':
        return { bg: 'bg-[#eaedff]', text: 'text-[#6b7a76]', border: 'border-l-[#6b7a76]', label: 'SENT', pulse: '' };
      case 'CONFIRMED':
        return { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', border: 'border-l-[#065f46]', label: 'CONFIRMED', pulse: '' };
      case 'RESCHEDULED':
        return { bg: 'bg-[#fffbeb]', text: 'text-[#b45309]', border: 'border-l-[#b45309]', label: 'RESCHEDULED', pulse: 'animate-bounce-subtle' };
      case 'NO-SHOW':
        return { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', border: 'border-l-[#991b1b]', label: 'NO-SHOW', pulse: '' };
      case 'PENDING':
        return { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]', border: 'border-l-[#f59e0b]', label: 'PENDING', pulse: 'status-pulse-amber' };
      case 'CANCELLED':
        return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-l-slate-300', label: 'CANCELLED', pulse: '' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-l-slate-300', label: status, pulse: '' };
    }
  };

  const config = getStatusConfig(dominantStatus);

  // Sorting & Archiving Logic
  const now = new Date();
  
  const isPast = (date: string, time: string) => {
    const apptDate = new Date(`${date}T${time}`);
    return apptDate < now;
  };

  const activeItems: HistoricalAppointment[] = [];
  const archivedItems: HistoricalAppointment[] = [];

  appointments.forEach(appt => {
    const passed = isPast(appt.date, appt.time);
    const isArchivableStatus = appt.status === 'CONFIRMED' || appt.status === 'NO-SHOW';
    
    if (passed && isArchivableStatus) {
      archivedItems.push(appt);
    } else {
      activeItems.push(appt);
    }
  });

  const activeConflictCount = activeItems.filter(a => 
    a.status === 'SENT' || a.status === 'PENDING' || a.status === 'RESCHEDULED'
  ).length;

  const sortedActive = [...activeItems].sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time}`).getTime();
    const bTime = new Date(`${b.date}T${b.time}`).getTime();
    return bTime - aTime;
  });

  const sortedArchived = [...archivedItems].sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time}`).getTime();
    const bTime = new Date(`${b.date}T${b.time}`).getTime();
    return bTime - aTime;
  });
  
  const nextAppt = sortedActive.length > 0 ? sortedActive[0] : sortedArchived[0];

  const pendingAppt = activeItems.find(a => a.status === 'PENDING');
  const confirmedAppt = activeItems.find(a => a.status === 'CONFIRMED');

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
    <div className={`bg-white rounded-2xl ambient-shadow border border-slate-100 border-l-[6px] ${config.border} mb-3 overflow-hidden transition-all duration-300`}>
      {/* Primary Card (Collapsed view header) */}
      <div 
        className="p-3 cursor-pointer flex items-center gap-3 active:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f1f5f9] flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
          {contact.avatar.startsWith('http') ? (
            <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[14px] font-bold text-[#64748B]">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top Row: Name (60%) and Actions (40%) */}
          <div className="flex items-start justify-between mb-1.5">
            <div className="max-w-[60%] flex-1">
              <h3 className="text-[16px] font-bold text-[#131b2e] truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {contact.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {pendingAppt && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowUp(pendingAppt);
                  }}
                  className="flex items-center justify-center w-7 h-7 bg-[#a93349] text-white rounded-full hover:brightness-115 transition-all shadow-sm active:scale-95"
                  title="Nudge"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                </button>
              )}
              {confirmedAppt && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReminder(confirmedAppt);
                  }}
                  className="flex items-center justify-center w-7 h-7 bg-[#006b5f] text-white rounded-full hover:brightness-115 transition-all shadow-sm active:scale-95"
                  title="Remind"
                >
                  <span className="material-symbols-outlined text-[15px]">notifications_active</span>
                </button>
              )}
              <div className="flex items-center gap-1">
                {activeConflictCount > 1 && (
                  <span className="px-1 py-0.5 rounded bg-red-50 text-red-600 text-[8px] font-bold border border-red-100 uppercase tracking-tighter">
                    {activeConflictCount}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${config.bg} ${config.text} ${config.pulse}`}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Next Date and Expand indicator */}
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#6b7a76] font-medium truncate flex-1 mr-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Next: {formatDate(nextAppt.date)}, {formatTime(nextAppt.time)}
            </p>
            
            <div className="flex items-center gap-1 text-[#006b5f] bg-slate-50/80 px-1.5 py-0.5 rounded-md flex-shrink-0 border border-slate-100">
              <span className="text-[10px] font-bold whitespace-nowrap">{appointments.length} {appointments.length > 1 ? 'Appts' : 'Appt'}</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Thread */}
      <div 
        className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
      >
        <div className="p-3 pt-0 border-t border-slate-50 bg-[#f8fafc]/50">
          <div className="pl-6 border-l-2 border-[#bacac5]/30 ml-4 py-2 space-y-0 relative">
            {/* Active Thread */}
            <div className="absolute left-[-5px] top-4 w-2 h-2 rounded-full bg-[#bacac5]"></div>
            
            {sortedActive.map((appt) => (
              <HistoryCard 
                key={appt.id} 
                appointment={appt} 
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onFollowUp={onFollowUp}
                onReschedule={onReschedule}
                onReminder={onReminder}
                isThreadItem={true}
              />
            ))}

            {/* Archives Section */}
            {sortedArchived.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsArchiveExpanded(!isArchiveExpanded);
                  }}
                  className="flex items-center gap-2 py-2 text-[#64748B] hover:text-[#131b2e] transition-colors"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">Archives ({sortedArchived.length})</span>
                  <span className={`material-symbols-outlined text-[14px] transition-transform ${isArchiveExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                <div className={`transition-all duration-300 overflow-hidden ${isArchiveExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                  {sortedArchived.map((appt) => (
                    <HistoryCard 
                      key={appt.id} 
                      appointment={appt} 
                      onUpdateStatus={onUpdateStatus}
                      onDelete={onDelete}
                      onFollowUp={onFollowUp}
                      onReschedule={onReschedule}
                      onReminder={onReminder}
                      isThreadItem={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactHistoryGroup;
