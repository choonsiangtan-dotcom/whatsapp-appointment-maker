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
    handleCycleNext,
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
    <Layout>
      <div className="w-full flex flex-col items-center justify-center mb-4 mt-1">
        <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-widest text-[14px] opacity-60">WhatsAppointment</h1>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Contact</label>
          <button onClick={handleSeeAll} className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">See All</button>
        </div>
        <ContactSelector
          contacts={contacts}
          selectedContact={formData.contact}
          selectedPhoneNumber={formData.selectedPhoneNumber}
          onSelect={handleSelectContact}
          onSeeAll={handleSeeAll}
          onCycleNext={handleCycleNext}
        />
      </div>

      <div className="mb-4">
        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Location</label>
        <InputField
          label="Location"
          icon="location_on"
          value={formData.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          placeholder="Where are you meeting?"
          suggestions={addressHistory}
          onSuggestionClick={(val) => handleFieldChange('address', val)}
          showVerified={false}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Date</label>
          <div className="relative bg-white border border-slate-50 rounded-2xl p-3 shadow-sm flex items-center group cursor-pointer active:scale-95 transition-all">
            <span className="material-icons-round text-emerald-500 text-base mr-2 flex-shrink-0">calendar_today</span>
            <div className="flex-1 overflow-hidden">
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
              />
              <div className="text-[13px] font-bold text-slate-900 truncate">
                {formData.date ? formData.date.split('-').reverse().join('/') : 'Select Date'}
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Time</label>
          <div className="relative bg-white border border-slate-50 rounded-2xl p-3 shadow-sm flex items-center group cursor-pointer active:scale-95 transition-all">
            <span className="material-icons-round text-emerald-500 text-base mr-2 flex-shrink-0">schedule</span>
            <div className="flex-1 overflow-hidden">
              <input 
                type="time" 
                value={formData.time}
                onChange={(e) => handleFieldChange('time', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
              />
              <div className="text-[13px] font-bold text-slate-900 truncate uppercase">
                {formData.time ? (
                  (() => {
                    const [h, m] = formData.time.split(':');
                    const hr = parseInt(h);
                    const ampm = hr >= 12 ? 'pm' : 'am';
                    return `${hr % 12 || 12}:${m}${ampm}`;
                  })()
                ) : 'Select Time'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Automatic Reminder</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 italic">Send 1 hour before</p>
          </div>
          <ToggleSwitch
            enabled={formData.reminderEnabled}
            onChange={() => handleFieldChange('reminderEnabled', !formData.reminderEnabled)}
          />
        </div>
      </div>

      <div className="mt-4 px-1">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-6">Message Preview</label>
        <div className="relative bg-slate-100/50 border border-slate-100 rounded-[2.5rem] p-8 cursor-default group">
          <div className="absolute top-6 right-6 text-slate-300">
            <span className="material-icons-round text-base">edit</span>
          </div>
          
          <div className="flex flex-col space-y-5">
            <p className="text-[17px] leading-relaxed text-slate-600 font-medium pr-5">
              Hi <span className="text-emerald-700 font-bold">{formData.contact.name || 'there'}</span>! Looking forward to our meeting at <span className="text-emerald-700 font-bold">{formData.address || 'the location'}</span> on <span className="text-emerald-700 font-bold">
                {formData.date ? formData.date.split('-').reverse().join('/') : 'date'}
              </span> at <span className="text-emerald-700 font-bold underline decoration-emerald-100 uppercase">
                {formData.time ? (
                  (() => {
                    const [h, m] = formData.time.split(':');
                    const hr = parseInt(h);
                    const ampm = hr >= 12 ? 'PM' : 'AM';
                    return `${hr % 12 || 12}:${m} ${ampm}`;
                  })()
                ) : 'time'}
              </span>. See you then!
            </p>
            
            <div className="flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">WhatsApp Ready</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSend}
        className="w-full bg-[#10b981] text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center space-x-2 shadow-2xl shadow-emerald-100 active:scale-95 transition-all mb-4 mt-6"
      >
        <span className="material-icons-round text-lg">send</span>
        <span>Send WhatsApp</span>
      </button>

      <ContactPickerModal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        contacts={externalContacts}
        isLoading={isFetchingContacts}
        onSelect={handleSelectContact}
        selectedContactId={formData.contact.id}
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
