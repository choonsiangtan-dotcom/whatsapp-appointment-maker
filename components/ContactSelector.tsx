import React, { useState, useMemo } from 'react';
import { Contact } from '../types';

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContactId: string;
  selectedPhoneNumber: string;
  onSelect: (contact: Contact, phoneNumber: string) => void;
  onSeeAll?: () => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  selectedContactId,
  selectedPhoneNumber,
  onSelect,
  onSeeAll
}) => {
  const [search, setSearch] = useState('');

  // Expand contacts into individual entries for each phone number
  const expandedContacts = useMemo(() => {
    const list: Array<{ contact: Contact; number: string; uniqueId: string }> = [];
    contacts.forEach(c => {
      const numbers = c.phoneNumbers || [];
      numbers.forEach(n => {
        list.push({ contact: c, number: n, uniqueId: `${c.id}-${n}` });
      });
    });
    return list;
  }, [contacts]);

  const filteredContacts = expandedContacts.filter(
    item =>
      item.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      item.number.includes(search)
  );

  return (
    <div className="mb-6 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recents</h2>
        <button onClick={onSeeAll} className="text-xs text-primary font-bold hover:underline">Add New</button>
      </div>

      <div className="grid grid-cols-5 gap-2 pb-2 overflow-x-auto custom-scrollbar">
        {filteredContacts.length === 0 ? (
          <div className="col-span-5 py-4 text-center text-slate-400 text-xs italic">
            No contacts.
          </div>
        ) : (
          filteredContacts.slice(0, 5).map((item) => {
            const isSelected = selectedContactId === item.contact.id && selectedPhoneNumber === item.number;
            return (
              <button
                key={item.uniqueId}
                onClick={() => onSelect(item.contact, item.number)}
                className="flex flex-col items-center space-y-1.5 focus:outline-none group"
              >
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full p-0.5 transition-all duration-300 ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-lg shadow-primary/20' : 'group-hover:ring-2 group-hover:ring-slate-300 dark:group-hover:ring-white/20'}`}>
                    <img
                      alt={item.contact.name}
                      className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-white/10"
                      src={item.contact.avatar}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.contact.name)}&background=random`;
                      }}
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                      <span className="material-icons-round text-xs">check</span>
                    </div>
                  )}
                </div>

                <div className="text-center w-full px-1">
                  <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.contact.name.split(' ')[0]}
                  </p>
                  {item.contact.phoneNumbers.length > 1 && (
                    <p className="text-[8px] text-slate-400 font-medium truncate">
                      *{item.number.slice(-4)}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContactSelector;
