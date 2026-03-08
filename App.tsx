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

const App: React.FC = () => {
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
    handleSend
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
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(nc.name?.display || 'U')}&background=random`,
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

  return (
    <Layout>
      <div className="w-full flex items-center justify-center mb-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center">WhatsAppointment</h1>
      </div>

      <ContactSelector
        contacts={contacts}
        selectedContactId={formData.contact.id}
        selectedPhoneNumber={formData.selectedPhoneNumber}
        onSelect={handleSelectContact}
        onSeeAll={handleSeeAll}
      />

      <div className="space-y-4 mb-6">
        <InputField
          label="Appointment Address"
          icon="location_on"
          value={formData.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          suggestions={addressHistory}
          onSuggestionClick={(val) => handleFieldChange('address', val)}
        />
        <div className="grid grid-cols-2 gap-1">
          <InputField
            label="Date"
            icon="event"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            type="date"
          />
          <InputField
            label="Time"
            icon="schedule"
            value={formData.time}
            onChange={(e) => handleFieldChange('time', e.target.value)}
            type="time"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="glass-light dark:glass rounded-3xl p-5 border border-white/10 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">notifications_active</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Automatic Reminder</span>
            </div>
            <ToggleSwitch 
              enabled={formData.reminderEnabled} 
              onChange={() => handleFieldChange('reminderEnabled', !formData.reminderEnabled)} 
            />
          </div>
          <div className={`transition-all duration-300 overflow-hidden ${formData.reminderEnabled ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Lead Time</label>
            <div className="flex flex-wrap gap-2 mb-4 px-1 py-1">
              {leadTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => handleFieldChange('leadTime', time)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl border transition-all ${formData.leadTime === time
                    ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/5'
                    : 'border-white/10 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400/80">
              A follow-up WhatsApp message will be automatically triggered to remind {formData.contact.name.split(' ')[0]} of the upcoming appointment.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-grow mb-8">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest ml-1">WhatsApp Preview</label>
        <div className="relative glass-light dark:glass rounded-3xl p-5 border border-white/20 hover:border-primary/30 transition-colors cursor-default group">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-icons-round text-primary text-sm">chat_bubble</span>
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 italic">
                "Hello <span className="text-primary font-semibold">{formData.contact.name}</span>, looking forward to our meeting at <span className="text-primary font-semibold">{formData.address}</span> on <span className="text-primary font-semibold">{formData.date}</span> at <span className="text-primary font-semibold">{formData.time}</span>."
              </p>
              <div className="mt-4 flex items-center text-[10px] text-slate-400 uppercase tracking-widest">
                <span className="material-icons-round text-xs mr-1 animate-pulse">auto_awesome</span>
                Auto-generated based on inputs
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"></div>
        </div>
      </div>

      <button
        onClick={handleSend}
        className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg neon-glow active:scale-[0.98] hover:brightness-110 transition-all mb-4"
      >
        <span className="material-icons-round">send</span>
        <span>Send via WhatsApp</span>
      </button>

      <ContactPickerModal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        contacts={externalContacts}
        isLoading={isFetchingContacts}
        onSelect={handleSelectContact}
      />

      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm p-6 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Contact</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Add a person specifically for WhatsApp.</p>
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
                icon="phone"
                value={manualContact.phone}
                onChange={(e) => setManualContact(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 60123456789"
                type="tel"
              />
            </div>
            <div className="mt-8 flex space-x-3">
              <button
                onClick={() => setIsManualAddOpen(false)}
                className="flex-1 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >Cancel</button>
              <button
                onClick={handleManualAdd}
                className="flex-1 px-4 py-3 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >Save</button>
            </div>
          </div>
        </div>
      )}
      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 opacity-50"></div>
    </Layout>
  );
};

export default App;
