import { Contact } from './types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'mock-1',
    name: 'Alice Smith',
    avatar: 'https://ui-avatars.com/api/?name=Alice+Smith&background=006b5f&color=fff',
    status: 'Hey there! I am using WhatsApp.',
    phoneNumbers: ['+60123456789'],
    lastUsed: Date.now()
  },
  {
    id: 'mock-2',
    name: 'Bob Johnson',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=00838f&color=fff',
    status: 'Busy',
    phoneNumbers: ['+60198765432'],
    lastUsed: Date.now() - 100000
  }
];
