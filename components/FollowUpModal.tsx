import React from 'react';
import { HistoricalAppointment } from '../types';

interface FollowUpModalProps {
  appointment: HistoricalAppointment;
  onClose: () => void;
  onSend: (templateId: string) => void;
}

const TEMPLATES = [
  {
    id: 'gentle',
    title: 'Gentle Reminder',
    desc: 'Soft nudge to check in.',
    icon: 'sentiment_satisfied',
    color: 'bg-emerald-50 text-emerald-600',
    text: (name: string) => `Just checking in to see if you received the appointment details above! 😊`
  },
  {
    id: 'direct',
    title: 'Direct Confirmation',
    desc: 'Clear request for status.',
    icon: 'priority_high',
    color: 'bg-amber-50 text-amber-600',
    text: (name: string) => `Hi, I'm just looking for a quick confirmation on our scheduled meeting. Thanks!`
  },
  {
    id: 'expiring',
    title: 'Final Call',
    desc: 'Creates healthy urgency.',
    icon: 'timer',
    color: 'bg-rose-50 text-rose-600',
    text: (name: string) => `Hi! I'm finalizing my schedule—let me know if you're still able to meet so I can hold the slot.`
  }
];

const FollowUpModal: React.FC<FollowUpModalProps> = ({ appointment, onClose, onSend }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-500">campaign</span>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#131b2e]">Nudge {appointment.contact.name}</h3>
              <p className="text-[12px] text-slate-400 font-medium">Select a follow-up template</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-[#f43f5e] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Templates */}
        <div className="p-4 space-y-3">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSend(tpl.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-[#006b5f]/30 hover:bg-slate-50 transition-all text-left active:scale-[0.98]"
            >
              <div className={`w-12 h-12 rounded-xl ${tpl.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="material-symbols-outlined text-[24px]">{tpl.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#131b2e]">{tpl.title}</h4>
                <p className="text-[12px] text-slate-500 font-medium">{tpl.desc}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 pt-2 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Opens WhatsApp with selected template
          </p>
        </div>
      </div>
    </div>
  );
};

export default FollowUpModal;
export { TEMPLATES };
