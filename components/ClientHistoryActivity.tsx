import React, { useState, useEffect } from 'react';
import { Contact, HistoricalAppointment, AppointmentStatus } from '../types';
import HistoryCard from './HistoryCard';

interface ClientHistoryActivityProps {
  contact: Contact;
  appointments: HistoricalAppointment[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
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
  onFollowUp,
  onReschedule,
  onReminder,
  onRebook,
  onEditNotes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

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
          <h1 className="text-[16px] font-extrabold text-[#131b2e]">
            Client Timeline
          </h1>
        </div>
      </header>

      {/* Prominent Client Header below Toolbar */}
      <div className="bg-white border-b border-[#bacac5]/10 px-5 py-4 flex items-center gap-3.5 flex-shrink-0">
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
          <h2 className="text-[18px] font-bold text-[#131b2e] leading-snug break-words">
            {contact.name}
          </h2>
          <p className="text-[12px] text-[#6b7a76] mt-0.5">
            Appointment lifecycle and history
          </p>
        </div>
      </div>

      {/* Vertically scrolling RecyclerView */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 hide-scrollbar">
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((appt) => (
            <HistoryCard
              key={appt.id}
              appointment={appt}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
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
          <div className="py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-[48px] text-[#bacac5]/50">history_off</span>
            <p className="text-[#6b7a76] text-[14px]">No historical records</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHistoryActivity;
