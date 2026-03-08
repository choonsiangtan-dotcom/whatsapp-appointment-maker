import { useMemo, useState } from 'react';
import { Contact } from '../types';

export function useContacts(contacts: Contact[]) {
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

  const filteredContacts = useMemo(() => {
    return expandedContacts.filter(
      item =>
        item.contact.name.toLowerCase().includes(search.toLowerCase()) ||
        item.number.includes(search)
    );
  }, [expandedContacts, search]);

  return {
    search,
    setSearch,
    filteredContacts,
    expandedContacts
  };
}
