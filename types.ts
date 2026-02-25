
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  phoneNumbers: string[]; // Support multiple numbers
  lastUsed: number; // For "recent 5" sorting and deduplication
}

export interface AppointmentData {
  address: string;
  date: string;
  time: string;
  contact: Contact;
  selectedPhoneNumber: string;
  reminderEnabled: boolean;
  leadTime: '30 mins' | '1 hour' | '1 day';
}

export interface ExtractionResult {
  name?: string;
  address?: string;
  date?: string;
  time?: string;
}
