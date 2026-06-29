import { useState, useEffect, useCallback, useRef } from 'react';
import { AppointmentData, Contact, HistoricalAppointment, AppointmentStatus } from '../types';
import { INITIAL_CONTACTS } from '../constants';
// Import Capacitor Alarm plugin (install with `npm install @capacitor/alarm`)
import { Alarm } from '@capacitor/alarm';

// ... existing imports remain unchanged

import { App } from '@capacitor/app';
import { Contacts as CapacitorContacts } from '@capacitor-community/contacts';
import { Capacitor, registerPlugin } from '@capacitor/core';
// Attempt safe registration by checking existing plugins first
let NotificationPermission: any;
try {
  NotificationPermission = Capacitor.getPlugin('NotificationPermission');
} catch (e) {
  // Fallback to registerPlugin if not found
  NotificationPermission = registerPlugin<any>('NotificationPermission');
}

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

        // Deduplicate distinct ID/name + primary phone number pairs
        const uniqueContacts: Contact[] = [];
        migrated.sort((a, b) => b.lastUsed - a.lastUsed).forEach((c: Contact) => {
          const existing = uniqueContacts.find(ex =>
            (ex.id && c.id ? ex.id === c.id : ex.name.toLowerCase().trim() === c.name.toLowerCase().trim()) &&
            ex.phoneNumbers[0] === c.phoneNumbers[0]
          );

          if (existing) {
            existing.lastUsed = Math.max(existing.lastUsed, c.lastUsed);
          } else {
            uniqueContacts.push(c);
          }
        });

        return uniqueContacts.slice(0, 10);
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

    const defaultReminderEnabled = localStorage.getItem('defaultAutomaticActivation') !== 'false';
    const defaultFollowUpTimer = localStorage.getItem('defaultFollowUpTimer') || '20s';
    const defaultPreMeetingTimer = localStorage.getItem('defaultPreMeetingTimer') || '20s';

    return {
      address: '',
      date: dateStr,
      time: timeStr,
      contact: selectedContact,
      selectedPhoneNumber: selectedContact.phoneNumbers[0] || '',
      followUpEnabled: defaultReminderEnabled,
      preMeetingEnabled: defaultReminderEnabled,
      leadTime: '30 mins',
      followUpTimer: defaultFollowUpTimer as any,
      preMeetingTimer: defaultPreMeetingTimer as any
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

  // --- Message Template ---
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    return localStorage.getItem('messageTemplate') || 'Hello *{name}*, looking forward to our meeting at *{location}* on *{date}* at *{time}*. *Reply OK to confirm.*';
  });

  useEffect(() => {
    localStorage.setItem('messageTemplate', messageTemplate);
  }, [messageTemplate]);

  // --- Reschedule Message Template ---
  const [rescheduleTemplate, setRescheduleTemplate] = useState<string>(() => {
    return localStorage.getItem('rescheduleTemplate') || 'Hello *{name}*, our meeting has been rescheduled to *{location}* on *{date}* at *{time}*. *Reply OK to confirm.*';
  });

  useEffect(() => {
    localStorage.setItem('rescheduleTemplate', rescheduleTemplate);
  }, [rescheduleTemplate]);

  // --- UI/Modal States ---
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualContact, setManualContact] = useState({ name: '', phone: '' });
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [externalContacts, setExternalContacts] = useState<Contact[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [currentPage, setCurrentPage] = useState<'schedule' | 'history' | 'settings'>('schedule');
  const [selectedFollowUp, setSelectedFollowUp] = useState<HistoricalAppointment | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<HistoricalAppointment | null>(null);
  const [selectedNotesAppt, setSelectedNotesAppt] = useState<HistoricalAppointment | null>(null);
  const [selectedClientHistoryContact, setSelectedClientHistoryContact] = useState<any | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  const historyRef = useRef<HistoricalAppointment[]>(history);

  // Keep the ref in sync with history updates
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    localStorage.setItem('appointmentHistory', JSON.stringify(history));
  }, [history]);

  const isFastTest = true;
  const PENDING_THRESHOLD = isFastTest ? 20 * 1000 : 2 * 60 * 60 * 1000;

  const notifiedIds = useRef<Set<string>>(new Set());
  const preMeetingNotifiedIds = useRef<Set<string>>(new Set());
  // Ref to keep the pre‑meeting interval ID so we can pause/resume it based on app state
  const preMeetingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to parse appointment date and time into timestamp
  const getAppointmentTimestamp = (dateStr: string, timeStr: string): number => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes).getTime();
    } catch (e) {
      return 0;
    }
  };

  // Initialize with currently pending/confirmed appointments to avoid duplicate notifications on start
  useEffect(() => {
    history.forEach(appt => {
      if (appt.status === 'PENDING') {
        notifiedIds.current.add(appt.id);
      }
      // If confirmed meeting has already passed or is very close, mark as notified to prevent spam on launch
      if (appt.status === 'CONFIRMED') {
        const apptTime = getAppointmentTimestamp(appt.date, appt.time);
        if (apptTime > 0 && (apptTime - Date.now()) <= 0) {
          preMeetingNotifiedIds.current.add(appt.id);
        }
      }
    });
  }, []);

  // --- Trigger Notifications for newly PENDING appointments ---
  useEffect(() => {
    history.forEach(appt => {
      if (appt.status === 'PENDING' && !notifiedIds.current.has(appt.id)) {
        notifiedIds.current.add(appt.id);
        
        // Show push notification
        if (Capacitor.isNativePlatform()) {
          NotificationPermission.showNotification({
            title: 'Appointment Follow-up Required',
            body: `No response from ${appt.contact.name} for appointment at ${appt.time} on ${appt.date}. Nudge them?`,
            appointmentId: appt.id
          }).catch((err: any) => {
            console.error('Failed to trigger native notification:', err);
          });
        } else {
          console.log(`[Notification Fallback] PENDING status for ${appt.contact.name}`, appt);
        }
      }
    });
  }, [history]);

  // --- Trigger Notifications for Pre-Meeting (CONFIRMED) appointments with app state handling ---
  useEffect(() => {
    const checkPreMeeting = () => {
      const now = Date.now();
      // Use the ref to always get the latest history without recreating the interval
      historyRef.current.forEach(appt => {
        if (appt.status === 'CONFIRMED' && (appt.preMeetingEnabled ?? true) && !preMeetingNotifiedIds.current.has(appt.id)) {
          const apptTime = getAppointmentTimestamp(appt.date, appt.time);
          if (apptTime > 0) {
            let threshold = 30 * 60 * 1000; // default 30 mins
            if (appt.preMeetingTimer) {
              if (appt.preMeetingTimer === '20s') {
                threshold = 20 * 1000;
              } else if (appt.preMeetingTimer === '30 mins') {
                threshold = 30 * 60 * 1000;
              } else if (appt.preMeetingTimer === '1 hour') {
                threshold = 60 * 60 * 1000;
              } else if (appt.preMeetingTimer === '2 hours') {
                threshold = 2 * 60 * 60 * 1000;
              } else if (appt.preMeetingTimer === '1 day') {
                threshold = 24 * 60 * 60 * 1000;
              }
            }
            const timeRemaining = apptTime - now;
            // Debug logging for timer evaluation
            console.log('Pre‑Meeting check:', {
              id: appt.id,
              name: appt.contact.name,
              time: appt.time,
              date: appt.date,
              apptTime,
              now,
              timeRemaining,
              threshold
            });
            if (timeRemaining > 0 && timeRemaining <= threshold) {
              preMeetingNotifiedIds.current.add(appt.id);
              if (Capacitor.isNativePlatform()) {
                NotificationPermission.showNotification({
                  title: 'Upcoming Appointment Reminder',
                  body: `Your appointment with ${appt.contact.name} is starting in ${appt.preMeetingTimer || '30 mins'} at ${appt.time}.`,
                  appointmentId: appt.id,
                  type: 'preMeeting'
                }).catch(err => {
                  console.error('Failed to trigger native pre-meeting notification:', err);
                });
              } else {
                console.log(`[Notification Fallback] PRE-MEETING threshold reached for ${appt.contact.name}`, appt);
              }
            }
          }
        }
      });
    };
  
    const startInterval = () => {
      if (!preMeetingIntervalRef.current) {
        preMeetingIntervalRef.current = setInterval(checkPreMeeting, 1000);
      }
    };
  
    const stopInterval = () => {
      if (preMeetingIntervalRef.current) {
        clearInterval(preMeetingIntervalRef.current);
        preMeetingIntervalRef.current = null;
      }
    };
  
    // Start interval on mount
    startInterval();
  
    // Listen for app state changes
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        startInterval();
      } else {
        stopInterval();
      }
    });
  
    return () => {
      stopInterval();
      // Remove the listener when component unmounts
      listener.remove();
    };
  }, []);

  // --- Timer logic for SENT -> PENDING using dynamic Follow-Up configurations ---
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        let changed = false;
        const now = Date.now();
        const updated = prev.map(appt => {
          let threshold = PENDING_THRESHOLD;
          if (appt.followUpTimer) {
            if (appt.followUpTimer === '20s') {
              threshold = 20 * 1000;
            } else if (appt.followUpTimer === '10 mins') {
              threshold = 10 * 60 * 1000;
            } else if (appt.followUpTimer === '30 mins') {
              threshold = 30 * 60 * 1000;
            } else if (appt.followUpTimer === '1 hour') {
              threshold = 60 * 60 * 1000;
            } else if (appt.followUpTimer === '2 hours') {
              threshold = 2 * 60 * 60 * 1000;
            }
          }

           if (appt.status === 'SENT' && appt.followUpEnabled && (now - appt.sentAt) > threshold) {
            changed = true;
            return { ...appt, status: 'PENDING' as const, updatedAt: now };
          }
          return appt;
        });
        return changed ? updated : prev;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // --- Notification Tap Navigation Listener ---
  useEffect(() => {
    const handleNavigation = (e: any) => {
        const { tab, appointmentId, type } = e.detail;
        if (tab === 'history' || tab === 'schedule' || tab === 'settings') {
          setCurrentPage(tab);
        }
        if (appointmentId) {
          setHistory(currentHistory => {
            const appt = currentHistory.find(a => a.id === appointmentId);
            if (appt) {
              setTimeout(() => {
                if (type === 'preMeeting') {
                  // Open appointment details without triggering the follow‑up UI
                  setCurrentPage('history'); // or any appropriate page
                } else {
                  setSelectedFollowUp(appt);
                }
              }, 100);
            }
            return currentHistory;
          });
        }
      };
    window.addEventListener('navigate-tab', handleNavigation);
    
    // Also check on startup (cold start)
    const checkPendingNavigation = async () => {
      try {
        const res = await NotificationPermission.getPendingNavigation();
        if (res && res.tab) {
          setCurrentPage(res.tab);
          if (res.appointmentId) {
            setTimeout(() => {
              setHistory(currentHistory => {
                const appt = currentHistory.find(a => a.id === res.appointmentId);
                if (appt) {
                  setSelectedFollowUp(appt);
                }
                return currentHistory;
              });
            }, 300);
          }
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

  // --- Android Hardware Back Button Listener ---
  useEffect(() => {
    const backButtonListener = App.addListener('backButton', () => {
      if (selectedClientHistoryContact) {
        setSelectedClientHistoryContact(null);
        return;
      }
      if (selectedNotesAppt) {
        setSelectedNotesAppt(null);
        return;
      }
      if (selectedFollowUp) {
        setSelectedFollowUp(null);
        return;
      }
      if (selectedReminder) {
        setSelectedReminder(null);
        return;
      }
      if (showTimePicker) {
        setShowTimePicker(false);
        return;
      }
      if (isContactPickerOpen) {
        setIsContactPickerOpen(false);
        return;
      }
      if (isManualAddOpen) {
        setIsManualAddOpen(false);
        return;
      }
      if (reschedulingId) {
        setReschedulingId(null);
        return;
      }
      if (currentPage === 'schedule' && currentStep > 1) {
        setCurrentStep(currentStep - 1);
        return;
      }
      if (currentPage !== 'schedule') {
        setCurrentPage('schedule');
        return;
      }
      App.exitApp();
    });

    return () => {
      backButtonListener.remove();
    };
  }, [
    selectedClientHistoryContact,
    selectedNotesAppt,
    selectedFollowUp,
    selectedReminder,
    showTimePicker,
    isContactPickerOpen,
    isManualAddOpen,
    reschedulingId,
    currentPage,
    currentStep
  ]);

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

      // Strip any backslashes (often introduced by shell escaping during debugging)
      const cleanMessage = message.replace(/\\/g, '');

      const storedKeywords = localStorage.getItem('confirmKeywords');
      const confirmKeywords = (storedKeywords 
        ? JSON.parse(storedKeywords)
        : ['ok', 'yes', 'confirm', 'sure', 'confirmed', 'yep', 'noted', 'fine', 'see you', 'okay', 'correct', 'agree', 'perfect', 'will do', 'booked', 'awesome', '👍', '👌', 'deal']
      ).filter((k: string) => k.toLowerCase() !== 'can');
      const rescheduleKeywords = ['cannot', 'can not', "can't", 'cant', 'reschedule', 'change', 'unable', 'busy', 'next time', 'other time', 'different day', 'cancel', 'cancelling', 'postpone', 'not free', 'no free', 'another time', 'another day'];
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

      const isRescheduleRequest = checkKeywords(cleanMessage, rescheduleKeywords);
      const isAmbiguous = checkKeywords(cleanMessage, ambiguousKeywords);
      // Prioritize reschedule request, but if ambiguous and not rescheduling, block confirmation
      const isConfirmation = (isRescheduleRequest || isAmbiguous) ? false : checkKeywords(cleanMessage, confirmKeywords);

      if (isAmbiguous && !isRescheduleRequest) {
        console.log(`[WhatsAppointment] Reply is ambiguous ("${cleanMessage}"). Keeping appointment status PENDING.`);
      }

      setHistory(prev => {
        let changed = false;
        let matchedId = '';
        let targetStatus: 'CONFIRMED' | 'RESCHEDULED' | null = null;

        // Clone and sort the history by sentAt descending (newest first) to ensure chronological scanning
        const sortedHistory = [...prev].sort((a, b) => b.sentAt - a.sentAt);

        // Step 1: Find the target active appointment for this contact
        for (const appt of sortedHistory) {
          // Extract only digits to check phone number matching
          const senderDigits = sender.replace(/\D/g, '');
          const apptPhoneDigits = appt.selectedPhoneNumber ? appt.selectedPhoneNumber.replace(/\D/g, '') : '';
          const contactPhones = appt.contact.phoneNumbers ? appt.contact.phoneNumbers.map(p => p.replace(/\D/g, '')) : [];
          
          let isPhoneMatch = false;
          if (senderDigits.length >= 7) {
            // Check if selected phone number matches or ends with the sender digits, or vice versa
            if (apptPhoneDigits.length >= 7 && (apptPhoneDigits.endsWith(senderDigits) || senderDigits.endsWith(apptPhoneDigits))) {
              isPhoneMatch = true;
            }
            // Check other numbers of the contact
            if (!isPhoneMatch) {
              isPhoneMatch = contactPhones.some(p => p.length >= 7 && (p.endsWith(senderDigits) || senderDigits.endsWith(p)));
            }
          }

          const cleanApptName = appt.contact.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cleanSenderName = sender.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

          const isValidMatchLength = Math.min(cleanApptName.length, cleanSenderName.length) >= 3;
          const isNameMatch = isValidMatchLength && (
            cleanApptName.includes(cleanSenderName) || 
            cleanSenderName.includes(cleanApptName)
          );

          const isMatch = isNameMatch || isPhoneMatch;

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
      // 1. Move the selected phone number to the first position of the array
      const otherNumbers = contact.phoneNumbers.filter(num => num !== phoneNumber);
      const reorderedNumbers = [phoneNumber, ...otherNumbers];
      
      const contactWithSelectedNum = {
        ...contact,
        phoneNumbers: reorderedNumbers,
        lastUsed: Date.now()
      };

      // 2. Check if this specific contact + phone number combo is already in recents
      const existsIndex = prev.findIndex(c => 
        (c.id && contact.id ? c.id === contact.id : c.name.toLowerCase().trim() === contact.name.toLowerCase().trim()) &&
        c.phoneNumbers[0] === phoneNumber
      );

      let updated = [...prev];
      if (existsIndex > -1) {
        // If it exists, update it in place so it stays at the original position
        updated[existsIndex] = contactWithSelectedNum;
      } else {
        // If it's a new contact selection, prepend it to the list
        updated = [contactWithSelectedNum, ...updated];
      }
      return updated.slice(0, 10);
    });

    setFormData(prev => ({
      ...prev,
      contact: contact,
      selectedPhoneNumber: phoneNumber
    }));

    setCurrentStep(2);

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
      return prev.map(c =>
        (c.id === formData.contact.id && c.phoneNumbers[0] === formData.selectedPhoneNumber)
          ? { ...c, lastUsed: Date.now() }
          : c
      );
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

    const templateToUse = reschedulingId ? rescheduleTemplate : messageTemplate;
    const message = templateToUse
      .replace(/{name}/g, formData.contact.name || 'there')
      .replace(/{location}/g, formData.address || 'the location')
      .replace(/{date}/g, formattedDate)
      .replace(/{time}/g, formattedTime);

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

    let phone = formData.selectedPhoneNumber;
    if (phone && phone.startsWith('01')) {
      phone = '6' + phone;
    }

    const openUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(openUrl, '_system');

    // Revert to Step 1 and reset form data for next appointment scheduling
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    const defaultReminderEnabled = localStorage.getItem('defaultAutomaticActivation') !== 'false';
    const defaultFollowUpTimer = localStorage.getItem('defaultFollowUpTimer') || '20s';
    const defaultPreMeetingTimer = localStorage.getItem('defaultPreMeetingTimer') || '20s';

    const defaultContact: Contact = contacts[0] || {
      id: 'default',
      name: 'Select Contact',
      avatar: 'https://ui-avatars.com/api/?name=?&background=random',
      status: 'Hey there! I am using WhatsApp.',
      phoneNumbers: []
    };

    setFormData({
      address: '',
      date: dateStr,
      time: timeStr,
      contact: defaultContact,
      selectedPhoneNumber: defaultContact.phoneNumbers[0] || '',
      followUpEnabled: defaultReminderEnabled,
      preMeetingEnabled: defaultReminderEnabled,
      leadTime: '30 mins',
      followUpTimer: defaultFollowUpTimer as any,
      preMeetingTimer: defaultPreMeetingTimer as any
    });

    setCurrentStep(1);
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

  const deleteAppointmentsForClient = (contactId: string) => {
    const nextHistory = history.filter(appt => appt.contact.id !== contactId);
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));
  };

  const updateAppointmentNotes = (id: string, notes: string) => {
    const nextHistory = history.map(appt => 
      appt.id === id ? { ...appt, notes, updatedAt: Date.now() } : appt
    );
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));
  };

  const handleRebook = (appt: HistoricalAppointment) => {
    const freshFormData = {
      contact: appt.contact,
      selectedPhoneNumber: appt.selectedPhoneNumber || appt.contact.phoneNumbers[0],
      address: appt.address,
      date: '',
      time: '',
      followUpEnabled: (appt as any).followUpEnabled ?? ((appt as any).reminderEnabled ?? true),
      preMeetingEnabled: (appt as any).preMeetingEnabled ?? ((appt as any).reminderEnabled ?? true),
      leadTime: appt.leadTime || '1 hour',
      followUpTimer: appt.followUpTimer || '20s',
      preMeetingTimer: appt.preMeetingTimer || '30 mins'
    };

    setFormData(freshFormData);
    setReschedulingId(null);
    localStorage.removeItem('reschedulingId');
    localStorage.removeItem('rescheduleFormData');
    setCurrentPage('schedule');
    setCurrentStep(2);
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
    let phone = selectedFollowUp.selectedPhoneNumber || selectedFollowUp.contact.phoneNumbers[0];
    if (phone && phone.startsWith('01')) {
      phone = '6' + phone;
    }
    
    // Update history synchronously to mark it as just updated before opening
    const nextHistory = history.map(a => 
      a.id === selectedFollowUp.id ? { ...a, updatedAt: Date.now() } : a
    );
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));

    const openUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(openUrl, '_system');
    setSelectedFollowUp(null);
  };

  const handleReminder = (appt: HistoricalAppointment) => {
    setSelectedReminder(appt);
  };

  const handleSendReminder = (templateId: string) => {
    if (!selectedReminder) return;

    const templates = [
      {
        id: 'reminder_friendly',
        text: (name: string, time: string, address: string) => {
          const formattedTime = (() => {
            try {
              const [h, m] = time.split(':');
              const hr = parseInt(h);
              const ampm = hr >= 12 ? 'PM' : 'AM';
              return `${hr % 12 || 12}:${m} ${ampm}`;
            } catch (e) {
              return time;
            }
          })();
          return `Hi ${name}, looking forward to our appointment later at ${formattedTime}! Here is the location just in case: ${address || 'our office'}. See you soon! 😊`;
        }
      },
      {
        id: 'reminder_logistics',
        text: (name: string, time: string, address: string) => {
          const formattedTime = (() => {
            try {
              const [h, m] = time.split(':');
              const hr = parseInt(h);
              const ampm = hr >= 12 ? 'PM' : 'AM';
              return `${hr % 12 || 12}:${m} ${ampm}`;
            } catch (e) {
              return time;
            }
          })();
          return `Hi ${name}, checking if you're on the way for our appointment at ${formattedTime}? The address is ${address || 'the scheduled location'}. Let me know if you need help finding it! 🚗`;
        }
      },
      {
        id: 'reminder_time_check',
        text: (name: string, time: string, address: string) => {
          const formattedTime = (() => {
            try {
              const [h, m] = time.split(':');
              const hr = parseInt(h);
              const ampm = hr >= 12 ? 'PM' : 'AM';
              return `${hr % 12 || 12}:${m} ${ampm}`;
            } catch (e) {
              return time;
            }
          })();
          return `Hi ${name}, just a quick heads-up that our meeting is coming up at ${formattedTime} at ${address || 'the scheduled location'}. Please confirm if you're still good to go! ⏰`;
        }
      }
    ];

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const message = template.text(
      selectedReminder.contact.name,
      selectedReminder.time,
      selectedReminder.address
    );
    const encodedMessage = encodeURIComponent(message);
    let phone = selectedReminder.selectedPhoneNumber || selectedReminder.contact.phoneNumbers[0];
    if (phone && phone.startsWith('01')) {
      phone = '6' + phone;
    }

    // Update history synchronously to mark it as just updated before opening
    const nextHistory = history.map(a =>
      a.id === selectedReminder.id ? { ...a, updatedAt: Date.now() } : a
    );
    setHistory(nextHistory);
    localStorage.setItem('appointmentHistory', JSON.stringify(nextHistory));

    const openUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(openUrl, '_system');
    setSelectedReminder(null);
  };

  const handleReschedule = (appt: HistoricalAppointment) => {
    const freshFormData = {
      contact: appt.contact,
      selectedPhoneNumber: appt.selectedPhoneNumber || appt.contact.phoneNumbers[0],
      address: appt.address,
      date: appt.date,
      time: appt.time,
      followUpEnabled: (appt as any).followUpEnabled ?? ((appt as any).reminderEnabled ?? true),
      preMeetingEnabled: (appt as any).preMeetingEnabled ?? ((appt as any).reminderEnabled ?? true),
      leadTime: appt.leadTime || '1 hour',
      followUpTimer: appt.followUpTimer || '20s',
      preMeetingTimer: appt.preMeetingTimer || '30 mins'
    };

    // 1. Pre-fill the scheduler with existing data
    setFormData(freshFormData);

    // 2. Mark this appointment id as being rescheduled
    setReschedulingId(appt.id);
    localStorage.setItem('reschedulingId', appt.id);
    localStorage.setItem('rescheduleFormData', JSON.stringify(freshFormData));

    // 3. Navigate back to schedule page
    setCurrentPage('schedule');
    setCurrentStep(2);
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
    deleteAppointmentsForClient,
    selectedFollowUp,
    setSelectedFollowUp,
    handleFollowUp,
    handleSendFollowUp,
    selectedReminder,
    setSelectedReminder,
    handleReminder,
    handleSendReminder,
    handleReschedule,
    reschedulingId,
    setReschedulingId,
    selectedNotesAppt,
    setSelectedNotesAppt,
    updateAppointmentNotes,
    handleRebook,
    messageTemplate,
    setMessageTemplate,
    rescheduleTemplate,
    setRescheduleTemplate,
    selectedClientHistoryContact,
    setSelectedClientHistoryContact,
    showTimePicker,
    setShowTimePicker,
    currentStep,
    setCurrentStep
  };
}
