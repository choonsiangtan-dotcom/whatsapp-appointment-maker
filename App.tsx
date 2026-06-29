import React from 'react';
import Layout from './components/Layout';
import ContactSelector from './components/ContactSelector';
import InputField from './components/InputField';
import { AppointmentData } from './types';
import { Capacitor } from '@capacitor/core';
import { Contacts as CapacitorContacts } from '@capacitor-community/contacts';
import ContactPickerModal from './components/ContactPickerModal';
import { useAppLogic } from './hooks/useAppLogic';
import ToggleSwitch from './components/ui/ToggleSwitch';
import History from './components/History';
import FollowUpModal from './components/FollowUpModal';
import ReminderModal from './components/ReminderModal';
import NotesModal from './components/NotesModal';
import { useNotificationPermission } from './hooks/useNotificationPermission';
import TimePickerModal from './components/TimePickerModal';
import ClientHistoryActivity from './components/ClientHistoryActivity';
import { useDragScroll } from './hooks/useDragScroll';

const App: React.FC = () => {
  const { 
    hasPermission, 
    requestPermission, 
    hasNotificationPermission, 
    requestNotificationPerm,
    autoConfirmEnabled,
    setAutoConfirmEnabled,
    alertsEnabled,
    setAlertsEnabled,
    openAppNotificationSettings,
    batteryOptimizationIgnored,
    openStartupManager,
    requestIgnoreBatteryOptimization
  } = useNotificationPermission();
  const {
    contacts,
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
  } = useAppLogic();

  const dateDrag = useDragScroll();
  const timeDrag = useDragScroll();
  const dateInputRef = React.useRef<HTMLInputElement | null>(null);

  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSideMargins = 32; // 16px left + 16px right of form card padding
  const itemWidth = (screenWidth - totalSideMargins) / 5.2;

  const [timePeriod, setTimePeriod] = React.useState<'AM' | 'PM'>(() => {
    const currentHour = new Date().getHours();
    return currentHour < 12 ? 'AM' : 'PM';
  });

  React.useEffect(() => {
    if (formData.time) {
      const [h] = formData.time.split(':');
      const hr = parseInt(h);
      const period = hr >= 12 ? 'PM' : 'AM';
      setTimePeriod(period);
    }
  }, [formData.time]);

  const [slotOverrides, setSlotOverrides] = React.useState<Record<string, string>>({});
  const [longPressedSlot, setLongPressedSlot] = React.useState<{ baseSlot: string, value: string, label: string } | null>(null);

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = React.useRef<{ x: number, y: number } | null>(null);

  const startLongPress = (item: { baseSlot: string, value: string, label: string }, e: React.MouseEvent | React.TouchEvent) => {
    if (formData.time !== item.value) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setLongPressedSlot(item);
      longPressTimerRef.current = null;
    }, 2000);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  const dateOptions = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const formattedDates = React.useMemo(() => {
    return dateOptions.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { dayName, dayNum, monthName, value };
    });
  }, [dateOptions]);

  const finalDateList = React.useMemo(() => {
    const list = [...formattedDates];
    const isSelectedInList = list.some(item => item.value === formData.date);
    if (formData.date && !isSelectedInList) {
      const [year, month, day] = formData.date.split('-').map(Number);
      const customDate = new Date(year, month - 1, day);
      if (!isNaN(customDate.getTime())) {
        list.push({
          dayName: customDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: customDate.getDate(),
          monthName: customDate.toLocaleDateString('en-US', { month: 'short' }),
          value: formData.date
        });
      }
    }
    return list;
  }, [formattedDates, formData.date]);

  const timeSlots = React.useMemo(() => {
    return [
      '08:00', '09:00', '10:00', '11:00', // AM
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00' // PM
    ];
  }, []);

  const filteredTimeSlots = React.useMemo(() => {
    return timeSlots.filter(baseSlot => {
      const actualTime = slotOverrides[baseSlot] || baseSlot;
      const [h] = actualTime.split(':');
      const hr = parseInt(h);
      const slotPeriod = hr >= 12 ? 'PM' : 'AM';
      return slotPeriod === timePeriod;
    });
  }, [timeSlots, timePeriod, slotOverrides]);

  const formattedTimeSlots = React.useMemo(() => {
    return filteredTimeSlots.map(baseSlot => {
      const value = slotOverrides[baseSlot] || baseSlot;
      const [h, m] = value.split(':');
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const label = `${hr % 12 || 12}:${m} ${ampm}`;
      return { baseSlot, value, label };
    });
  }, [filteredTimeSlots, slotOverrides]);

  const finalTimeList = React.useMemo(() => {
    const list = [...formattedTimeSlots];
    if (formData.time) {
      const [h, m] = formData.time.split(':');
      const hr = parseInt(h);
      const selectedPeriod = hr >= 12 ? 'PM' : 'AM';
      if (selectedPeriod === timePeriod) {
        const isSelectedInList = list.some(item => item.value === formData.time);
        if (!isSelectedInList) {
          const ampm = hr >= 12 ? 'PM' : 'AM';
          const label = `${hr % 12 || 12}:${m} ${ampm}`;
          list.push({
            baseSlot: formData.time,
            value: formData.time,
            label
          });
        }
      }
    }
    return list;
  }, [formattedTimeSlots, formData.time, timePeriod]);

  const triggerCustomDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleRebookWrapped = (appt: any) => {
    setSelectedClientHistoryContact(null);
    handleRebook(appt);
  };

  const handleRescheduleWrapped = (appt: any) => {
    setSelectedClientHistoryContact(null);
    handleReschedule(appt);
  };

  React.useEffect(() => {
    setSelectedClientHistoryContact(null);
  }, [currentPage]);

  const [isEditingTemplate, setIsEditingTemplate] = React.useState(false);
  const [tempTemplate, setTempTemplate] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Helper to parse double asterisks or single asterisks for bold formatting in preview
  const renderFormattedMessage = (text: string) => {
    const parts = text.split('*');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-[#006b5f]">{part}</strong>;
      }
      return part;
    });
  };

  // Helper to parse the template with actual values
  const getParsedMessage = () => {
    const contactName = formData.contact && formData.contact.id !== 'default' ? formData.contact.name : 'there';
    const formattedDate = formData.date ? formData.date.split('-').reverse().join('/') : 'date';
    let formattedTime = 'time';
    if (formData.time && formData.time.includes(':')) {
      const [h, m] = formData.time.split(':');
      const hr = parseInt(h);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      formattedTime = `${hr % 12 || 12}:${m} ${ampm}`;
    }

    const templateToUse = reschedulingId ? rescheduleTemplate : messageTemplate;
    return templateToUse
      .replace(/{name}/g, contactName)
      .replace(/{location}/g, formData.address || 'the location')
      .replace(/{date}/g, formattedDate)
      .replace(/{time}/g, formattedTime);
  };

  const [showFollowUpInfo, setShowFollowUpInfo] = React.useState(false);
  const [showPreMeetingInfo, setShowPreMeetingInfo] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'followUp' | 'preMeeting'>('followUp');

  // --- Reminder Strategy Dedicated Configuration Hub States ---
  const [defaultAutomaticActivation, setDefaultAutomaticActivation] = React.useState<boolean>(() => {
    return localStorage.getItem('defaultAutomaticActivation') !== 'false';
  });

  const [defaultFollowUpTimer, setDefaultFollowUpTimer] = React.useState<string>(() => {
    return localStorage.getItem('defaultFollowUpTimer') || '20s';
  });

  const [defaultPreMeetingTimer, setDefaultPreMeetingTimer] = React.useState<string>(() => {
    return localStorage.getItem('defaultPreMeetingTimer') || '20s';
  });

  const [vibrateEnabled, setVibrateEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem('recoveryProtocol_vibrate') !== 'false';
  });

  const [soundEnabled, setSoundEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem('recoveryProtocol_sound') !== 'false'; // default to true
  });

  const [persistentEnabled, setPersistentEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem('recoveryProtocol_persistent') === 'true';
  });

  const [oneTapSendEnabled, setOneTapSendEnabled] = React.useState<boolean>(() => {
    return localStorage.getItem('oneTapSendEnabled') !== 'false'; // default to true
  });

  const [confirmKeywords, setConfirmKeywords] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('confirmKeywords');
    const defaults = ['ok', 'yes', 'confirm', 'sure', 'confirmed', 'yep', 'noted', 'fine', 'see you', 'okay', 'correct', 'agree', 'perfect', 'will do', 'booked', 'awesome', '👍', '👌', 'deal'];
    const list = saved ? JSON.parse(saved) : defaults;
    return list.filter((k: string) => k.toLowerCase() !== 'can');
  });

  const [keywordInput, setKeywordInput] = React.useState('');

  const [showGlobalFollowUpInfo, setShowGlobalFollowUpInfo] = React.useState(false);
  const [showGlobalPreMeetingInfo, setShowGlobalPreMeetingInfo] = React.useState(false);

  // Sync states to localStorage
  React.useEffect(() => {
    localStorage.setItem('defaultAutomaticActivation', String(defaultAutomaticActivation));
  }, [defaultAutomaticActivation]);

  React.useEffect(() => {
    localStorage.setItem('defaultFollowUpTimer', defaultFollowUpTimer);
  }, [defaultFollowUpTimer]);

  React.useEffect(() => {
    localStorage.setItem('defaultPreMeetingTimer', defaultPreMeetingTimer);
  }, [defaultPreMeetingTimer]);

  React.useEffect(() => {
    localStorage.setItem('recoveryProtocol_vibrate', String(vibrateEnabled));
  }, [vibrateEnabled]);

  React.useEffect(() => {
    localStorage.setItem('recoveryProtocol_sound', String(soundEnabled));
  }, [soundEnabled]);

  React.useEffect(() => {
    localStorage.setItem('recoveryProtocol_persistent', String(persistentEnabled));
  }, [persistentEnabled]);

  React.useEffect(() => {
    localStorage.setItem('oneTapSendEnabled', String(oneTapSendEnabled));
  }, [oneTapSendEnabled]);

  React.useEffect(() => {
    localStorage.setItem('confirmKeywords', JSON.stringify(confirmKeywords));
  }, [confirmKeywords]);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // high tone A5
      oscillator.frequency.setValueAtTime(1109, audioCtx.currentTime + 0.08); // third C#6
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio Context not allowed or supported yet', e);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !confirmKeywords.includes(trimmed)) {
      setConfirmKeywords([...confirmKeywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setConfirmKeywords(confirmKeywords.filter(k => k !== keyword));
  };





  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleSeeAll = async () => {
    if (Capacitor.isNativePlatform()) {
      setIsContactPickerOpen(true);
      setIsFetchingContacts(true);
      try {
        const permission = await CapacitorContacts.requestPermissions();
        if (permission.contacts !== 'granted') {
          alert('Permission to access contacts was denied.');
          setIsContactPickerOpen(false);
          setIsFetchingContacts(false);
          return;
        }

        const result = await CapacitorContacts.getContacts({
          projection: { name: true, phones: true, image: true, organization: true }
        });

        if (result.contacts) {
          const mappedContacts = result.contacts
            .filter(nc => nc.phones && nc.phones.length > 0)
            .map(nc => {
              const phoneNumbers = Array.from(new Set(nc.phones!.map(p => p.number ? p.number.replace(/\D/g, '') : '').filter(Boolean))).sort();
              return {
                id: nc.contactId || crypto.randomUUID(),
                name: nc.name?.display || 'Unknown',
                avatar: nc.image?.base64String
                  ? `data:image/jpeg;base64,${nc.image.base64String.replace(/[\r\n]/g, '')}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(nc.name?.display || 'U')}&background=F1F5F9&color=64748B&bold=true`,
                status: nc.organization?.company || 'Hey there! I am using WhatsApp.',
                phoneNumbers,
                lastUsed: Date.now()
              };
            })
            .filter(c => c.phoneNumbers.length > 0);
          setExternalContacts(mappedContacts);
        }
      } catch (err) {
        console.error('Error with native contacts:', err);
        setIsContactPickerOpen(false);
        setIsManualAddOpen(true);
      } finally {
        setIsFetchingContacts(false);
      }
      return;
    }

    const isPickerSupported = 'contacts' in navigator && 'ContactsManager' in window;
    if (isPickerSupported) {
      try {
        const props = ['name', 'icon', 'tel'];
        const opts = { multiple: true };
        // @ts-ignore
        const selectedContacts = await navigator.contacts.select(props, opts);

        if (selectedContacts.length > 0) {
          const newContactsRaw = await Promise.all(selectedContacts.map(async (c: any) => {
            let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name?.[0] || 'U')}&background=F1F5F9&color=64748B&bold=true`;
            if (c.icon?.[0]) {
              try { avatar = await blobToBase64(c.icon[0]); } catch (e) { console.error(e); }
            }
            const phoneNumbers = c.tel ? c.tel.map((t: string) => t.replace(/\D/g, '')).filter((n: string) => n.length >= 7) : [];
            return {
              id: crypto.randomUUID(),
              name: c.name?.[0] || 'Unknown',
              avatar,
              status: 'Hey there! I am using WhatsApp.',
              phoneNumbers: Array.from(new Set(phoneNumbers)).sort(),
              lastUsed: Date.now()
            };
          }));

          const validContacts = newContactsRaw.filter(c => c.phoneNumbers.length > 0);
          if (validContacts.length === 1) {
            handleSelectContact(validContacts[0], validContacts[0].phoneNumbers[0]);
          } else if (validContacts.length > 1) {
            setExternalContacts(validContacts);
            setIsContactPickerOpen(true);
          }
        }
      } catch (ex: any) {
        const errMsg = ex?.message || String(ex);
        if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('dismiss')) {
          console.log('[handleSeeAll] User cancelled web contacts picker.');
          return;
        }
        console.error('Error picking contact web:', ex);
        setIsManualAddOpen(true);
      }
    } else {
      setIsManualAddOpen(true);
    }
  };

  const leadTimes: AppointmentData['leadTime'][] = ['30 mins', '1 hour', '1 day'];

  const [pickerSearch, setPickerSearch] = React.useState('');

  React.useEffect(() => {
    if (formData.contact.name && formData.contact.id !== 'default') {
      setPickerSearch(formData.contact.name);
    }
  }, [formData.contact]);

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
      modals={
        <>
          <ContactPickerModal
            isOpen={isContactPickerOpen}
            onClose={() => setIsContactPickerOpen(false)}
            contacts={externalContacts}
            isLoading={isFetchingContacts}
            onSelect={handleSelectContact}
            selectedContactId={formData.contact.id}
          />

          {isManualAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-[#bacac5]/20 animate-in zoom-in-95 duration-200">
                <h3 className="txt-display font-bold text-[#131b2e] mb-1">Add Contact</h3>
                <p className="txt-secondary text-[#6b7a76] mb-6 font-normal">Add a person specifically for WhatsApp.</p>
                <div className="space-y-4">
                  <InputField
                    label="Full Name"
                    icon="person"
                    value={manualContact.name}
                    onChange={(e) => setManualContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                  />
                  <InputField
                    label="Phone Number"
                    icon="call"
                    value={manualContact.phone}
                    onChange={(e) => setManualContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 60123456789"
                    type="tel"
                  />
                </div>
                <div className="mt-8 flex space-x-3">
                  <button
                    onClick={() => setIsManualAddOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-[#6b7a76] hover:bg-[#f2f3ff] transition-colors font-display"
                  >Cancel</button>
                  <button
                    onClick={handleManualAdd}
                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-[#006b5f] text-white shadow-lg shadow-[#006b5f]/20 hover:brightness-110 active:scale-[0.98] transition-all font-display"
                  >Save</button>
                </div>
              </div>
            </div>
          )}

          {selectedFollowUp && (
            <FollowUpModal
              appointment={selectedFollowUp}
              onClose={() => setSelectedFollowUp(null)}
              onSend={handleSendFollowUp}
            />
          )}

          {selectedReminder && (
            <ReminderModal
              appointment={selectedReminder}
              onClose={() => setSelectedReminder(null)}
              onSend={handleSendReminder}
            />
          )}

          {selectedNotesAppt && (
            <NotesModal
              appointment={selectedNotesAppt}
              onClose={() => setSelectedNotesAppt(null)}
              onSave={(notes) => {
                updateAppointmentNotes(selectedNotesAppt.id, notes);
                setSelectedNotesAppt(null);
              }}
            />
          )}

          {showTimePicker && (
            <TimePickerModal
              initialTime={formData.time}
              onClose={() => setShowTimePicker(false)}
              onSet={(time) => {
                handleFieldChange('time', time);
                setShowTimePicker(false);
              }}
            />
          )}

          {selectedClientHistoryContact && (
            <ClientHistoryActivity
              contact={selectedClientHistoryContact}
              appointments={history.filter(appt => appt.contact.id === selectedClientHistoryContact.id)}
              onClose={() => setSelectedClientHistoryContact(null)}
              onUpdateStatus={updateAppointmentStatus}
              onDelete={deleteAppointment}
              onFollowUp={handleFollowUp}
              onReschedule={handleRescheduleWrapped}
              onReminder={handleReminder}
              onRebook={handleRebookWrapped}
              onEditNotes={setSelectedNotesAppt}
            />
          )}
        </>
      }
    >
      {currentPage === 'schedule' ? (
        <div className="w-full space-y-4">
          {reschedulingId && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200/50 rounded-xl p-3 text-[#006b5f] text-[13px] shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#006b5f]">edit_calendar</span>
                <span className="font-semibold">
                  Rescheduling appointment
                </span>
              </div>
              <button 
                onClick={() => setReschedulingId(null)} 
                className="txt-label-caps text-teal-600 hover:text-teal-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Step Progress Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            {[
              { step: 1, label: 'Contact', icon: 'person' },
              { step: 2, label: 'Schedule', icon: 'schedule' },
              { step: 3, label: 'Preview', icon: 'chat' }
            ].map((item, index) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              return (
                <React.Fragment key={item.step}>
                  <div 
                    className="flex flex-col items-center gap-1 flex-1 relative cursor-pointer" 
                    onClick={() => {
                      if (item.step < currentStep || (item.step === 2 && formData.contact.id !== 'default') || (item.step === 3 && formData.contact.id !== 'default')) {
                        setCurrentStep(item.step);
                      }
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20 scale-110 font-bold'
                        : isCompleted
                          ? 'bg-teal-500/20 text-[#006b5f] border border-[#006b5f]/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                    }`}>
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[16px] font-bold">done</span>
                      ) : (
                        <span className="text-[12px] font-bold">{item.step}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                      isActive ? 'text-[#006b5f]' : 'text-slate-400 dark:text-slate-500'
                    }`}>{item.label}</span>
                  </div>
                  {index < 2 && (
                    <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                      <div className="h-full bg-[#006b5f] transition-all duration-500" style={{
                        width: currentStep > item.step ? '100%' : '0%'
                      }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* 3-Step Slider Container */}
          <div className="overflow-hidden w-full relative">
            <div 
              className="flex w-[300%] transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${(currentStep - 1) * 33.333}%)` }}
            >
              {/* STEP 1: CONTACT SELECTION PAGE */}
              <div className="w-1/3 flex-shrink-0 px-1 space-y-4">
                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="label-caps tracking-wider">Select Contact</h2>
                    <span onClick={handleSeeAll} className="text-[#006b5f] text-[12px] font-bold cursor-pointer hover:underline">
                      View All
                    </span>
                  </div>

                  {/* Search and Action Row */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name or phone..."
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] text-sm text-[#131b2e] dark:text-slate-100 focus:outline-none focus:border-[#006b5f]/50"
                      />
                    </div>
                    <button
                      onClick={() => setIsManualAddOpen(true)}
                      className="h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] text-[#006b5f] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Add Contact Manually"
                    >
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                    </button>
                    <button
                      onClick={handleSeeAll}
                      className="h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] text-[#006b5f] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Import Contacts"
                    >
                      <span className="material-symbols-outlined text-[20px]">import_contacts</span>
                    </button>
                  </div>

                  {/* High Density Contact List */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {(() => {
                      const filteredRecent = contacts.filter(c => 
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.phoneNumbers.some(p => p.includes(searchQuery))
                      );
                      
                      if (filteredRecent.length > 0) {
                        return filteredRecent.map((c) => {
                          const isSelected = c.id === formData.contact.id;
                          return (
                            <div
                              key={`${c.id}-${c.phoneNumbers[0] || ''}`}
                              onClick={() => {
                                handleSelectContact(c, c.phoneNumbers[0] || '');
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-teal-50/50 border-[#006b5f]/30 dark:bg-teal-950/20 dark:border-[#006b5f]/30' 
                                  : 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800/50 hover:dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={c.avatar}
                                  alt={c.name}
                                  className="w-10 h-10 rounded-full object-cover bg-slate-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`;
                                  }}
                                />
                                <div>
                                  <h4 className="font-semibold text-sm text-[#131b2e] dark:text-slate-100">{c.name}</h4>
                                  <p className="text-[11px] text-slate-500 font-medium">{c.phoneNumbers[0] || 'No number'}</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-slate-400 text-[18px]">
                                chevron_right
                              </span>
                            </div>
                          );
                        });
                      } else {
                        return (
                          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <span className="material-symbols-outlined text-slate-400 text-[32px] block mb-1">
                              search_off
                            </span>
                            <p className="text-slate-500 text-sm mb-3">No matching contacts in recents</p>
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={handleSeeAll}
                                className="px-3 py-1.5 text-xs font-bold bg-[#006b5f] text-white rounded-lg hover:bg-[#005c52] transition-colors"
                              >
                                View Device Contacts
                              </button>
                              <button
                                onClick={() => setIsManualAddOpen(true)}
                                className="px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                Add Manually
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </section>
              </div>

              {/* STEP 2: SCHEDULE CONFIGURATION PAGE */}
              <div className="w-1/3 flex-shrink-0 px-1 space-y-4">
                <div className="bg-white rounded-xl ambient-shadow p-4 space-y-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800/80">
                  
                  {/* Selected Contact Indicator */}
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <img
                      src={formData.contact.avatar}
                      alt={formData.contact.name}
                      className="w-9 h-9 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.contact.name)}&background=random`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scheduling for</p>
                      <h3 className="font-semibold text-sm text-[#131b2e] dark:text-slate-100 truncate">
                        {formData.contact.name}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-[#006b5f] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Section 2: LOCATION */}
                  <div className="space-y-1.5">
                    <label className="label-caps tracking-wider block">Location</label>
                    <InputField
                      label="Location"
                      icon="location_on"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="Appointment Address"
                      suggestions={addressHistory}
                      onSuggestionClick={(val) => handleFieldChange('address', val)}
                      showVerified={false}
                      suggestionIcon="location_on"
                    />
                  </div>

                  {/* Section 3: DATE and TIME */}
                  <div className="space-y-4">
                    {/* Date Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="label-caps tracking-wider block">Date</label>
                        <span className="text-[12px] text-slate-500 font-semibold dark:text-slate-400">
                          {formData.date ? formData.date.split('-').reverse().join('/') : 'None selected'}
                        </span>
                      </div>
                      
                      <div className="relative">
                        {/* Hidden native input for custom date selection */}
                        <input
                          type="date"
                          ref={dateInputRef}
                          value={formData.date}
                          onChange={(e) => handleFieldChange('date', e.target.value)}
                          className="sr-only"
                        />
                        
                        {/* Date Carousel Container */}
                        <div 
                          ref={dateDrag.ref}
                          {...dateDrag.bind}
                          className="flex gap-2 overflow-x-auto px-4 -mx-4 pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth"
                          style={{ scrollPaddingLeft: '16px', scrollPaddingRight: '16px' }}
                        >
                          {finalDateList.map((item) => {
                            const isSelected = formData.date === item.value;
                            return (
                              <div
                                key={item.value}
                                onClick={(e) => dateDrag.handleItemClick(e, () => handleFieldChange('date', item.value))}
                                style={{ width: `${itemWidth}px`, flexShrink: 0 }}
                                className={`snap-start rounded-2xl flex flex-col justify-center items-center py-2.5 border transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20 border-[#006b5f] scale-[1.03]'
                                    : 'bg-teal-50/30 text-teal-800 border-teal-100/50 hover:bg-teal-50/70 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/30 dark:hover:bg-teal-950/20'
                                }`}
                              >
                                <span className={`text-[9px] font-bold tracking-wider uppercase ${isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {item.dayName}
                                </span>
                                <span className="text-[16px] font-bold mt-0.5 leading-none">
                                  {item.dayNum}
                                </span>
                                <span className={`text-[9px] font-semibold uppercase mt-0.5 ${isSelected ? 'text-teal-200' : 'text-teal-600/80 dark:text-teal-400/80'}`}>
                                  {item.monthName}
                                </span>
                              </div>
                            );
                          })}
                          
                          {/* Custom Calendar Card Trigger */}
                          <div
                            onClick={triggerCustomDatePicker}
                            style={{ width: `${itemWidth}px`, flexShrink: 0 }}
                            className="snap-start rounded-2xl flex flex-col justify-center items-center py-2.5 border bg-slate-50/50 border-slate-200/60 dark:bg-slate-900/30 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            <span className="text-[9px] font-bold mt-1 tracking-wider uppercase">More</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AM / PM Toggle Bar */}
                    <div className="flex justify-center my-1">
                      <div className="bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-[12px] flex w-full max-w-[280px] border border-slate-200/50 dark:border-slate-800/40 relative">
                        {/* Active background slider indicator */}
                        <div 
                          className="absolute top-0.5 bottom-0.5 bg-white dark:bg-slate-800 rounded-[10px] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                          style={{
                            left: timePeriod === 'AM' ? '2px' : 'calc(50% + 1px)',
                            width: 'calc(50% - 3px)',
                          }}
                        />
                        
                        <button
                          type="button"
                          onClick={() => setTimePeriod('AM')}
                          className={`flex-1 py-1.5 text-center text-[12px] font-bold z-10 flex items-center justify-center gap-1.5 transition-colors duration-300 rounded-[10px] ${
                            timePeriod === 'AM'
                              ? 'text-[#006b5f] dark:text-teal-400'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <span>☀️</span>
                          <span>AM</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setTimePeriod('PM')}
                          className={`flex-1 py-1.5 text-center text-[12px] font-bold z-10 flex items-center justify-center gap-1.5 transition-colors duration-300 rounded-[10px] ${
                            timePeriod === 'PM'
                              ? 'text-[#006b5f] dark:text-teal-400'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <span>🌙</span>
                          <span>PM</span>
                        </button>
                      </div>
                    </div>

                    {/* Time Slot Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="label-caps tracking-wider block">Time</label>
                        <span className="text-[12px] text-slate-500 font-semibold dark:text-slate-400">
                          {formData.time ? (
                            (() => {
                              const [h, m] = formData.time.split(':');
                              const hr = parseInt(h);
                              const ampm = hr >= 12 ? 'PM' : 'AM';
                              return `${hr % 12 || 12}:${m} ${ampm}`;
                            })()
                          ) : 'None selected'}
                        </span>
                      </div>

                      <div 
                        key={timePeriod}
                        ref={timeDrag.ref}
                        {...timeDrag.bind}
                        className="flex gap-2 overflow-x-auto px-4 -mx-4 pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth animate-fade-in-scale"
                        style={{ scrollPaddingLeft: '16px', scrollPaddingRight: '16px' }}
                      >
                        {finalTimeList.map((item) => {
                          const isSelected = formData.time === item.value;
                          return (
                            <div
                              key={item.value}
                              onClick={(e) => timeDrag.handleItemClick(e, () => handleFieldChange('time', item.value))}
                              onMouseDown={(e) => startLongPress(item, e)}
                              onMouseUp={cancelLongPress}
                              onMouseLeave={cancelLongPress}
                              onTouchStart={(e) => startLongPress(item, e)}
                              onTouchEnd={cancelLongPress}
                              onTouchMove={handleTouchMove}
                              style={{ width: `${itemWidth}px`, flexShrink: 0 }}
                              className={`snap-start h-10 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-[#006b5f] text-white shadow-md shadow-[#006b5f]/20 border-[#006b5f] scale-[1.03]'
                                  : 'bg-teal-50/30 text-teal-800 border-teal-100/50 hover:bg-teal-50/70 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/30 dark:hover:bg-teal-950/20'
                              }`}
                            >
                              <span className="text-[11px] font-bold tracking-tight">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                        
                        {/* Custom Time Card Trigger */}
                        <div
                          onClick={() => setShowTimePicker(true)}
                          style={{ width: `${itemWidth}px`, flexShrink: 0 }}
                          className="snap-start h-10 rounded-xl flex items-center justify-center border bg-slate-50/50 border-slate-200/60 dark:bg-slate-900/30 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_time</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: AUTOMATIC REMINDERS */}
                  <div className="pt-1">
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/40 dark:border-slate-800/50 rounded-xl p-[12px] space-y-3 relative transition-all duration-300">
                      {/* TabLayout */}
                      <div className="bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('followUp')}
                          className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === 'followUp'
                              ? 'bg-white dark:bg-slate-800 text-[#006b5f] shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">update</span>
                          <span>Follow-Up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('preMeeting')}
                          className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === 'preMeeting'
                              ? 'bg-white dark:bg-slate-800 text-[#006b5f] shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">event_available</span>
                          <span>Pre-Meeting</span>
                        </button>
                      </div>

                      {/* ViewPager2 container */}
                      <div className="overflow-hidden w-full relative">
                        <div
                          className="flex transition-transform duration-300 ease-out"
                          style={{ transform: `translateX(-${activeTab === 'followUp' ? '0' : '100'}%)` }}
                        >
                          {/* Page 1: Follow-Up */}
                          <div className="w-full flex-shrink-0">
                            <div className="flex items-center justify-between min-h-[40px]">
                              <div className={`flex items-center gap-2 text-[13px] transition-opacity duration-200 ${formData.followUpEnabled ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-600'}`}>
                                <span>Nudge if no reply within:</span>
                                <div className="relative inline-block">
                                  <select
                                    value={formData.followUpTimer}
                                    onChange={(e) => handleFieldChange('followUpTimer', e.target.value)}
                                    disabled={!formData.followUpEnabled}
                                    className={`appearance-none bg-transparent border-b ${formData.followUpEnabled ? 'border-[#006b5f] text-[#006b5f]' : 'border-slate-300 text-slate-400'} font-bold px-1 py-0.5 outline-none cursor-pointer pr-5 disabled:cursor-not-allowed`}
                                  >
                                    <option value="20s">20s (Test)</option>
                                    <option value="15 mins">15 Mins</option>
                                    <option value="30 mins">30 Mins</option>
                                    <option value="1 hour">1 Hour</option>
                                    <option value="2 hours">2 Hours</option>
                                  </select>
                                  <span className={`material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${formData.followUpEnabled ? 'text-[#006b5f]' : 'text-slate-400'}`}>arrow_drop_down</span>
                                </div>
                              </div>
                              <ToggleSwitch
                                enabled={formData.followUpEnabled}
                                onChange={() => handleFieldChange('followUpEnabled', !formData.followUpEnabled)}
                              />
                            </div>
                          </div>

                          {/* Page 2: Pre-Meeting */}
                          <div className="w-full flex-shrink-0">
                            <div className="flex items-center justify-between min-h-[40px]">
                              <div className={`flex items-center gap-2 text-[13px] transition-opacity duration-200 ${formData.preMeetingEnabled ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-600'}`}>
                                <span>Send reminder before:</span>
                                <div className="relative inline-block">
                                  <select
                                    value={formData.preMeetingTimer}
                                    onChange={(e) => handleFieldChange('preMeetingTimer', e.target.value)}
                                    disabled={!formData.preMeetingEnabled}
                                    className={`appearance-none bg-transparent border-b ${formData.preMeetingEnabled ? 'border-[#006b5f] text-[#006b5f]' : 'border-slate-300 text-slate-400'} font-bold px-1 py-0.5 outline-none cursor-pointer pr-5 disabled:cursor-not-allowed`}
                                  >
                                    {(() => {
                                      const allOptions = [
                                        { label: '20s (Test)', value: '20s', ms: 20 * 1000 },
                                        { label: '15 Mins', value: '15 mins', ms: 15 * 60 * 1000 },
                                        { label: '30 Mins', value: '30 mins', ms: 30 * 60 * 1000 },
                                        { label: '1 Hour', value: '1 hour', ms: 60 * 60 * 1000 },
                                        { label: '1 Day', value: '1 day', ms: 24 * 60 * 60 * 1000 }
                                      ];
                                      let diff = Infinity;
                                      if (formData.date && formData.time) {
                                        const [year, month, day] = formData.date.split('-').map(Number);
                                        const [hours, minutes] = formData.time.split(':').map(Number);
                                        diff = new Date(year, month - 1, day, hours, minutes).getTime() - Date.now();
                                      }
                                      return allOptions.map(opt => {
                                        const isDisabled = diff > 0 && diff <= opt.ms;
                                        return (
                                          <option key={opt.value} value={opt.value} disabled={isDisabled}>
                                            {opt.label}
                                          </option>
                                        );
                                      });
                                    })()}
                                  </select>
                                  <span className={`material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${formData.preMeetingEnabled ? 'text-[#006b5f]' : 'text-slate-400'}`}>arrow_drop_down</span>
                                </div>
                              </div>
                              <ToggleSwitch
                                enabled={formData.preMeetingEnabled}
                                onChange={() => handleFieldChange('preMeetingEnabled', !formData.preMeetingEnabled)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Persistent Navigation Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-11 border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300 rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-display hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 h-11 bg-[#006b5f] text-white rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-display shadow-lg shadow-[#006b5f]/10 hover:bg-[#005c52]"
                  >
                    Continue
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* STEP 3: MESSAGE PREVIEW & SEND PAGE */}
              <div className="w-1/3 flex-shrink-0 px-1 space-y-4">
                <section className="space-y-3 bg-white rounded-xl ambient-shadow p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800/80">
                  <label className={`label-caps tracking-wider block ${reschedulingId ? 'text-amber-600 dark:text-amber-500 font-bold' : ''}`}>
                    {reschedulingId ? 'Reschedule Message Preview' : 'Message Preview'}
                  </label>
                  
                  {/* Expanded & Padded Preview Card */}
                  <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-5 min-h-[180px] relative overflow-hidden flex flex-col justify-between">
                    {isEditingTemplate ? (
                      <div className="space-y-3 relative z-10 w-full">
                        <textarea
                          value={tempTemplate}
                          onChange={(e) => setTempTemplate(e.target.value)}
                          className="w-full h-32 p-3 text-[13px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#006b5f] font-sans"
                          placeholder="Write your message template..."
                        />
                        
                        {/* Helper Pills */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1">Insert:</span>
                          {[
                            { label: 'Name', placeholder: '{name}' },
                            { label: 'Location', placeholder: '{location}' },
                            { label: 'Date', placeholder: '{date}' },
                            { label: 'Time', placeholder: '{time}' }
                          ].map((pill) => (
                            <button
                              key={pill.placeholder}
                              type="button"
                              onClick={() => {
                                setTempTemplate(prev => prev + pill.placeholder);
                              }}
                              className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/50 dark:border-slate-700 transition-colors font-mono"
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTemplate(false);
                            }}
                            className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (reschedulingId) {
                                setRescheduleTemplate(tempTemplate);
                              } else {
                                setMessageTemplate(tempTemplate);
                              }
                              setIsEditingTemplate(false);
                            }}
                            className="px-3 py-1 text-[11px] font-bold bg-[#006b5f] hover:bg-[#005247] text-white rounded-md transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5 relative z-10">
                          <p className="txt-secondary text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                            {renderFormattedMessage(getParsedMessage())}
                          </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setTempTemplate(reschedulingId ? rescheduleTemplate : messageTemplate);
                              setIsEditingTemplate(true);
                            }}
                            className="flex items-center gap-1 text-[#006b5f] text-xs font-bold font-display hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span> Edit Text
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Final Primary Sending CTA and Back Button */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleSend}
                    className="w-full h-12 bg-[#006b5f] hover:bg-[#005c52] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-display shadow-lg shadow-[#006b5f]/20"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      rocket_launch
                    </span>
                    <span>{reschedulingId ? '🚀 UPDATE & SEND VIA WHATSAPP' : '🚀 SEND VIA WHATSAPP'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full h-10 border border-slate-200 text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-[10px] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all font-display"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    Back to Schedule Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentPage === 'history' ? (
        <History 
          history={history} 
          onUpdateStatus={updateAppointmentStatus} 
          onDelete={deleteAppointment} 
          onFollowUp={handleFollowUp}
          onReschedule={handleRescheduleWrapped}
          onReminder={handleReminder}
          onRebook={handleRebookWrapped}
          onEditNotes={setSelectedNotesAppt}
          onOpenClientHistory={(contact) => setSelectedClientHistoryContact(contact)}
        />

      ) : (

          <div className="w-full space-y-6 pt-4">
            <div className="px-1">
              <h2 className="label-caps tracking-wider text-[#6b7a76]">Settings</h2>
            </div>
            
            <div className="bg-white rounded-2xl p-5 ambient-shadow border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 pr-4">
                  <h3 className="txt-title font-bold text-[#131b2e]">Auto-Confirm Appointments</h3>
                  <p className="text-[12px] text-[#6b7a76]">Automatically mark as confirmed when a recipient replies with "Yes" or "Confirm" via WhatsApp.</p>
                </div>
                <ToggleSwitch
                  enabled={autoConfirmEnabled}
                  onChange={() => setAutoConfirmEnabled(!autoConfirmEnabled)}
                />
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="txt-secondary font-semibold text-[#131b2e]">Notification Access (System Listener)</span>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                      hasPermission 
                        ? 'bg-[#006b5f]/10 text-[#006b5f] border border-[#006b5f]/20' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasPermission ? 'bg-[#006b5f]' : 'bg-amber-500'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${hasPermission ? 'bg-[#006b5f]' : 'bg-amber-500'}`}></span>
                      </span>
                      {hasPermission ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>

                  <button 
                    onClick={requestPermission}
                    className="w-full py-2.5 bg-[#f2f3ff] text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] font-display"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
                    {hasPermission ? 'Manage Notification Access' : 'Enable Notification Access'}
                  </button>
                </div>

                {/* Battery Optimization / Honor Background Settings */}
                <div className="pt-3 border-t border-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="txt-secondary font-semibold text-[#131b2e]">Device Background Running</span>
                      <p className="text-[11px] text-[#6b7a76]">Allow the service to stay active in the background for real-time capture.</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                      batteryOptimizationIgnored 
                        ? 'bg-[#006b5f]/10 text-[#006b5f] border border-[#006b5f]/20' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {batteryOptimizationIgnored ? 'OPTIMIZATION EXCLUDED' : 'RESTRICTED'}
                    </div>
                  </div>

                  {!batteryOptimizationIgnored && (
                    <button 
                      onClick={requestIgnoreBatteryOptimization}
                      className="w-full py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] font-display"
                    >
                      <span className="material-symbols-outlined text-[18px]">battery_charging_full</span>
                      Disable Battery Optimization
                    </button>
                  )}

                  <button 
                    onClick={openStartupManager}
                    className="w-full py-2.5 bg-[#f2f3ff] text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] font-display"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Configure App Launch (Honor Settings)
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1 flex-1 pr-4">
                      <span className="txt-secondary font-semibold text-[#131b2e]">Heads-Up Alerts (Banner Alerts)</span>
                      <p className="text-[11px] text-[#6b7a76]">Show high-priority notification banners when appointment statuses update.</p>
                    </div>
                    {hasNotificationPermission ? (
                      <ToggleSwitch
                        enabled={alertsEnabled}
                        onChange={() => setAlertsEnabled(!alertsEnabled)}
                      />
                    ) : (
                      <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                        Blocked
                      </div>
                    )}
                  </div>

                  {!hasNotificationPermission ? (
                    <button 
                      onClick={requestNotificationPerm}
                      className="w-full py-2.5 bg-[#006b5f]/10 text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] font-display"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                      Enable Heads-Up Alerts
                    </button>
                  ) : (
                    <button 
                      onClick={openAppNotificationSettings}
                      className="w-full py-2.5 bg-[#f2f3ff] text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] font-display"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      Manage OS Notifications
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#006b5f]/5 rounded-2xl p-4 border border-[#006b5f]/20">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[#006b5f]">info</span>
                <p className="text-[12px] text-[#006b5f] leading-relaxed">
                  This feature requires <strong>Notification Access</strong> permission on your Android device to "read" incoming WhatsApp messages locally. No data is sent to external servers.
                </p>
              </div>
            </div>

            {/* --- Reminder Strategy Dedicated Configuration Hub --- */}
            <div className="px-1 mt-6">
              <h2 className="label-caps tracking-wider text-[#6b7a76]">Reminder Strategy</h2>
            </div>

            {/* Pillar 1: Global Defaults */}
            <div className="bg-white rounded-2xl p-5 ambient-shadow border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 pr-4">
                  <h3 className="txt-title font-bold text-[#131b2e]">Automatic Reminders Default</h3>
                  <p className="text-[12px] text-[#6b7a76]">Enable Follow-Up Nudges and Pre-Meeting Reminders automatically for all new meetings.</p>
                </div>
                <ToggleSwitch
                  enabled={defaultAutomaticActivation}
                  onChange={() => setDefaultAutomaticActivation(!defaultAutomaticActivation)}
                />
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                {/* Default Follow-Up Timer */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="txt-secondary font-semibold text-[#131b2e]">Default Follow-Up Timer</span>
                    <p className="text-[11px] text-[#6b7a76]">Select standard time window to wait for follow‑up nudges.</p>
                  </div>
                  <div className="relative">
                    <select
                      value={defaultFollowUpTimer}
                      onChange={(e) => setDefaultFollowUpTimer(e.target.value)}
                      className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[13px] font-bold text-[#006b5f] pr-8 focus:outline-none focus:border-[#006b5f]/50 cursor-pointer"
                    >
                      <option value="20s">20s (Test)</option>
                      <option value="15 mins">15 Mins</option>
                      <option value="30 mins">30 Mins</option>
                      <option value="1 hour">1 Hour</option>
                      <option value="2 hours">2 Hours</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-slate-400">arrow_drop_down</span>
                  </div>
                </div>

                {/* Default Pre-Meeting Timer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50/50">
                  <div className="space-y-0.5">
                    <span className="txt-secondary font-semibold text-[#131b2e]">Default Pre-Meeting Timer</span>
                    <p className="text-[11px] text-[#6b7a76]">Standard lead time to notify for scheduled appointments.</p>
                  </div>
                  <div className="relative">
                    <select
                      value={defaultPreMeetingTimer}
                      onChange={(e) => setDefaultPreMeetingTimer(e.target.value)}
                      className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[13px] font-bold text-[#006b5f] pr-8 focus:outline-none focus:border-[#006b5f]/50 cursor-pointer"
                    >
                      <option value="20s">20s (Test)</option>
                      <option value="15 mins">15 Mins</option>
                      <option value="30 mins">30 Mins</option>
                      <option value="1 hour">1 Hour</option>
                      <option value="1 day">1 Day</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-slate-400">arrow_drop_down</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Recovery Protocol */}
            <div className="px-1 mt-6">
              <h2 className="label-caps tracking-wider text-[#6b7a76]">Recovery Protocol</h2>
            </div>
            <div className="bg-white rounded-2xl p-5 ambient-shadow border border-slate-100 space-y-6">
              {/* Sound Option */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="txt-secondary font-semibold text-[#131b2e]">Alert Sound</span>
                  <p className="text-[11px] text-[#6b7a76]">Play brief ringtone alerts when notification banners display.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={playAlertSound}
                    className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#006b5f] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                  <ToggleSwitch
                    enabled={soundEnabled}
                    onChange={() => setSoundEnabled(!soundEnabled)}
                  />
                </div>
              </div>

              {/* Vibration Option */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="space-y-0.5">
                  <span className="txt-secondary font-semibold text-[#131b2e]">Alert Vibration</span>
                  <p className="text-[11px] text-[#6b7a76]">Vibrate physical handset device during new status alerts.</p>
                </div>
                <ToggleSwitch
                  enabled={vibrateEnabled}
                  onChange={() => setVibrateEnabled(!vibrateEnabled)}
                />
              </div>

              {/* Persistent Alert Option */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="space-y-0.5 pr-4 flex-1">
                  <span className="txt-secondary font-semibold text-[#131b2e]">Persistent Alerts</span>
                  <p className="text-[11px] text-[#6b7a76]">Re-alert status changes until dismissed manually inside app.</p>
                </div>
                <ToggleSwitch
                  enabled={persistentEnabled}
                  onChange={() => setPersistentEnabled(!persistentEnabled)}
                />
              </div>
            </div>

            {/* Pillar 3: Keyword Library */}
            <div className="px-1 mt-6">
              <h2 className="label-caps tracking-wider text-[#6b7a76]">Keyword Library</h2>
            </div>
            <div className="bg-white rounded-2xl p-5 ambient-shadow border border-slate-100 space-y-4">
              <div className="space-y-1">
                <h3 className="txt-secondary font-bold text-[#131b2e]">Confirmation Keywords</h3>
                <p className="text-[11px] text-[#6b7a76]">Replies matching these terms transition appointments from PENDING to CONFIRMED.</p>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2 py-2">
                {confirmKeywords.map(keyword => (
                  <div 
                    key={keyword}
                    className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-[#006b5f]/5 border border-[#006b5f]/15 rounded-lg text-[12px] font-semibold text-[#006b5f]"
                  >
                    <span>{keyword}</span>
                    <button 
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#006b5f]/10 text-slate-400 hover:text-[#f43f5e] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Input */}
              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Add custom confirmation term..."
                  className="flex-1 h-9 px-3 bg-slate-50 border border-slate-100 rounded-xl text-[12px] text-[#131b2e] focus:outline-none focus:border-[#006b5f]/40"
                />
                <button
                  onClick={handleAddKeyword}
                  className="h-9 px-4 bg-[#006b5f] text-white rounded-xl text-[12px] font-bold active:scale-[0.98] transition-transform"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
      )}



      {/* Micro Bottom Sheet for Time Customization */}
      {longPressedSlot && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fade-in"
            onClick={() => setLongPressedSlot(null)}
          />
          {/* Bottom Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 border-t border-slate-100 dark:border-slate-800 pb-8 px-5 pt-3 animate-slide-up flex flex-col font-sans">
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-2" />
            
            <div className="text-center mt-2 mb-4">
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-100 font-display">
                Customize Time Slot
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Choose dynamic offset options for {longPressedSlot.label}
              </p>
            </div>

            <div className="space-y-2">
              {/* Option 1: On the hour */}
              <button
                type="button"
                onClick={() => {
                  const baseH = longPressedSlot.baseSlot.split(':')[0];
                  const targetTime = `${baseH}:00`;
                  setSlotOverrides(prev => ({
                    ...prev,
                    [longPressedSlot.baseSlot]: targetTime
                  }));
                  handleFieldChange('time', targetTime);
                  setLongPressedSlot(null);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 dark:border-slate-800 dark:hover:border-teal-900/50 dark:hover:bg-teal-950/10 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                    {(() => {
                      const hr = parseInt(longPressedSlot.baseSlot.split(':')[0]);
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      return `${hr % 12 || 12}:00 ${ampm}`;
                    })()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                    On the Hour
                  </span>
                </div>
                {longPressedSlot.value === `${longPressedSlot.baseSlot.split(':')[0]}:00` && (
                  <span className="material-symbols-outlined text-[#006b5f] text-[18px]">check_circle</span>
                )}
              </button>

              {/* Option 2: Half past */}
              <button
                type="button"
                onClick={() => {
                  const baseH = longPressedSlot.baseSlot.split(':')[0];
                  const targetTime = `${baseH}:30`;
                  setSlotOverrides(prev => ({
                    ...prev,
                    [longPressedSlot.baseSlot]: targetTime
                  }));
                  handleFieldChange('time', targetTime);
                  setLongPressedSlot(null);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 dark:border-slate-800 dark:hover:border-teal-900/50 dark:hover:bg-teal-950/10 transition-all text-left"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                    {(() => {
                      const hr = parseInt(longPressedSlot.baseSlot.split(':')[0]);
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      return `${hr % 12 || 12}:30 ${ampm}`;
                    })()}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Half Past
                  </span>
                </div>
                {longPressedSlot.value === `${longPressedSlot.baseSlot.split(':')[0]}:30` && (
                  <span className="material-symbols-outlined text-[#006b5f] text-[18px]">check_circle</span>
                )}
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setLongPressedSlot(null)}
              className="mt-4 w-full h-11 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center active:scale-[0.98] transition-all font-display"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 opacity-50"></div>

    </Layout>
  );
};

export default App;
