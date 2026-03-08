import { useState, useEffect, useCallback } from 'react';
import { AppointmentData, Contact } from '../types';
import { INITIAL_CONTACTS } from '../constants';
import { Capacitor } from '@capacitor/core';
import { Contacts as CapacitorContacts } from '@capacitor-community/contacts';

export function useAppLogic() {
  // --- Contacts State & Persistence ---
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Data Migration & Cleanup
        const migrated = parsed.map((c: any) => {
          const rawNumbers = c.phoneNumbers || (c.phoneNumber ? [c.phoneNumber] : []);
          const uniqueNumbers = Array.from(new Set(rawNumbers.map((n: string) => n.replace(/\D/g, '')))).sort();

          return {
            ...c,
            phoneNumbers: uniqueNumbers,
            status: c.status || 'Hey there! I am using WhatsApp.',
            lastUsed: c.lastUsed || Date.now()
          };
        });

        // Aggressive Overlap Deduplication
        const uniqueContacts: Contact[] = [];
        migrated.sort((a, b) => b.lastUsed - a.lastUsed).forEach((c: Contact) => {
          const existing = uniqueContacts.find(ex =>
            ex.name === c.name ||
            ex.phoneNumbers.some(n => c.phoneNumbers.includes(n))
          );

          if (existing) {
            existing.phoneNumbers = Array.from(new Set([...existing.phoneNumbers, ...c.phoneNumbers])).sort();
            existing.lastUsed = Math.max(existing.lastUsed, c.lastUsed);
            if (existing.avatar.includes('ui-avatars') && !c.avatar.includes('ui-avatars')) {
              existing.avatar = c.avatar;
            }
          } else {
            uniqueContacts.push(c);
          }
        });

        return uniqueContacts.slice(0, 5);
      } catch (e) {
        console.error('Failed to parse contacts from localStorage', e);
      }
    }
    return INITIAL_CONTACTS;
  });

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  // --- Form Data State ---
  const [formData, setFormData] = useState<AppointmentData>(() => {
    const savedContactId = localStorage.getItem('lastSelectedContactId');
    const defaultContact: Contact = contacts[0] || {
      id: 'default',
      name: 'Select Contact',
      avatar: 'https://ui-avatars.com/api/?name=?&background=random',
      status: 'Hey there! I am using WhatsApp.',
      phoneNumbers: []
    };

    const selectedContact = contacts.find(c => c.id === savedContactId) || defaultContact;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    return {
      address: '',
      date: dateStr,
      time: timeStr,
      contact: selectedContact,
      selectedPhoneNumber: selectedContact.phoneNumbers[0] || '',
      reminderEnabled: false,
      leadTime: '30 mins'
    };
  });

  useEffect(() => {
    if (formData.contact.id !== 'default') {
      localStorage.setItem('lastSelectedContactId', formData.contact.id);
    }
  }, [formData.contact.id]);

  // --- Address History ---
  const [addressHistory, setAddressHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('addressHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('addressHistory', JSON.stringify(addressHistory));
  }, [addressHistory]);

  // --- UI/Modal States ---
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualContact, setManualContact] = useState({ name: '', phone: '' });
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [externalContacts, setExternalContacts] = useState<Contact[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);

  // --- Handlers ---
  const handleFieldChange = (key: keyof AppointmentData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectContact = (contact: Contact, phoneNumber: string) => {
    setContacts(prev => {
      let updated = [...prev];
      const existingIndex = updated.findIndex(ex =>
        ex.id === contact.id ||
        ex.name === contact.name ||
        ex.phoneNumbers.some(n => contact.phoneNumbers.includes(n))
      );

      if (existingIndex !== -1) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          phoneNumbers: Array.from(new Set([...updated[existingIndex].phoneNumbers, ...contact.phoneNumbers])).sort(),
          lastUsed: Date.now()
        };
      } else {
        updated.unshift({ ...contact, lastUsed: Date.now() });
      }
      return updated.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5);
    });

    setFormData(prev => ({
      ...prev,
      contact: contact,
      selectedPhoneNumber: phoneNumber
    }));
  };

  const handleManualAdd = () => {
    if (!manualContact.name || !manualContact.phone) {
      alert('Please enter both name and phone number.');
      return;
    }

    const formattedNumber = manualContact.phone.replace(/\D/g, '');
    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: manualContact.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(manualContact.name)}&background=random`,
      status: 'Hey there! I am using WhatsApp.',
      phoneNumbers: [formattedNumber],
      lastUsed: Date.now()
    };

    handleSelectContact(newContact, formattedNumber);
    setIsManualAddOpen(false);
    setManualContact({ name: '', phone: '' });
  };

  const handleSend = () => {
    if (formData.address.trim()) {
      setAddressHistory(prev => {
        const filtered = prev.filter(a => a !== formData.address);
        return [formData.address, ...filtered].slice(0, 3);
      });
    }

    setContacts(prev => {
      const updated = prev.map(c =>
        c.id === formData.contact.id ? { ...c, lastUsed: Date.now() } : c
      ).sort((a, b) => b.lastUsed - a.lastUsed);
      return updated.slice(0, 5);
    });

    const formattedDate = new Date(formData.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const [hours, minutes] = formData.time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const formattedTime = `${h12}:${minutes} ${ampm}`;

    const message = `Hello *${formData.contact.name}*, looking forward to our meeting at *${formData.address}* on *${formattedDate}* at *${formattedTime}*.`;
    const encodedMessage = encodeURIComponent(message);

    const baseUrl = formData.selectedPhoneNumber
      ? `https://wa.me/${formData.selectedPhoneNumber}`
      : `https://wa.me/`;

    window.open(`${baseUrl}?text=${encodedMessage}`, '_blank');
  };

  return {
    contacts,
    setContacts,
    formData,
    handleFieldChange,
    addressHistory,
    isManualAddOpen,
    setIsManualAddOpen,
    manualContact,
    setManualContact,
    isContactPickerOpen,
    setIsContactPickerOpen,
    externalContacts,
    setExternalContacts,
    isFetchingContacts,
    setIsFetchingContacts,
    handleSelectContact,
    handleManualAdd,
    handleSend
  };
}
