
import React, { useState } from 'react';
import { Contact } from '../types';
import InputField from './InputField';

interface ContactPickerModalProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact, phoneNumber: string) => void;
  isLoading?: boolean;
}

const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  contacts,
  isOpen,
  onClose,
  onSelect,
  isLoading = false
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumbers.some(p => p.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md h-[80vh] flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select Contact</h3>
              <p className="text-xs text-slate-500 font-medium">Choose a contact to add</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-icons-round text-slate-400">close</span>
            </button>
          </div>
          <InputField
            label=""
            icon="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or number..."
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-medium">Fetching contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
              <span className="material-icons-round text-6xl text-slate-300">person_search</span>
              <p className="text-sm text-slate-400 font-medium italic">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div key={contact.id} className="space-y-1">
                <div className="px-2 py-1 flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                     <img 
                       src={contact.avatar} 
                       alt={contact.name} 
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`;
                       }}
                     />
                   </div>
                   <div className="flex-1">
                     <p className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</p>
                     {contact.status && <p className="text-[10px] text-slate-400 truncate">{contact.status}</p>}
                   </div>
                </div>
                <div className="pl-12 pr-2 pb-2 space-y-1">
                  {contact.phoneNumbers.map(num => (
                    <button
                      key={`${contact.id}-${num}`}
                      onClick={() => onSelect(contact, num)}
                      className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 text-slate-600 dark:text-slate-300 flex items-center justify-between group transition-all"
                    >
                      <span>{num}</span>
                      <span className="material-icons-round text-[16px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/5 mx-4"></div>
              </div>
            ))
          )}
        </div>

        {/* Footer Tip */}
        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
          <div className="flex space-x-3">
            <span className="material-icons-round text-primary text-sm">lightbulb</span>
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Tip: Selecting a contact will add them to your <strong>Recents</strong> for quick access later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPickerModal;
