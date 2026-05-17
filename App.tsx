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
import { useNotificationPermission } from './hooks/useNotificationPermission';

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
    openAppNotificationSettings
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
    handleReschedule,
    reschedulingId,
    setReschedulingId
  } = useAppLogic();





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
            .map(nc => ({
              id: nc.contactId || crypto.randomUUID(),
              name: nc.name?.display || 'Unknown',
              avatar: nc.image?.base64String
                ? `data:image/jpeg;base64,${nc.image.base64String}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(nc.name?.display || 'U')}&background=F1F5F9&color=64748B&bold=true`,
              status: nc.organization?.company || 'Hey there! I am using WhatsApp.',
              phoneNumbers: Array.from(new Set(nc.phones!.map(p => p.number.replace(/\D/g, '')))).sort(),
              lastUsed: Date.now()
            }));
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
            let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name?.[0] || 'U')}&background=random`;
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
      } catch (ex) {
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
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {currentPage === 'schedule' ? (
        <div className="w-full space-y-4">
          {reschedulingId && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200/50 rounded-xl p-3 text-[#006b5f] text-[13px] shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#006b5f]">edit_calendar</span>
                <span className="font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Rescheduling appointment
                </span>
              </div>
              <button 
                onClick={() => setReschedulingId(null)} 
                className="text-[11px] font-bold text-teal-600 hover:text-teal-800 transition-colors uppercase tracking-wider"
                style={{ fontFamily: 'Manrope, sans-serif' }}
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
                  <div className="w-full h-10 pl-10 pr-3 bg-[#f2f3ff] border border-[#bacac5]/30 rounded-[10px] flex items-center text-[14px] text-[#131b2e]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.date ? formData.date.split('-').reverse().join('/') : 'Select Date'}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label-caps tracking-wider block">Time</label>
                <div className="relative group transition-all duration-300">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#006b5f] text-[18px]">
                    schedule
                  </span>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleFieldChange('time', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                  />
                  <div className="w-full h-10 pl-10 pr-3 bg-[#f2f3ff] border border-[#bacac5]/30 rounded-[10px] flex items-center text-[14px] text-[#131b2e] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.time ? (
                      (() => {
                        const [h, m] = formData.time.split(':');
                        const hr = parseInt(h);
                        const ampm = hr >= 12 ? 'PM' : 'AM';
                        return `${hr % 12 || 12}:${m} ${ampm}`;
                      })()
                    ) : 'Select Time'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: AUTOMATIC REMINDER */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-[#131b2e]">
                  <span className="material-symbols-outlined text-[#006b5f] text-[18px]">notifications_active</span>
                  <span className="text-[14px] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Automatic Reminder</span>
                </div>
                <ToggleSwitch
                  enabled={formData.reminderEnabled}
                  onChange={() => handleFieldChange('reminderEnabled', !formData.reminderEnabled)}
                />
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 px-1 rounded-lg bg-[#fe7488] text-[#730425] text-[11px] font-bold tracking-widest border border-[#a93349]/20" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  30 MINS
                </button>
                <button className="flex-1 py-1.5 px-1 rounded-lg bg-[#e2e7ff] text-[#3c4a46] text-[11px] font-medium tracking-widest border border-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  1 HOUR
                </button>
                <button className="flex-1 py-1.5 px-1 rounded-lg bg-[#e2e7ff] text-[#3c4a46] text-[11px] font-medium tracking-widest border border-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  2 HOURS
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: MESSAGE PREVIEW */}
          <section className="space-y-2">
            <label className="label-caps tracking-wider block px-1">Message Preview</label>
            <div className="bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5">
                <span className="material-symbols-outlined text-[#006b5f]/20 text-[28px]">format_quote</span>
              </div>
              <div className="space-y-1.5 relative z-10">
                <p className="text-[14px] text-[#730425] leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Hello <span className="font-bold text-[#006b5f]">{formData.contact.name || 'there'}</span>, this is a reminder for our appointment on <span className="font-bold text-[#006b5f]">
                    {formData.date ? formData.date.split('-').reverse().join('/') : 'date'} at {formData.time ? (
                      (() => {
                        const [h, m] = formData.time.split(':');
                        const hr = parseInt(h);
                        const ampm = hr >= 12 ? 'PM' : 'AM';
                        return `${hr % 12 || 12}:${m} ${ampm}`;
                      })()
                    ) : 'time'}
                  </span> at <span className="font-bold text-[#006b5f]">{formData.address || 'the location'}</span>. See you then!
                </p>
              </div>
              <div className="mt-2.5 flex justify-end">
                <button className="flex items-center gap-1 text-[#006b5f] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">edit</span> Edit Text
                </button>
              </div>
            </div>
          </section>

          {/* Footer Button */}
          <footer className="pt-0.5">
            <button
              onClick={handleSend}
              className="w-full h-12 bg-[#006b5f] text-white rounded-[12px] font-bold text-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#006b5f]/20 active:scale-[0.98] transition-all"
              style={{ fontFamily: 'Manrope, sans-serif' }}
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
        />

      ) : (

          <div className="w-full space-y-6 pt-4">
            <div className="px-1">
              <h2 className="label-caps tracking-wider text-[#6b7a76]">Settings</h2>
            </div>
            
            <div className="bg-white rounded-2xl p-5 ambient-shadow border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 pr-4">
                  <h3 className="text-[16px] font-bold text-[#131b2e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Auto-Confirm Appointments</h3>
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
                    <span className="text-[14px] font-semibold text-[#131b2e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Notification Access (System Listener)</span>
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
                    className="w-full py-2.5 bg-[#f2f3ff] text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
                    {hasPermission ? 'Manage Notification Access' : 'Enable Notification Access'}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1 flex-1 pr-4">
                      <span className="text-[14px] font-semibold text-[#131b2e]" style={{ fontFamily: 'Manrope, sans-serif' }}>Heads-Up Alerts (Banner Alerts)</span>
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
                      className="w-full py-2.5 bg-[#006b5f]/10 text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                      Enable Heads-Up Alerts
                    </button>
                  ) : (
                    <button 
                      onClick={openAppNotificationSettings}
                      className="w-full py-2.5 bg-[#f2f3ff] text-[#006b5f] rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
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
          </div>
      )}



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
            <h3 className="text-[20px] font-bold text-[#131b2e] mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>Add Contact</h3>
            <p className="text-[14px] text-[#6b7a76] mb-6 font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>Add a person specifically for WhatsApp.</p>
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
                className="flex-1 px-4 py-3 rounded-xl font-bold text-[#6b7a76] hover:bg-[#f2f3ff] transition-colors"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >Cancel</button>
              <button
                onClick={handleManualAdd}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-[#006b5f] text-white shadow-lg shadow-[#006b5f]/20 hover:brightness-110 active:scale-[0.98] transition-all"
                style={{ fontFamily: 'Manrope, sans-serif' }}
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
      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 opacity-50"></div>

    </Layout>
  );
};

export default App;
