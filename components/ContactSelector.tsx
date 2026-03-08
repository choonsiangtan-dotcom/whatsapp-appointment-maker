import React from 'react';
import { Contact } from '../types';
import { useContacts } from '../hooks/useContacts';
import ContactItem from './ui/ContactItem';

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
  const { filteredContacts } = useContacts(contacts);

  return (
    <div className="mb-6 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recents</h2>
        <button onClick={onSeeAll} className="text-xs text-primary font-bold hover:underline">Add New</button>
      </div>

      <div className="grid grid-cols-5 gap-1 py-4 px-1">
        {filteredContacts.length === 0 ? (
          <div className="col-span-5 py-4 text-center text-slate-400 text-xs italic">
            No contacts.
          </div>
        ) : (
          filteredContacts.slice(0, 5).map((item) => {
            const isSelected = selectedContactId === item.contact.id && selectedPhoneNumber === item.number;
            return (
              <ContactItem
                key={item.uniqueId}
                contact={item.contact}
                phoneNumber={item.number}
                isSelected={isSelected}
                onSelect={() => onSelect(item.contact, item.number)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContactSelector;
