
import React, { useState } from 'react';
import { Contact } from '../types';
import InputField from './InputField';

interface ContactPickerModalProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: Contact, phoneNumber: string) => void;
  isLoading?: boolean;
  selectedContactId?: string;
}

const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  contacts,
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
  selectedContactId
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumbers.some(p => p.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[24px] font-bold text-slate-900">Select Contact</h3>
              <p className="text-[14px] text-slate-500 font-normal">Choose a contact to add</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
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
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-medium">Fetching contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
              <span className="material-icons-round text-6xl text-slate-200">person_search</span>
              <p className="text-sm text-slate-400 font-medium italic">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div key={contact.id} className={`group/item border-2 rounded-[2rem] mb-4 transition-all duration-300 overflow-hidden ${
                selectedContactId === contact.id 
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10' 
                  : 'border-slate-50 bg-slate-50/30 hover:border-emerald-200'
              }`}>
                {/* Header / Main Selection Area */}
                <button
                  onClick={() => contact.phoneNumbers.length > 0 && onSelect(contact, contact.phoneNumbers[0])}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-colors text-left"
                >
                   <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0 transition-transform duration-300 ${
                     selectedContactId === contact.id ? 'border-emerald-500 scale-105' : 'border-slate-100'
                   }`}>
                     <img 
                       src={contact.avatar} 
                       alt={contact.name} 
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`;
                       }}
                     />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-[16px] font-medium text-slate-900 truncate">{contact.name}</p>
                     {contact.status && <p className="text-[11px] text-slate-400 truncate font-medium">{contact.status}</p>}
                   </div>
                   <div className="flex flex-col items-end">
                     {selectedContactId === contact.id && (
                       <span className="material-icons-round text-emerald-500 animate-in zoom-in duration-300">check_circle</span>
                     )}
                     <div className={`text-emerald-500 transition-opacity ${selectedContactId === contact.id ? 'opacity-0' : 'opacity-0 group-hover/item:opacity-100'}`}>
                       <span className="material-icons-round text-xl">add_circle_outline</span>
                     </div>
                   </div>
                </button>

                {/* Specific Number Selection */}
                <div className="px-3 pb-3 space-y-1">
                  {contact.phoneNumbers.map((num, idx) => (
                    <button
                      key={`${contact.id}-${num}-${idx}`}
                      onClick={() => onSelect(contact, num)}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-xl border flex items-center justify-between group transition-all ${
                        selectedContactId === contact.id 
                          ? 'bg-white border-emerald-100 text-emerald-700 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600'
                      }`}
                    >
                      <span>{num}</span>
                      <span className="material-icons-round text-[18px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Tip */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex space-x-3">
            <span className="material-icons-round text-emerald-500 text-sm">lightbulb</span>
            <p className="text-[14px] leading-relaxed text-slate-500 font-normal">
              Tip: Selecting a contact will add them to your <strong>Recents</strong> for quick access later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPickerModal;
