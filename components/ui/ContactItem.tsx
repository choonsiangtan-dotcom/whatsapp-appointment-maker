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
            ? 'ring-2 ring-emerald-500 ring-offset-2' 
            : 'group-hover:ring-2 group-hover:ring-slate-200'
        }`}>
          <ContactAvatar name={contact.name} src={contact.avatar} />
        </div>
        {isSelected && (
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-full ring-2 ring-white flex items-center justify-center shadow-sm">
            <span className="material-icons-round text-[10px]">check</span>
          </div>
        )}
      </div>

      <div className="text-center w-full px-1">
        <p className={`text-[10px] font-semibold truncate ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`}>
          {contact.name.split(' ')[0]}
        </p>
      </div>
    </button>
  );
};

export default ContactItem;
