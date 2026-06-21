import React, { useState } from 'react';
import { HistoricalAppointment } from '../types';

interface NotesModalProps {
  appointment: HistoricalAppointment;
  onClose: () => void;
  onSave: (notes: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ appointment, onClose, onSave }) => {
  const [notes, setNotes] = useState(appointment.notes || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-500">description</span>
            </div>
            <div>
              <h3 className="txt-title font-extrabold text-[#131b2e]">Notes: {appointment.contact.name}</h3>
              <p className="txt-caption text-slate-400 font-medium">Add memo or logs for this past event</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-[#f43f5e] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Text Area */}
        <div className="p-5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type notes or logs here..."
            className="w-full h-32 p-3 bg-slate-50 border border-slate-100 rounded-2xl txt-secondary text-[#131b2e] focus:outline-none focus:border-[#006b5f]/40 resize-none font-medium"
          />
        </div>

        {/* Save button */}
        <div className="p-4 pt-0 text-right flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-[#6b7a76] rounded-xl txt-label-caps active:scale-95 transition-transform text-[12px]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(notes)}
            className="px-5 py-2.5 bg-[#006b5f] text-white rounded-xl txt-label-caps active:scale-95 transition-transform text-[12px] shadow-sm shadow-[#006b5f]/20"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
