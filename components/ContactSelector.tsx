import React from 'react';
import { Contact } from '../types';
import { useContacts } from '../hooks/useContacts';
import OverlappingAvatars from './ui/OverlappingAvatars';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContact: Contact;
  selectedPhoneNumber?: string;
  onSelect?: (contact: Contact, phoneNumber: string) => void;
  onSeeAll?: () => void;
  onCycleNext?: () => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  selectedContact,
  selectedPhoneNumber,
  onSelect,
  onSeeAll,
  onCycleNext
}) => {
  // Deduplicate and get the top 5 recent contacts
  const uniqueRecent = Array.from(new Map<string, Contact>(contacts.map(c => [c.id, c])).values()).slice(0, 5);
  
  // Format the display number
  const displayPhone = selectedPhoneNumber || selectedContact.phoneNumbers[0] || '';

  return (
    <div className="flex flex-col bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
      {/* 1. The Avatar Shelf (Top Section) - Tightened */}
      <div className="bg-slate-50/30 px-5 pt-5 pb-3 border-b border-slate-100/50">
        <div className="flex items-center justify-between px-1">
          {uniqueRecent.map((c, i) => {
            const isSelected = c.id === selectedContact.id;
            const firstName = c.name.split(' ')[0];
            
            return (
              <button
                key={c.id}
                onClick={() => onSelect?.(c, c.phoneNumbers[0])}
                className={`flex flex-col items-center transition-all duration-500 outline-none focus:outline-none ${
                  isSelected ? 'scale-105' : 'scale-90 opacity-30 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <div className={`relative p-0.5 rounded-full transition-all duration-500 ${
                  isSelected ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                }`}>
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-11 h-11 rounded-full object-cover shadow-sm bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`;
                    }}
                  />
                </div>
                <span className={`text-[9px] mt-1.5 font-bold transition-all duration-300 truncate max-w-[48px] ${
                  isSelected ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {firstName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. The Detail Body - Compacted */}
      <div className="flex flex-col px-6 py-4 bg-white relative">
        <div className="text-[17px] font-black text-slate-800 leading-tight truncate tracking-tight">
          {selectedContact.name || 'Select Contact'}
        </div>
        <div className="flex mt-2">
          <div className="inline-flex items-center px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
            <span className="material-icons-round text-[12px] text-emerald-500 mr-1.5">phone</span>
            <span className="text-[12px] font-bold text-slate-500 tracking-tight">
              {displayPhone || 'No number selected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSelector;
