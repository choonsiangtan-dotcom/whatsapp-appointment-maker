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
  // Deduplicate and get the top 5 recent contacts
  const uniqueRecent = Array.from(new Map<string, Contact>(contacts.map(c => [c.id, c])).values()).slice(0, 5);

  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 px-1">
      {/* Add New */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer" onClick={onSeeAll}>
        <div className="w-[48px] h-[48px] rounded-full border-[2px] border-dashed border-[#bacac5] flex items-center justify-center bg-white active:scale-95 transition-transform duration-200">
          <span className="material-symbols-outlined text-[#bacac5] text-[24px]" style={{ fontVariationSettings: "'wght' 300" }}>add</span>
        </div>
        <span className="text-[10px] font-medium text-[#6b7a76]" style={{ fontFamily: 'Manrope, sans-serif' }}>New</span>
      </div>

      {/* Contacts */}
      {uniqueRecent.map((c) => {
        const isSelected = c.id === selectedContact.id;
        const firstName = c.name.split(' ')[0];

        return (
          <div 
            key={c.id} 
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
            <span className={`text-[11px] font-medium transition-colors ${
              isSelected ? 'text-[#131b2e] font-bold' : 'text-[#3c4a46]'
            }`} style={{ fontFamily: 'Manrope, sans-serif' }}>
              {firstName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ContactSelector;
