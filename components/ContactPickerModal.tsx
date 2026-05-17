import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumbers.some(p => p.includes(search))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-[#bacac5]/30">
        {/* Header */}
        <div className="p-6 border-b border-[#bacac5]/20 bg-[#faf8ff]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[20px] font-bold text-[#131b2e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Select Contact</h3>
              <p className="text-[14px] text-[#6b7a76] font-normal mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Choose a contact to add</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#e2e7ff] text-[#6b7a76] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-10 h-10 border-4 border-[#2dd4bf] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#6b7a76] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Fetching contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
              <span className="material-symbols-outlined text-6xl text-[#bacac5]">person_search</span>
              <p className="text-sm text-[#6b7a76] font-medium italic" style={{ fontFamily: 'Inter, sans-serif' }}>No contacts found</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div key={contact.id} className={`group/item rounded-2xl mb-3 transition-all duration-300 overflow-hidden border ${
                selectedContactId === contact.id 
                  ? 'border-[#006b5f] bg-[#f2f3ff]' 
                  : 'border-[#bacac5]/30 bg-white hover:border-[#006b5f]/40 hover:shadow-sm'
              }`}>
                {/* Header / Main Selection Area */}
                <button
                  onClick={() => contact.phoneNumbers.length > 0 && onSelect(contact, contact.phoneNumbers[0])}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl transition-colors text-left"
                >
                   <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0 transition-transform duration-300 ${
                     selectedContactId === contact.id ? 'border-[#006b5f] scale-105' : 'border-transparent'
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
                     <p className="text-[16px] font-bold text-[#131b2e] truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{contact.name}</p>
                     {contact.status && <p className="text-[12px] text-[#6b7a76] truncate font-normal mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{contact.status}</p>}
                   </div>
                   <div className="flex flex-col items-end">
                     {selectedContactId === contact.id ? (
                       <span className="material-symbols-outlined text-[#006b5f] animate-in zoom-in duration-300">check_circle</span>
                     ) : (
                       <div className="text-[#006b5f] opacity-0 group-hover/item:opacity-100 transition-opacity">
                         <span className="material-symbols-outlined text-xl">add_circle</span>
                       </div>
                     )}
                   </div>
                </button>

                {/* Specific Number Selection */}
                {contact.phoneNumbers.length > 0 && (
                  <div className="px-4 pb-4 space-y-2">
                    {contact.phoneNumbers.map((num, idx) => (
                      <button
                        key={`${contact.id}-${num}-${idx}`}
                        onClick={() => onSelect(contact, num)}
                        className={`w-full text-left px-4 py-3 text-[14px] rounded-xl border flex items-center justify-between group transition-all ${
                          selectedContactId === contact.id 
                            ? 'bg-white border-[#006b5f]/30 text-[#006b5f] font-bold' 
                            : 'bg-[#faf8ff] border-transparent hover:border-[#2dd4bf]/40 hover:bg-[#eaedff] text-[#3c4a46] font-medium'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <span>{num}</span>
                        <span className={`material-symbols-outlined text-[18px] text-[#006b5f] transition-opacity ${
                          selectedContactId === contact.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>check_circle</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Tip */}
        <div className="p-5 bg-[#faf8ff] border-t border-[#bacac5]/20">
          <div className="flex space-x-3 items-start">
            <span className="material-symbols-outlined text-[#006b5f] text-[20px]">lightbulb</span>
            <p className="text-[13px] leading-relaxed text-[#6b7a76] font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>
              Selecting a contact will add them to your <strong className="text-[#3c4a46]">Recents</strong> for quick access later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPickerModal;
