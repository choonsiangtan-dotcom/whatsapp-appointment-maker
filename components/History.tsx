import React, { useState } from 'react';
import { HistoricalAppointment, AppointmentStatus } from '../types';
import HistoryCard from './HistoryCard';
import ContactHistoryGroup from './ContactHistoryGroup';
import HistorySummary from './HistorySummary';

interface HistoryProps {
  history: HistoricalAppointment[];
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

const History: React.FC<HistoryProps> = ({ 
  history, 
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


  const [search, setSearch] = useState('');

  const filteredHistory = history
    .filter(appt => 
      appt.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      appt.address.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      return b.sentAt - a.sentAt;
    });

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, HistoricalAppointment[]> = {};
    filteredHistory.forEach(appt => {
      const cid = appt.contact.id;
      if (!groups[cid]) groups[cid] = [];
      groups[cid].push(appt);
    });

    const priority: Record<string, number> = { PENDING: 0, RESCHEDULED: 1, SENT: 2, CONFIRMED: 3, 'NO-SHOW': 4, CANCELLED: 5 };
    
    return Object.values(groups).sort((groupA, groupB) => {
      const maxTimeA = Math.max(...groupA.map(a => a.sentAt));
      const maxTimeB = Math.max(...groupB.map(b => b.sentAt));
      return maxTimeB - maxTimeA;
    });
  }, [filteredHistory]);

  const confirmedCount = history.filter(a => a.status === 'CONFIRMED').length;
  const totalCount = history.length;
  const confirmedRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;


  return (
    <div className="w-full space-y-4 pb-4">
      {/* Header Section */}
      <div className="flex items-center justify-between px-1">
        <h2 className="label-caps tracking-wider text-[#6b7a76]">My Appointment History</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl ambient-shadow border border-slate-100 text-[11px] font-bold text-[#131b2e]">
          Last Sync: 2 Mins Ago
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bacac5] text-[18px] group-focus-within:text-[#006b5f] transition-colors">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#bacac5]/30 rounded-2xl text-[14px] text-[#131b2e] focus:outline-none focus:border-[#006b5f]/50 ambient-shadow font-sans"
          />
        </div>
        <button className="w-11 h-11 flex items-center justify-center bg-white border border-[#bacac5]/30 rounded-2xl text-[#006b5f] ambient-shadow">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
      </div>

      {/* Summary Banner */}
      <HistorySummary 
        total={totalCount} 
        confirmed={confirmedCount} 
        rate={confirmedRate} 
      />

      {/* History List */}
      <div className="space-y-3">
        {groupedHistory.length > 0 ? (
          groupedHistory.map(group => (
            <ContactHistoryGroup 
              key={group[0].contact.id} 
              appointments={group} 
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onArchive={onArchive}
              onFollowUp={onFollowUp}
              onReschedule={onReschedule}
              onReminder={onReminder}
              onRebook={onRebook}
              onEditNotes={onEditNotes}
              onOpenClientHistory={onOpenClientHistory}
            />
          ))
        ) : (
          <div className="py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-[48px] text-[#bacac5]/50">history_off</span>
            <p className="text-[#6b7a76] text-[14px]">No appointments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
