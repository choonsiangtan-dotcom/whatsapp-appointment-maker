
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  phoneNumbers: string[]; // Support multiple numbers
  lastUsed: number; // For "recent 5" sorting and deduplication
}


export type AppointmentStatus = 'SENT' | 'PENDING' | 'CONFIRMED' | 'RESCHEDULED' | 'NO-SHOW' | 'CANCELLED';

export interface HistoricalAppointment extends AppointmentData {
  id: string;
  status: AppointmentStatus;
  sentAt: number; // timestamp
  updatedAt: number; // timestamp
  syncSuccessful?: boolean;
  isArchived?: boolean;
}

export interface AppointmentData {
  address: string;
  date: string;
  time: string;
  contact: Contact;
  selectedPhoneNumber: string;
  followUpEnabled: boolean;
  preMeetingEnabled: boolean;
  leadTime: '30 mins' | '1 hour' | '1 day';
  followUpTimer?: '15 mins' | '30 mins' | '1 hour' | '2 hours' | string;
  preMeetingTimer?: '15 mins' | '30 mins' | '1 hour' | '1 day' | string;
  messageText?: string;
  notes?: string;
}

export interface ExtractionResult {
  name?: string;
  address?: string;
  date?: string;
  time?: string;
}

