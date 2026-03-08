import React from 'react';
import { Contact } from '../../types';
import ContactAvatar from './ContactAvatar';

interface ContactItemProps {
  contact: Contact;
  phoneNumber: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  phoneNumber,
  isSelected,
  onSelect
}) => {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center space-y-1.5 focus:outline-none group"
    >
      <div className="relative">
        <div className={`w-14 h-14 rounded-full p-0.5 transition-all duration-300 ${
          isSelected 
            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-lg shadow-primary/20' 
            : 'group-hover:ring-2 group-hover:ring-slate-300 dark:group-hover:ring-white/20'
        }`}>
          <ContactAvatar name={contact.name} src={contact.avatar} />
        </div>
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-white w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
            <span className="material-icons-round text-xs">check</span>
          </div>
        )}
      </div>

      <div className="text-center w-full px-1">
        <p className={`text-[10px] font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
          {contact.name.split(' ')[0]}
        </p>
        {contact.phoneNumbers.length > 1 && (
          <p className="text-[8px] text-slate-400 font-medium truncate">
            *{phoneNumber.slice(-4)}
          </p>
        )}
      </div>
    </button>
  );
};

export default ContactItem;
