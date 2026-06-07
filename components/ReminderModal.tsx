import React, { useState } from 'react';
import { HistoricalAppointment } from '../types';

interface ReminderModalProps {
  appointment: HistoricalAppointment;
  onClose: () => void;
  onSend: (templateId: string) => void;
}

const TEMPLATES = [
  {
    id: 'reminder_friendly',
    title: 'The Friendly Check-In',
    desc: 'Soft reminder with location details.',
    icon: 'handshake',
    emoji: '😊',
    color: 'bg-emerald-50 text-emerald-600',
    text: (name: string, time: string, address: string) => {
      const formattedTime = (() => {
        try {
          const [h, m] = time.split(':');
          const hr = parseInt(h);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          return `${hr % 12 || 12}:${m} ${ampm}`;
        } catch (e) {
          return time;
        }
      })();
      return `Hi ${name}, looking forward to our appointment later at ${formattedTime}! Here is the location just in case: ${address || 'our office'}. See you soon! 😊`;
    }
  },
  {
    id: 'reminder_logistics',
    title: 'Logistics Confirmation',
    desc: 'Action check on address and transit.',
    icon: 'directions_car',
    emoji: '🚗',
    color: 'bg-blue-50 text-blue-600',
    text: (name: string, time: string, address: string) => {
      const formattedTime = (() => {
        try {
          const [h, m] = time.split(':');
          const hr = parseInt(h);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          return `${hr % 12 || 12}:${m} ${ampm}`;
        } catch (e) {
          return time;
        }
      })();
      return `Hi ${name}, checking if you're on the way for our appointment at ${formattedTime}? The address is ${address || 'the scheduled location'}. Let me know if you need help finding it! 🚗`;
    }
  },
  {
    id: 'reminder_time_check',
    title: 'Final Time Verification',
    desc: 'Verify if still attending.',
    icon: 'alarm',
    emoji: '⏰',
    color: 'bg-amber-50 text-amber-600',
    text: (name: string, time: string, address: string) => {
      const formattedTime = (() => {
        try {
          const [h, m] = time.split(':');
          const hr = parseInt(h);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          return `${hr % 12 || 12}:${m} ${ampm}`;
        } catch (e) {
          return time;
        }
      })();
      return `Hi ${name}, just a quick heads-up that our meeting is coming up at ${formattedTime} at ${address || 'the scheduled location'}. Please confirm if you're still good to go! ⏰`;
    }
  }
];

const ReminderModal: React.FC<ReminderModalProps> = ({ appointment, onClose, onSend }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-500">event_available</span>
            </div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#131b2e]">Remind {appointment.contact.name}</h3>
              <p className="text-[12px] text-slate-400 font-medium">Select an attendance alert template</p>
            </div>
          </div>
          <button 
            onClick={() => {
              onClose();
              setSelectedTemplateId(null);
            }}
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
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-[#006b5f]/30 hover:bg-slate-50 transition-all text-left active:scale-[0.98] ${selectedTemplateId === tpl.id ? 'border-[#006b5f] bg-slate-50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl ${tpl.color} flex items-center justify-center shadow-sm`}>
                  <span className="material-symbols-outlined text-[24px]">{tpl.icon}</span>
                </div>
                {tpl.emoji && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow border border-slate-100 text-[10px]">
                    {tpl.emoji}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#131b2e]">{tpl.title}</h4>
                <p className="text-[12px] text-slate-500 font-medium">{tpl.desc}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Send Reminder Footer */}
        <div className="p-4 pt-2 text-center">
          <button
            onClick={() => {
              if (selectedTemplateId) {
                onSend(selectedTemplateId);
                setSelectedTemplateId(null);
              }
            }}
            disabled={!selectedTemplateId}
            className="px-6 py-2 bg-[#006b5f] text-white rounded-xl font-bold disabled:opacity-50"
          >
            Send Reminder
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            Opens WhatsApp with selected template
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
export { TEMPLATES };
