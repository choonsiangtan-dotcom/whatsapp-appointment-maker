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
    <div className="flex flex-col solid-card overflow-hidden">
      {/* 1. The Avatar Shelf (Top Section) - Balanced */}
      <div className="bg-slate-50/30 px-5 pt-4 pb-2 border-b border-slate-100/50">
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
                    className="w-10 h-10 rounded-full object-cover shadow-sm bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`;
                    }}
                  />
                </div>
                <span className={`text-[11px] mt-1.5 font-semibold transition-all duration-300 truncate max-w-[48px] ${
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
      <div className="flex flex-col items-center justify-center px-6 py-2.5 bg-white relative">
        <div className="text-[14px] font-bold text-slate-900 leading-tight truncate tracking-tight text-center">
          {selectedContact.name || 'Select Contact'}
        </div>
        <div className="flex mt-1 justify-center">
          <div className="inline-flex items-center px-2 py-0 bg-slate-50 rounded-full border border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0 inline-block"></span>
            <span className="text-[12px] font-medium text-slate-500 tracking-tight">
              {displayPhone || 'No number selected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSelector;
