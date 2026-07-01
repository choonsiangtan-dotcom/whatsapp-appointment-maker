import React, { useState, useEffect } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';

interface HistoryCardProps {
  appointment: HistoricalAppointment;
  onUpdateStatus: (id: string, status: AppointmentStatus, forcePast?: boolean) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
  onRebook: (appointment: HistoricalAppointment) => void;
  onEditNotes: (appointment: HistoricalAppointment) => void;
  isThreadItem?: boolean;
  isCompactTimeline?: boolean;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ 
  appointment, 
  onUpdateStatus, 
  onDelete, 
  onArchive,
  onUnarchive,
  onFollowUp, 
  onReschedule, 
  onReminder, 
  onRebook,
  onEditNotes,
  isThreadItem = false,
  isCompactTimeline = false
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    cancelLongPress();
    const timer = setTimeout(() => {
      setShowContextMenu(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
    setLongPressTimer(timer);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, [longPressTimer]);

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

  const isCurrentlyArchived = appointment.isArchived === true || (isPast && (appointment.status === 'CONFIRMED' || appointment.status === 'NO-SHOW') && appointment.isArchived !== false);

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
        return { bg: 'bg-[#fee2e2] dark:bg-red-950/35', text: 'text-[#dc2626] dark:text-red-400', label: 'CANCELLED', pulse: '' };
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

  const cancelDialog = showCancelConfirm && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-2 font-display">Cancel Appointment?</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed font-sans mb-6 font-normal">
          Are you sure you want to cancel this pending appointment? This will update the status to Cancelled.
        </p>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCancelConfirm(false);
            }}
            className="flex-1 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCancelConfirm(false);
              onUpdateStatus(appointment.id, 'CANCELLED');
            }}
            className="flex-1 py-3 rounded-full font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98] transition-all text-[13px] font-display"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const deleteConfirmDialog = showDeleteConfirm && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-2 font-display">
          Delete Record?
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed font-sans mb-6 font-normal">
          Are you sure you want to permanently delete this appointment record? This action cannot be undone and will erase the history.
        </p>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
            className="flex-1 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
              setIsDeleting(true);
              setTimeout(() => {
                onDelete(appointment.id);
              }, 300);
            }}
            className="flex-1 py-3 rounded-full font-bold bg-[#f43f5e] hover:bg-rose-600 text-white active:scale-[0.98] transition-all text-[13px] font-display shadow-md shadow-[#f43f5e]/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const archiveConfirmDialog = showArchiveConfirm && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-2 font-display">
          Archive Record?
        </h3>
        <p className="text-[13px] text-slate-500 leading-relaxed font-sans mb-6 font-normal">
          Are you sure you want to archive this specific appointment record? It will be moved to the client's archives.
        </p>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArchiveConfirm(false);
            }}
            className="flex-1 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowArchiveConfirm(false);
              if (onArchive) {
                onArchive(appointment.id);
              }
            }}
            className="flex-1 py-3 rounded-full font-bold bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-[0.98] transition-all text-[13px] font-display"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );

  const contextMenuModal = showContextMenu && (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        setShowContextMenu(false);
      }}
    >
      <div 
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border-t sm:border border-slate-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-4 font-display text-center sm:text-left">
          Appointment Options
        </h3>
        
        <div className="space-y-2">
          {/* Notes Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(false);
              onEditNotes(appointment);
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-[#006b5f]">description</span>
            <span>Edit Notes / Details</span>
          </button>

          {/* Follow Up */}
          {appointment.status === 'PENDING' && onFollowUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                onFollowUp(appointment);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-500">campaign</span>
              <span>Follow Up</span>
            </button>
          )}

          {/* Remind */}
          {appointment.status === 'CONFIRMED' && onReminder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                onReminder(appointment);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px] text-teal-600">notifications_active</span>
              <span>Send Reminder</span>
            </button>
          )}

          {/* Reschedule */}
          {!isPast && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                onReschedule(appointment);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006b5f]">calendar_today</span>
              <span>Reschedule</span>
            </button>
          )}

          {/* Archive / Unarchive */}
          {isCurrentlyArchived && onUnarchive ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                onUnarchive(appointment.id);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006b5f]">unarchive</span>
              <span>Unarchive Appointment</span>
            </button>
          ) : !isCurrentlyArchived && onArchive ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
                setShowArchiveConfirm(true);
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006b5f]">archive</span>
              <span>Archive Appointment</span>
            </button>
          ) : null}

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(false);
              setShowDeleteConfirm(true);
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-rose-600 hover:bg-rose-50 active:scale-98 transition-all text-[14px] flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-rose-500">delete</span>
            <span>Delete Appointment</span>
          </button>

          {/* Cancel */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(false);
              }}
              className="w-full py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200 text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  if (isCompactTimeline) {
    return (
      <>
        <div 
          className={`relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 ${
            isDeleting ? 'opacity-0 -translate-x-full max-h-0 py-0 my-0 border-none scale-95' : 'max-h-[300px]'
          }`}
          onTouchStart={startLongPress}
          onTouchMove={cancelLongPress}
          onTouchEnd={cancelLongPress}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
        >
          <div 
            className="relative z-10 w-full bg-white dark:bg-slate-900 p-4"
            onClick={() => {
              if (isSwiped) setIsSwiped(false);
            }}
          >
            <div className="flex flex-col gap-2.5">
              {/* ROW 1: Header Row & Notes Anchor */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-[15px] font-bold text-[#006b5f] dark:text-teal-400 leading-tight block">
                    {formatDate(appointment.date)}, {formatTime(appointment.time)}
                  </span>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 font-normal leading-normal block mt-0.5 truncate">
                    {appointment.address}
                  </span>
                </div>
                
                {/* Notes Button Anchor -> Activates Context Menu */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(true);
                  }}
                  className="flex items-center gap-0.5 text-[#006b5f] dark:text-teal-400 hover:opacity-80 transition-all flex-shrink-0 pt-0.5"
                  aria-label="More actions"
                >
                  <span className="material-symbols-outlined text-[16px] font-semibold">description</span>
                  <span className="text-[13px] font-bold font-sans mr-1">Notes</span>
                  <span className="material-symbols-outlined text-[16px]">more_vert</span>
                </button>
              </div>

              {/* ROW 2: Dedicated Pill Status Badge */}
              <div className="flex">
                {(() => {
                  const isCompleted = appointment.status === 'CONFIRMED' && isPast;
                  if (isCompleted) {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/20 text-[#006b5f] dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">check_circle</span>
                        <span className="text-[11px] font-bold tracking-wide uppercase">COMPLETED</span>
                      </div>
                    );
                  }
                  
                  if (appointment.status === 'CONFIRMED') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/20 text-[#006b5f] dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">check_circle</span>
                        <span className="text-[11px] font-bold tracking-wide uppercase">CONFIRMED</span>
                      </div>
                    );
                  }

                  if (appointment.status === 'CANCELLED') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fee2e2] dark:bg-red-950/35 text-[#dc2626] dark:text-red-400 border border-red-100/50 dark:border-red-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">cancel</span>
                        <span className="text-[11px] font-bold tracking-wide uppercase">CANCELLED</span>
                      </div>
                    );
                  }

                  // Fallbacks for other statuses
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.bg} ${config.text} border border-slate-200/50 flex-shrink-0`}>
                      <span className="text-[11px] font-bold tracking-wide uppercase">{config.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* ROW 3: Expanded Two-Button Action Matrix */}
              <div className="flex gap-2 mt-2 pt-3 border-t border-slate-50 dark:border-slate-800/40 items-center justify-between w-full">
                <div className="flex flex-1 gap-2 min-w-0">
                  {/* Left Column Button: REBOOK */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRebook(appointment);
                    }}
                    className={`h-9 bg-[#006b5f] text-white rounded-full font-bold text-[12px] flex items-center justify-center gap-1 hover:bg-[#005c52] active:scale-[0.98] transition-all font-sans min-w-0 px-2.5 ${
                      appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || isPast
                        ? 'w-full flex-1'
                        : 'flex-1 w-1/2'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] font-semibold">add</span>
                    <span className="whitespace-nowrap">REBOOK</span>
                  </button>

                  {/* Right Column Button: State-Dependent CTA */}
                  {!(appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || isPast) && (() => {
                    if (appointment.status === 'PENDING') {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCancelConfirm(true);
                          }}
                          className="flex-1 w-1/2 h-9 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[12px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all font-sans min-w-0 px-2.5"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">close</span>
                          <span className="whitespace-nowrap">CANCEL</span>
                        </button>
                      );
                    }
                    if (appointment.status === 'CONFIRMED') {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(appointment.id, 'CONFIRMED', true);
                          }}
                          className="flex-1 w-1/2 h-9 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[12px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all font-sans min-w-0 px-2.5"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                          <span className="whitespace-nowrap">COMPLETE</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {deleteConfirmDialog}
        {archiveConfirmDialog}
        {cancelDialog}
        {contextMenuModal}
      </>
    );
  }

  if (isThreadItem) {
    return (
      <>
        <div 
          className={`relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm mt-2 first:mt-0 mr-2 transition-all duration-300 ${
            isDeleting ? 'opacity-0 -translate-x-full max-h-0 py-0 my-0 border-none scale-95' : 'max-h-[300px]'
          }`}
          onTouchStart={startLongPress}
          onTouchMove={cancelLongPress}
          onTouchEnd={cancelLongPress}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
        >
          <div className="relative z-10 w-full p-3.5">
            <div className="flex flex-col gap-2.5">
              {/* ROW 1: Header Row & Notes Anchor */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-[14px] font-bold text-[#006b5f] dark:text-teal-400 leading-tight block">
                    {formatDate(appointment.date)}, {formatTime(appointment.time)}
                  </span>
                  <span className="text-[12px] text-slate-500 dark:text-slate-400 font-normal leading-normal block mt-0.5 truncate">
                    {appointment.address}
                  </span>
                </div>
                
                {/* Notes Button Anchor -> Activates Context Menu */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(true);
                  }}
                  className="flex items-center gap-0.5 text-[#006b5f] dark:text-teal-400 hover:opacity-80 transition-all flex-shrink-0 pt-0.5"
                  aria-label="More actions"
                >
                  <span className="material-symbols-outlined text-[15px] font-semibold">description</span>
                  <span className="text-[12px] font-bold font-sans mr-1">Notes</span>
                  <span className="material-symbols-outlined text-[15px]">more_vert</span>
                </button>
              </div>

              {/* ROW 2: Dedicated Pill Status Badge */}
              <div className="flex">
                {(() => {
                  const isCompleted = appointment.status === 'CONFIRMED' && isPast;
                  if (isCompleted) {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/20 text-[#006b5f] dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">check_circle</span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">COMPLETED</span>
                      </div>
                    );
                  }
                  
                  if (appointment.status === 'CONFIRMED') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/20 text-[#006b5f] dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">check_circle</span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">CONFIRMED</span>
                      </div>
                    );
                  }

                  if (appointment.status === 'CANCELLED') {
                    return (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fee2e2] dark:bg-red-950/35 text-[#dc2626] dark:text-red-400 border border-red-100/50 dark:border-red-900/30 flex-shrink-0">
                        <span className="material-symbols-outlined text-[14px] font-bold">cancel</span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">CANCELLED</span>
                      </div>
                    );
                  }

                  // Fallbacks for other statuses
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.bg} ${config.text} border border-slate-200/50 flex-shrink-0`}>
                      <span className="text-[10px] font-bold tracking-wide uppercase">{config.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* ROW 3: Expanded Two-Button Action Matrix */}
              <div className="flex gap-2 mt-2 pt-3 border-t border-slate-50 dark:border-slate-800/40 items-center justify-between w-full">
                <div className="flex flex-1 gap-2 min-w-0">
                  {/* Left Column Button: REBOOK */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRebook(appointment);
                    }}
                    className={`h-9 bg-[#006b5f] text-white rounded-full font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-[#005c52] active:scale-[0.98] transition-all font-sans min-w-0 px-2 ${
                      appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || isPast
                        ? 'w-full flex-1'
                        : 'flex-1 w-1/2'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] font-semibold">add</span>
                    <span className="whitespace-nowrap">REBOOK</span>
                  </button>

                  {/* Right Column Button: State-Dependent CTA */}
                  {!(appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || isPast) && (() => {
                    if (appointment.status === 'PENDING') {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCancelConfirm(true);
                          }}
                          className="flex-1 w-1/2 h-9 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[11px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all font-sans min-w-0 px-2"
                        >
                          <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                          <span className="whitespace-nowrap">CANCEL</span>
                        </button>
                      );
                    }
                    if (appointment.status === 'CONFIRMED') {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(appointment.id, 'CONFIRMED', true);
                          }}
                          className="flex-1 w-1/2 h-9 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[11px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all font-sans min-w-0 px-2"
                        >
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                          <span className="whitespace-nowrap">COMPLETE</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
        {deleteConfirmDialog}
        {archiveConfirmDialog}
        {cancelDialog}
        {contextMenuModal}
      </>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl ambient-shadow">
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
        className={`relative z-10 w-full bg-white p-3 transition-transform duration-300 ease-out border border-slate-100 rounded-2xl ${isSwiped ? '-translate-x-[60%]' : 'translate-x-0'}`}
        onTouchStart={(e) => {
          startLongPress(e);
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
        onTouchMove={cancelLongPress}
        onTouchEnd={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onClick={() => {
          if (isSwiped) setIsSwiped(false);
        }}
      >
        <div className="flex flex-col gap-2">
          {/* Row 1: Info and Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full overflow-hidden bg-[#f1f5f9] flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                {appointment.contact.avatar.startsWith('http') ? (
                  <img src={appointment.contact.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="txt-title text-[#64748B]">
                    {appointment.contact.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="txt-title text-[#131b2e] truncate">
                  {appointment.contact.name}
                </h3>
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
        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between min-h-[48px]">
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
              {/* Left group: Notes/Options Anchor -> opens Context Menu */}
              <div className="flex items-center flex-shrink-0 gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(true);
                  }}
                  aria-label="More actions"
                  className="flex items-center justify-center text-[#006b5f] hover:bg-[#006b5f]/5 rounded-xl transition-all px-3 -ml-3 gap-1.5 min-h-[48px]"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Notes & Options</span>
                  <span className="material-symbols-outlined text-[16px]">more_vert</span>
                </button>
              </div>
              
              {/* Right group: Countdown Pill or Status Pill */}
              <div className="flex items-center gap-1.5 ml-auto">
                {isPast ? (
                  <div 
                    className="ml-6 mr-0 px-2.5 py-1 text-[10px] txt-label-caps text-[#5F6368] flex items-center gap-1 bg-[#F1F3F4] rounded-full border border-slate-200/50 shadow-sm whitespace-nowrap flex-shrink-0" 
                  >
                    <span className="material-symbols-outlined text-[12px] text-[#5F6368]">done</span>
                    {appointment.status === 'CONFIRMED' ? 'Completed' : 'Past Event'}
                  </div>
                ) : (
                  <>
                    {appointment.status === 'PENDING' && (
                      <div 
                        className="ml-6 mr-0 px-2.5 py-1 text-[10px] txt-label-caps text-[#9a3412] flex items-center gap-1 bg-[#ffedd5] rounded-full border border-[#9a3412]/10 shadow-sm animate-pulse whitespace-nowrap flex-shrink-0" 
                      >
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Pending: {formatElapsedTime(appointment.sentAt)}
                      </div>
                    )}

                    {appointment.status === 'SENT' && (
                      <div 
                        className="ml-6 mr-0 px-2.5 py-1 text-[10px] txt-label-caps text-[#3c4a46] flex items-center gap-1 bg-[#eaedff] rounded-full border border-[#eaedff]/20 shadow-sm whitespace-nowrap flex-shrink-0" 
                      >
                        <span className="material-symbols-outlined text-[12px]">hourglass_empty</span>
                        Waiting: {formatElapsedTime(appointment.sentAt)}
                      </div>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                      <div 
                        className="ml-6 mr-0 px-2.5 py-1 text-[10px] txt-label-caps text-[#065f46] flex items-center gap-1 bg-[#d1fae5] rounded-full border border-[#065f46]/10 shadow-sm whitespace-nowrap flex-shrink-0" 
                      >
                        <span className="material-symbols-outlined text-[12px]">alarm</span>
                        Meeting in: {formatCountdown(appointment.date, appointment.time)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

      </div>
      {deleteConfirmDialog}
      {archiveConfirmDialog}
      {contextMenuModal}
    </div>
  );
};

export default HistoryCard;
