import { useState, useEffect, useCallback } from 'react';
import { AppointmentData, Contact, HistoricalAppointment, AppointmentStatus } from '../types';
import { INITIAL_CONTACTS } from '../constants';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Contacts as CapacitorContacts } from '@capacitor-community/contacts';

const NotificationPermission = registerPlugin<any>('NotificationPermission');

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
    const savedRescheduleId = localStorage.getItem('reschedulingId');
    const savedRescheduleForm = localStorage.getItem('rescheduleFormData');
    if (savedRescheduleId && savedRescheduleForm) {
      try {
        return JSON.parse(savedRescheduleForm);
      } catch (e) {
        console.error('Failed to parse rescheduleFormData from localStorage', e);
      }
    }

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
  const [currentPage, setCurrentPage] = useState<'schedule' | 'history' | 'settings'>('schedule');
  const [selectedFollowUp, setSelectedFollowUp] = useState<HistoricalAppointment | null>(null);

  // --- Rescheduling State ---
  const [reschedulingId, setReschedulingId] = useState<string | null>(() => {
    return localStorage.getItem('reschedulingId') || null;
  });

  useEffect(() => {
    if (reschedulingId) {
      localStorage.setItem('reschedulingId', reschedulingId);
    } else {
      localStorage.removeItem('reschedulingId');
    }
  }, [reschedulingId]);

  useEffect(() => {
    if (reschedulingId) {
      localStorage.setItem('rescheduleFormData', JSON.stringify(formData));
    } else {
      localStorage.removeItem('rescheduleFormData');
    }
  }, [formData, reschedulingId]);


  // --- History State ---
  const [history, setHistory] = useState<HistoricalAppointment[]>(() => {
    const saved = localStorage.getItem('appointmentHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('appointmentHistory', JSON.stringify(history));
  }, [history]);

  const isFastTest = true;
  const PENDING_THRESHOLD = isFastTest ? 20 * 1000 : 2 * 60 * 60 * 1000;

  // --- Timer logic for SENT -> PENDING ---
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        let changed = false;
        const now = Date.now();
        const updated = prev.map(appt => {
          if (appt.status === 'SENT' && (now - appt.sentAt) > PENDING_THRESHOLD) {
            changed = true;
            return { ...appt, status: 'PENDING' as const, updatedAt: now };
          }
          return appt;
        });
        return changed ? updated : prev;
      });
    }, 1000); // Check every second (Test Mode)

    return () => clearInterval(interval);
  }, []);

  // --- Notification Tap Navigation Listener ---
  useEffect(() => {
    const handleNavigation = (e: any) => {
      const { tab } = e.detail;
      if (tab === 'history' || tab === 'schedule' || tab === 'settings') {
        setCurrentPage(tab);
      }
    };
    window.addEventListener('navigate-tab', handleNavigation);
    
    // Also check on startup (cold start)
    const checkPendingNavigation = async () => {
      try {
        const res = await NotificationPermission.getPendingNavigation();
        if (res && res.tab) {
          setCurrentPage(res.tab);
        }
      } catch (err) {
        console.error('Failed to check pending navigation:', err);
      }
    };
    checkPendingNavigation();

    return () => {
      window.removeEventListener('navigate-tab', handleNavigation);
    };
  }, []);

  // --- WhatsApp Notification Listener (Auto-Confirm) ---
  useEffect(() => {
    const handleWhatsApp = (e: any) => {
      const { sender, message } = e.detail;
      
      console.log(`[JS Bridge] Received from ${sender}: ${message}`);

      // Check if Auto-Confirm is disabled in settings
      const autoConfirmEnabled = localStorage.getItem('whatsapp_appointment_maker_auto_confirm') !== 'false';
      if (!autoConfirmEnabled) {
        console.log('[JS Bridge] Auto-Confirm is disabled in settings. Skipping automatic triage processing.');
        return;
      }

      if (!sender || !message) {
        console.error("[JS Bridge] Error: Missing sender or message data!");
        return;
      }

      const confirmKeywords = ['ok', 'yes', 'confirm', 'sure', 'confirmed', 'yep', 'can', 'noted', 'fine', 'see you'];
      const rescheduleKeywords = ['cannot', "can't", 'reschedule', 'change', 'unable', 'busy', 'next time', 'other time', 'different day'];
      const ambiguousKeywords = [
        'maybe', 'perhaps', 'unsure', 'not sure', 'not-sure', 'think about', 
        'later', 'depends', 'might', 'possibly', 'let you know', 'let u know',
        'check my', 'double check', 'we will see', 'not decided', 'decide', 'not clear',
        'unsure', 'wondering', 'not ready'
      ];
      
      // Robust keyword matching with custom word boundaries that treat apostrophes as part of the word
      const checkKeywords = (text: string, keywords: string[]): boolean => {
        return keywords.some(k => {
          const escapedKey = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(?:^|[^a-zA-Z0-9'])${escapedKey}(?:$|[^a-zA-Z0-9'])`, 'i');
          return regex.test(text);
        });
      };

      const isRescheduleRequest = checkKeywords(message, rescheduleKeywords);
      const isAmbiguous = checkKeywords(message, ambiguousKeywords);
      // Prioritize reschedule request, but if ambiguous and not rescheduling, block confirmation
      const isConfirmation = (isRescheduleRequest || isAmbiguous) ? false : checkKeywords(message, confirmKeywords);

      if (isAmbiguous && !isRescheduleRequest) {
        console.log(`[WhatsAppointment] Reply is ambiguous ("${message}"). Keeping appointment status PENDING.`);
      }

      setHistory(prev => {
        let changed = false;
        let matchedId = '';
        let targetStatus: 'CONFIRMED' | 'RESCHEDULED' | null = null;

        // Clone and sort the history by sentAt descending (newest first) to ensure chronological scanning
        const sortedHistory = [...prev].sort((a, b) => b.sentAt - a.sentAt);

        // Step 1: Find the target active appointment for this contact
        for (const appt of sortedHistory) {
          const cleanApptName = appt.contact.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cleanSenderName = sender.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

          const isValidMatchLength = Math.min(cleanApptName.length, cleanSenderName.length) >= 3;
          const isMatch = isValidMatchLength && (
            cleanApptName.includes(cleanSenderName) || 
            cleanSenderName.includes(cleanApptName)
          );

          if (isMatch) {
            if (isRescheduleRequest) {
              // For reschedule requests, target the newest non-terminal appointment
              if (appt.status !== 'CANCELLED' && appt.status !== 'NO-SHOW') {
                if (appt.status !== 'RESCHEDULED') {
                  matchedId = appt.id;
                  targetStatus = 'RESCHEDULED';
                  console.log(`[WhatsAppointment] Found target active appointment to reschedule: ID=${appt.id}, Contact=${appt.contact.name}, OldStatus=${appt.status}`);
                }
                break; // Handled this reschedule request
              }
            } else if (isConfirmation) {
              // For confirmations, target the newest active appointment
              if (appt.status === 'SENT' || appt.status === 'PENDING' || appt.status === 'RESCHEDULED') {
                matchedId = appt.id;
                targetStatus = 'CONFIRMED';
                console.log(`[WhatsAppointment] Found target active appointment to confirm: ID=${appt.id}, Contact=${appt.contact.name}, OldStatus=${appt.status}`);
                break;
              }
              // If already confirmed, break immediately!
              if (appt.status === 'CONFIRMED') {
                console.log(`[WhatsAppointment] Newest appointment for ${appt.contact.name} is already CONFIRMED. Breaking loop.`);
                break;
              }
            }
          }
        }

        if (!matchedId || !targetStatus) {
          console.log(`[WhatsAppointment] No active matching appointment found to update for sender: ${sender}`);
          return prev;
        }

        const updated = prev.map(appt => {
          if (appt.id === matchedId) {
            changed = true;
            
            try {
              const alertsEnabled = localStorage.getItem('whatsapp_appointment_maker_alerts') !== 'false';
              if (alertsEnabled) {
                const formattedDate = new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (targetStatus === 'CONFIRMED') {
                  NotificationPermission.showNotification({
                    title: 'Appointment Confirmed! 🎉',
                    body: `${appt.contact.name} just confirmed for ${formattedDate}!`
                  });
                } else if (targetStatus === 'RESCHEDULED') {
                  NotificationPermission.showNotification({
                    title: 'Reschedule Request 🔄',
                    body: `${appt.contact.name} requested to reschedule for ${formattedDate}.`
                  });
                }
              } else {
                console.log(`[WhatsAppointment] Heads-Up Alerts are muted. Bypassing banner display for ${appt.contact.name} (${targetStatus}).`);
              }
            } catch (err) {
              console.error('[WhatsAppointment] Local Notification error:', err);
            }

            return { 
              ...appt, 
              status: targetStatus as any, 
              updatedAt: Date.now(),
              syncSuccessful: true
            };
          }

          return appt;
        });

        if (changed) {
          localStorage.setItem('appointmentHistory', JSON.stringify(updated));
        }
        return changed ? updated : prev;
      });
    };

    window.addEventListener('whatsapp-received', handleWhatsApp);
    return () => window.removeEventListener('whatsapp-received', handleWhatsApp);
  }, []);


  // --- Handlers ---
  const handleFieldChange = (key: keyof AppointmentData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectContact = (contact: Contact, phoneNumber: string) => {
    if (formData.contact.id !== contact.id) {
      setReschedulingId(null);
      localStorage.removeItem('reschedulingId');
      localStorage.removeItem('rescheduleFormData');
    }

    setContacts(prev => {
      // 1. Check if the contact is ALREADY in our top 5 list
      const exists = prev.some(c => 
        c.id === contact.id || 
        c.name.toLowerCase().trim() === contact.name.toLowerCase().trim()
      );

      // 2. If they ALREADY exist, don't change the list order
      if (exists) {
        return prev;
      }

      // 3. If they are NEW, perform FIFO (First-In, First-Out)
      const updatedContact = { ...contact, lastUsed: Date.now() };
      return [updatedContact, ...prev].slice(0, 5);
    });

    setFormData(prev => ({
      ...prev,
      contact: contact,
      selectedPhoneNumber: phoneNumber
    }));

    // Auto-close with delay for UX feedback
    setTimeout(() => {
      setIsContactPickerOpen(false);
    }, 350);
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

  const handleCycleNext = () => {
    if (contacts.length <= 1) return;
    
    const currentIndex = contacts.findIndex(c => c.id === formData.contact.id);
    const nextIndex = (currentIndex + 1) % contacts.length;
    const nextContact = contacts[nextIndex];
    
    // Use the first phone number as default
    const nextPhone = nextContact.phoneNumbers[0] || '';
    
    handleSelectContact(nextContact, nextPhone);
  };

  const handleSend = () => {
    if (formData.address.trim()) {
      setAddressHistory(prev => {
        const filtered = prev.filter(a => a !== formData.address);
        return [formData.address, ...filtered].slice(0, 5);
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

    const message = `Hello *${formData.contact.name}*, looking forward to our meeting at *${formData.address}* on *${formattedDate}* at *${formattedTime}*. *Reply OK to confirm.*`;

    const encodedMessage = encodeURIComponent(message);

    // Save to history or update existing if rescheduling
    let nextHistory: HistoricalAppointment[];
    if (reschedulingId) {
      nextHistory = history.map(appt => 
        appt.id === reschedulingId 
          ? { 
              ...appt, 
              ...formData, 
              status: 'SENT', 
              sentAt: Date.now(), 
              updatedAt: Date.now(), 
              messageText: message 
            } 
          : appt
      );
      setReschedulingId(null);
      localStorage.removeItem('reschedulingId');
      localStorage.removeItem('rescheduleFormData');
    } else {
      const newHistoryItem: HistoricalAppointment = {
        ...formData,
        id: crypto.randomUUID(),
        status: 'SENT',
        sentAt: Date.now(),
        updatedAt: Date.now(),
        messageText: message
      };
      nextHistory = [newHistoryItem, ...history];
    }
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));

    const baseUrl = formData.selectedPhoneNumber
      ? `https://wa.me/${formData.selectedPhoneNumber}`
      : `https://wa.me/`;

    window.open(`${baseUrl}?text=${encodedMessage}`, '_blank');
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    const nextHistory = history.map(appt => 
      appt.id === id ? { ...appt, status, updatedAt: Date.now(), syncSuccessful: status === 'CONFIRMED' } : appt
    );
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));
  };

  const deleteAppointment = (id: string) => {
    const nextHistory = history.filter(appt => appt.id !== id);
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));
  };

  const handleFollowUp = (appt: HistoricalAppointment) => {
    setSelectedFollowUp(appt);
  };

  const handleSendFollowUp = (templateId: string) => {
    if (!selectedFollowUp) return;
    
    // Dynamically import TEMPLATES to avoid circular dependency or keep it simple
    // For now, I'll define them here or assume they are passed
    const templates = [
      { id: 'gentle', text: (name: string) => `Just checking in to see if you received the appointment details above! 😊` },
      { id: 'direct', text: (name: string) => `Hi, I'm just looking for a quick confirmation on our scheduled meeting. Thanks!` },
      { id: 'expiring', text: (name: string) => `Hi! I'm finalizing my schedule—let me know if you're still able to meet so I can hold the slot.` }
    ];

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const message = template.text(selectedFollowUp.contact.name);
    const encodedMessage = encodeURIComponent(message);
    const phone = selectedFollowUp.selectedPhoneNumber || selectedFollowUp.contact.phoneNumbers[0];
    const baseUrl = phone ? `https://wa.me/${phone}` : `https://wa.me/`;

    // Update history synchronously to mark it as just updated before opening
    const nextHistory = history.map(a => 
      a.id === selectedFollowUp.id ? { ...a, updatedAt: Date.now() } : a
    );
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));

    window.open(`${baseUrl}?text=${encodedMessage}`, '_blank');
    setSelectedFollowUp(null);
  };

  const handleReschedule = (appt: HistoricalAppointment) => {
    const freshFormData = {
      contact: appt.contact,
      selectedPhoneNumber: appt.selectedPhoneNumber || appt.contact.phoneNumbers[0],
      address: appt.address,
      date: appt.date,
      time: appt.time,
      reminderEnabled: true,
      leadTime: '1 hour'
    };

    // 1. Pre-fill the scheduler with existing data
    setFormData(freshFormData);

    // 2. Mark this appointment id as being rescheduled
    setReschedulingId(appt.id);
    localStorage.setItem('reschedulingId', appt.id);
    localStorage.setItem('rescheduleFormData', JSON.stringify(freshFormData));

    // 3. Navigate back to schedule page
    setCurrentPage('schedule');
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
    handleCycleNext,
    handleSend,
    currentPage,
    setCurrentPage,
    history,
    updateAppointmentStatus,
    deleteAppointment,
    selectedFollowUp,
    setSelectedFollowUp,
    handleFollowUp,
    handleSendFollowUp,
    handleReschedule,
    reschedulingId,
    setReschedulingId
  };


}

