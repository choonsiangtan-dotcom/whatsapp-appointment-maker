import React, { useState } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';
import HistoryCard from './HistoryCard';

interface ContactHistoryGroupProps {
  appointments: HistoricalAppointment[];
  onUpdateStatus: (id: string, status: AppointmentStatus, forcePast?: boolean) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
  onRebook: (appointment: HistoricalAppointment) => void;
    onEditNotes: (appointment: HistoricalAppointment) => void;
  onOpenClientHistory: (contact: any) => void;
}

const ContactHistoryGroup: React.FC<ContactHistoryGroupProps> = ({ 
  appointments, 
  onUpdateStatus, 
  onDelete, 
  onArchive,
  onFollowUp, 
  onReschedule,
  onReminder,
  onRebook,
  onEditNotes,
  onOpenClientHistory
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        return { bg: 'bg-[#eaedff]', text: 'text-[#6b7a76]', label: 'SENT', pulse: '' };
      case 'CONFIRMED':
        return { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', label: 'CONFIRMED', pulse: '' };
      case 'RESCHEDULED':
        return { bg: 'bg-[#fffbeb]', text: 'text-[#b45309]', label: 'RESCHEDULED', pulse: '' };
      case 'NO-SHOW':
        return { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', label: 'NO-SHOW', pulse: '' };
      case 'PENDING':
        return { bg: 'bg-[#ffedd5]', text: 'text-[#9a3412]', label: 'PENDING', pulse: 'animate-pulse' };
      case 'CANCELLED':
        return { bg: 'bg-slate-100', text: 'text-slate-500', label: 'CANCELLED', pulse: '' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-500', label: status, pulse: '' };
    }
  };

  const config = getStatusConfig(dominantStatus);

  // Sorting & Archiving Logic
  const now = new Date();
  
  const getAppointmentTimestamp = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes).getTime();
    } catch (e) {
      return 0;
    }
  };

  const isPast = (date: string, time: string) => {
    return getAppointmentTimestamp(date, time) < now.getTime();
  };

  const activeItems: HistoricalAppointment[] = [];
  const archivedItems: HistoricalAppointment[] = [];

  appointments.forEach(appt => {
    const passed = isPast(appt.date, appt.time);
    const isArchivableStatus = appt.status === 'CONFIRMED' || appt.status === 'NO-SHOW';
    
    if (appt.isArchived === true || (passed && isArchivableStatus && appt.isArchived !== false)) {
      archivedItems.push(appt);
    } else {
      activeItems.push(appt);
    }
  });

  const activeConflictCount = activeItems.filter(a => 
    a.status === 'SENT' || a.status === 'PENDING' || a.status === 'RESCHEDULED'
  ).length;

  const sortedActive = [...activeItems].sort((a, b) => {
    return getAppointmentTimestamp(b.date, b.time) - getAppointmentTimestamp(a.date, a.time);
  });

  const sortedArchived = [...archivedItems].sort((a, b) => {
    return getAppointmentTimestamp(b.date, b.time) - getAppointmentTimestamp(a.date, a.time);
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
    <div className="bg-white rounded-2xl border border-slate-200/60 mb-3 overflow-hidden transition-all duration-300">
      {/* Primary Card (Collapsed view header) */}
      <div 
        className="p-3 cursor-pointer flex items-center gap-3 active:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f1f5f9] flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
          {contact.avatar.startsWith('http') ? (
            <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="txt-title text-[#64748B]">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top Row: Name and Actions/Status */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-[#131b2e] leading-snug break-words">
                {contact.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
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
                  <span className="px-1 py-0.5 rounded bg-red-50 text-[8px] font-bold border border-red-100 txt-label-caps text-red-600">
                    {activeConflictCount}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full txt-label-caps text-[9px] ${config.bg} ${config.text} ${config.pulse}`}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Next Date and Expand indicator */}
          <div className="flex items-center justify-between">
            <p className="txt-caption font-medium text-[#6b7a76] truncate flex-1 mr-4">
              Next: {formatDate(nextAppt.date)}, {formatTime(nextAppt.time)}
            </p>
            
            <div className="flex items-center gap-1 text-[#006b5f] bg-slate-50/80 px-1.5 py-0.5 rounded-md flex-shrink-0 border border-slate-100">
              <span className="txt-caption font-bold text-[#006b5f] whitespace-nowrap">{appointments.length} {appointments.length > 1 ? 'Appts' : 'Appt'}</span>
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
        <div className="px-2 pb-3 pt-0 border-t border-slate-50 bg-[#f8fafc]/50">
          <div className="pl-4 border-l-2 border-[#bacac5]/30 ml-2 py-2 space-y-0 relative">
            {/* Active Thread */}
            <div className="absolute left-[-5px] top-4 w-2 h-2 rounded-full bg-[#bacac5]"></div>
            
            {sortedActive.map((appt) => (
              <HistoryCard 
                key={appt.id} 
                appointment={appt} 
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onArchive={onArchive}
                onFollowUp={onFollowUp}
                onReschedule={onReschedule}
                onReminder={onReminder}
                onRebook={onRebook}
                onEditNotes={onEditNotes}
                isThreadItem={true}
              />
            ))}

            {/* Archives Section */}
            {sortedArchived.length > 0 && (
              <div className="w-full border-t border-slate-200/80 pt-3.5 mt-3.5 flex justify-between items-center pr-2 pb-1">
                <span className="text-[12px] text-[#6b7a76] font-semibold tracking-wider font-display uppercase">
                  ARCHIVES ({sortedArchived.length})
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenClientHistory(contact);
                  }}
                  className="flex items-center gap-0.5 text-[12px] font-bold text-[#006b5f] hover:text-[#00574d] active:scale-95 transition-all font-display"
                >
                  <span>VIEW ALL ➔</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactHistoryGroup;
