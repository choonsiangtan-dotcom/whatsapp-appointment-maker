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
    setRescheduleTemplate
  } = useAppLogic();

  const [isEditingTemplate, setIsEditingTemplate] = React.useState(false);
  const [tempTemplate, setTempTemplate] = React.useState('');

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
  const [showTimePicker, setShowTimePicker] = React.useState(false);

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

          {/* Section 1: SELECT CONTACT */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="label-caps tracking-wider">Select Contact</h2>
              <span onClick={handleSeeAll} className="text-[#006b5f] text-[12px] font-bold cursor-pointer">View All</span>
            </div>
            <ContactSelector
              contacts={contacts}
              selectedContact={formData.contact}
              selectedPhoneNumber={formData.selectedPhoneNumber}
              onSelect={handleSelectContact}
              onSeeAll={handleSeeAll}
              onCycleNext={handleCycleNext}
            />
          </section>

          {/* Main Form Card */}
          <div className="bg-white rounded-xl ambient-shadow p-4 space-y-4 border border-slate-100">
            
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="label-caps tracking-wider block">Date</label>
                <div className="relative group transition-all duration-300">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#006b5f] text-[18px]">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                  />
                  <div className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] flex items-center txt-secondary text-[#131b2e] dark:text-slate-100">
                    {formData.date ? formData.date.split('-').reverse().join('/') : 'Select Date'}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label-caps tracking-wider block">Time</label>
                <button 
                  type="button"
                  onClick={() => {
                    console.log("Time picker clicked!");
                    setShowTimePicker(true);
                  }}
                  className="w-full h-10 pl-10 pr-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-[10px] flex items-center txt-secondary text-[#131b2e] dark:text-slate-100 uppercase relative group transition-all duration-300 cursor-pointer"
                >
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#006b5f] text-[18px]">
                    schedule
                  </span>
                  <span>
                    {formData.time ? (
                      (() => {
                        const [h, m] = formData.time.split(':');
                        const hr = parseInt(h);
                        const ampm = hr >= 12 ? 'PM' : 'AM';
                        return `${hr % 12 || 12}:${m} ${ampm}`;
                      })()
                    ) : 'Select Time'}
                  </span>
                </button>
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

          {/* Section 5: MESSAGE PREVIEW */}
          <section className="space-y-2">
            <label className={`label-caps tracking-wider block px-1 ${reschedulingId ? 'text-amber-600 dark:text-amber-500 font-bold' : ''}`}>
              {reschedulingId ? 'Reschedule Message Preview' : 'Message Preview'}
            </label>
            <div className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
              {isEditingTemplate ? (
                <div className="space-y-3 relative z-10">
                  <textarea
                    value={tempTemplate}
                    onChange={(e) => setTempTemplate(e.target.value)}
                    className="w-full h-24 p-2.5 text-[13px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#006b5f] font-sans"
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
                    <p className="txt-secondary text-slate-700 dark:text-slate-300 leading-snug">
                      {renderFormattedMessage(getParsedMessage())}
                    </p>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTempTemplate(reschedulingId ? rescheduleTemplate : messageTemplate);
                        setIsEditingTemplate(true);
                      }}
                      className="flex items-center gap-1 text-[#006b5f] text-[11px] font-bold font-display"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit Text
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Footer Button */}
          <footer className="pt-0.5">
            <button
              onClick={handleSend}
              className="w-full h-12 bg-[#006b5f] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-display"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {reschedulingId ? 'sync_saved_locally' : 'send'}
              </span>
              <span>{reschedulingId ? 'Update & Send via WhatsApp' : 'Send via WhatsApp'}</span>
            </button>
          </footer>
        </div>
      ) : currentPage === 'history' ? (
        <History 
          history={history} 
          onUpdateStatus={updateAppointmentStatus} 
          onDelete={deleteAppointment} 
          onFollowUp={handleFollowUp}
          onReschedule={handleReschedule}
          onReminder={handleReminder}
          onRebook={handleRebook}
          onEditNotes={setSelectedNotesAppt}
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



      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 opacity-50"></div>

    </Layout>
  );
};

export default App;
