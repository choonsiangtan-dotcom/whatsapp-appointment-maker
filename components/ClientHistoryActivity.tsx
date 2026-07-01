import React, { useState, useEffect } from 'react';
import { Contact, HistoricalAppointment, AppointmentStatus } from '../types';
import HistoryCard from './HistoryCard';

interface ClientHistoryActivityProps {
  contact: Contact;
  appointments: HistoricalAppointment[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: AppointmentStatus, forcePast?: boolean) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onDeleteAll: () => void;
  onUnarchive: (id: string) => void;
  onFollowUp: (appointment: HistoricalAppointment) => void;
  onReschedule: (appointment: HistoricalAppointment) => void;
  onReminder: (appointment: HistoricalAppointment) => void;
  onRebook: (appointment: HistoricalAppointment) => void;
  onEditNotes: (appointment: HistoricalAppointment) => void;
}

const ClientHistoryActivity: React.FC<ClientHistoryActivityProps> = ({
  contact,
  appointments,
  onClose,
  onUpdateStatus,
  onDelete,
  onArchive,
  onDeleteAll,
  onUnarchive,
  onFollowUp,
  onReschedule,
  onReminder,
  onRebook,
  onEditNotes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [deleteAllStep, setDeleteAllStep] = useState<0 | 1 | 2>(0);

  // Trigger slide-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 50);
    const interactiveTimer = setTimeout(() => setIsInteractive(true), 250);
    return () => {
      clearTimeout(timer);
      clearTimeout(interactiveTimer);
    };
  }, []);

  // Handle back click with slide-out animation
  const handleBack = () => {
    setIsInteractive(false);
    setIsOpen(false);
    setTimeout(onClose, 300); // match duration-300
  };

  // Sort appointments: latest first
  const sortedAppointments = [...appointments].sort((a, b) => {
    return b.sentAt - a.sentAt;
  });

  return (
    <>
      <div
        className={`absolute inset-0 z-[60] bg-[#faf8ff] flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Sticky Toolbar */}
        <header 
          className="min-h-14 flex items-center gap-3 px-4 bg-white border-b border-[#bacac5]/20 shadow-[0_1px_8px_rgba(0,107,95,0.06)] flex-shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f2f3ff] transition-colors text-[#6b7a76]"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-[16px] font-extrabold text-[#131b2e] font-display">
              Client Timeline
            </h1>
          </div>
        </header>

        {/* Prominent Client Header below Toolbar */}
        <div className="bg-white border-b border-[#bacac5]/10 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#e8effd] border border-[#d0e1fd] overflow-hidden flex-shrink-0">
              {contact.avatar.startsWith('http') ? (
                <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[16px] font-bold text-[#1a73e8]">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#131b2e] leading-snug break-words font-display">
                {contact.name}
              </h2>
              <p className="text-[12px] text-[#6b7a76] mt-0.5 font-normal font-sans">
                Appointment lifecycle and history
              </p>
            </div>
          </div>

          {/* Delete All Button located at the upper right side below/inside client card */}
          {appointments.length > 0 && (
            <button
              onClick={() => setDeleteAllStep(1)}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 transition-colors text-[13px] font-bold font-display active:scale-95 px-3 py-2 rounded-xl hover:bg-rose-50 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Delete All</span>
            </button>
          )}
        </div>

        {/* Vertically scrolling RecyclerView */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 hide-scrollbar">
          {sortedAppointments.length > 0 ? (
            sortedAppointments.map((appt) => (
              <HistoryCard
                key={appt.id}
                appointment={appt}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onFollowUp={onFollowUp}
                onReschedule={onReschedule}
                onReminder={onReminder}
                onRebook={onRebook}
                onEditNotes={onEditNotes}
                isThreadItem={false}
                isCompactTimeline={true}
              />
            ))
          ) : (
            <div className="py-16 text-center space-y-3">
              <span className="material-symbols-outlined text-[54px] text-[#bacac5]/40">history_off</span>
              <h3 className="text-[#131b2e] text-[15px] font-bold font-display">No Appointment History Found</h3>
              <p className="text-[#6b7a76] text-[12px] font-normal font-sans">This client currently has no recorded appointment history.</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Warning Confirmation Dialog */}
      {deleteAllStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-2 font-display">Delete All Records?</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed font-sans mb-6 font-normal">
              <strong className="text-rose-600 font-bold">CRITICAL ACTION:</strong> You are about to completely wipe out the entire appointment history for this client. This will destroy all operational records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllStep(0)}
                className="flex-1 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeleteAllStep(2)}
                className="flex-1 py-3 rounded-full font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/10 active:scale-[0.98] transition-all text-[13px] font-display"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Double-Lock Final Confirmation Dialog */}
      {deleteAllStep === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 animate-bounce">
              <span className="material-symbols-outlined text-[24px] font-bold">lock_open</span>
            </div>
            <h3 className="text-[17px] font-extrabold text-[#131b2e] mb-2 font-display">Double-Lock Confirmation</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed font-sans mb-6 font-normal">
              Are you absolutely certain? This operation is permanent. Click confirm to delete all records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAllStep(0)}
                className="flex-1 py-3 rounded-full font-bold text-slate-500 hover:bg-slate-50 active:scale-98 transition-all text-[13px] font-display border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteAll();
                  setDeleteAllStep(0);
                }}
                className="flex-1 py-3 rounded-full font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10 active:scale-[0.98] transition-all text-[13px] font-display"
              >
                Confirm Wipeout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientHistoryActivity;
