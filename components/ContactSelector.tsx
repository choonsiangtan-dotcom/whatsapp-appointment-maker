import React from 'react';
import { Contact } from '../types';
import { useContacts } from '../hooks/useContacts';

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
  // Deduplicate and get the top 5 recent contacts (distinct by ID + first phone number)
  const uniqueRecent: Contact[] = [];
  const seenKeys = new Set<string>();
  for (const c of contacts) {
    const key = `${c.id}-${c.phoneNumbers[0] || ''}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueRecent.push(c);
    }
  }
  const topRecent = uniqueRecent.slice(0, 5);

  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 px-1">
      {/* Contacts */}
      {topRecent.map((c) => {
        const isSelected = c.id === selectedContact.id && 
          (selectedPhoneNumber ? selectedPhoneNumber === c.phoneNumbers[0] : true);
        const firstName = c.name.split(' ')[0];

        return (
          <div 
            key={`${c.id}-${c.phoneNumbers[0] || ''}`} 
            onClick={() => onSelect?.(c, c.phoneNumbers[0])}
            className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className={`w-[48px] h-[48px] rounded-full p-[2px] transition-colors ${
              isSelected 
                ? 'border-[2px] border-[#006b5f]' 
                : 'border-[2px] border-transparent group-hover:border-[#bacac5]/50'
            }`}>
              <img
                src={c.avatar}
                alt={c.name}
                className="w-full h-full rounded-full object-cover bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`;
                }}
              />
            </div>
            <span className={`font-display text-[11px] font-medium transition-colors text-center ${
              isSelected ? 'text-[#131b2e] font-bold max-w-[80px] leading-tight break-words' : 'text-[#3c4a46] truncate max-w-[56px]'
            }`}>
              {isSelected ? c.name : firstName}
            </span>
            {isSelected && c.phoneNumbers[0] && (
              <span className="text-[10px] font-bold text-[#006b5f] mt-0.5 tracking-tight">
                {c.phoneNumbers[0]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContactSelector;
