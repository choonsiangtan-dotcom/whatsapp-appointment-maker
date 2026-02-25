
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ContactSelector from './components/ContactSelector';
import InputField from './components/InputField';
import { INITIAL_CONTACTS } from './constants';
import { AppointmentData, Contact } from './types';

const App: React.FC = () => {
  // Load contacts from localStorage or use initial
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

        // Aggressive Overlap Deduplication: Merge if name matches AND any number overlaps
        const uniqueContacts: Contact[] = [];
        migrated.sort((a, b) => b.lastUsed - a.lastUsed).forEach((c: Contact) => {
          const existing = uniqueContacts.find(ex =>
            ex.name === c.name ||
            ex.phoneNumbers.some(n => c.phoneNumbers.includes(n))
          );

          if (existing) {
            // Merge phone numbers
            existing.phoneNumbers = Array.from(new Set([...existing.phoneNumbers, ...c.phoneNumbers])).sort();
            existing.lastUsed = Math.max(existing.lastUsed, c.lastUsed);
            // Optionally merge status/avatar if they are missing
            if (!existing.avatar.includes('ui-avatars') && c.avatar.includes('ui-avatars')) {
              // keep existing
            } else if (existing.avatar.includes('ui-avatars')) {
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

  // Load last selected contact ID from localStorage
  const [formData, setFormData] = useState<AppointmentData>(() => {
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
    // Use ISO format for native pickers (YYYY-MM-DD and HH:mm)
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);

    return {
      address: '',
      date: dateStr,
      time: timeStr,
      contact: selectedContact,
      selectedPhoneNumber: selectedContact.phoneNumbers[0] || '',
      reminderEnabled: true,
      leadTime: '30 mins'
    };
  });

  // Recent Address History (Last 3)
  const [addressHistory, setAddressHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('addressHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist address history
  useEffect(() => {
    localStorage.setItem('addressHistory', JSON.stringify(addressHistory));
  }, [addressHistory]);

  // Persist contacts whenever they change
  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Persist selected contact ID whenever it changes
  useEffect(() => {
    if (formData.contact.id !== 'default') {
      localStorage.setItem('lastSelectedContactId', formData.contact.id);
    }
  }, [formData.contact.id]);


  const handleFieldChange = (key: keyof AppointmentData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };


  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const handleSeeAll = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'icon', 'tel'];
        const opts = { multiple: true };
        // @ts-ignore
        const selectedContacts = await navigator.contacts.select(props, opts);

        if (selectedContacts.length > 0) {
          const newContactsRaw: Contact[] = await Promise.all(selectedContacts.map(async (c: any) => {
            let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name?.[0] || 'U')}&background=random`;

            if (c.icon?.[0]) {
              try {
                avatar = await blobToBase64(c.icon[0]);
              } catch (e) {
                console.error('Failed to convert icon to base64', e);
              }
            }

            const phoneNumbers = c.tel
              ? c.tel
                .map((t: string) => t.replace(/\D/g, ''))
                .filter((n: string) => n.length >= 7) // WhatsApp numbers usually >= 7 digits
              : [];

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

          if (validContacts.length > 0) {
            setContacts(prev => {
              let updated = [...prev];
              validContacts.forEach(newC => {
                const existingIndex = updated.findIndex(ex =>
                  ex.name === newC.name ||
                  ex.phoneNumbers.some(n => newC.phoneNumbers.includes(n))
                );

                if (existingIndex !== -1) {
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    avatar: newC.avatar.includes('ui-avatars') ? updated[existingIndex].avatar : newC.avatar,
                    phoneNumbers: Array.from(new Set([...updated[existingIndex].phoneNumbers, ...newC.phoneNumbers])).sort(),
                    lastUsed: Date.now()
                  };
                } else {
                  updated.unshift(newC);
                }
              });

              return updated.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5);
            });

            const firstNew = validContacts[0];
            setFormData(prev => ({
              ...prev,
              contact: firstNew,
              selectedPhoneNumber: firstNew.phoneNumbers[0] || ''
            }));
          }
        }
      } catch (ex) {
        console.error('Error picking contact:', ex);
        alert('Failed to pick contact. Please ensure you are using a supported browser (Chrome/Safari on Mobile) and accessing via HTTPS.');
      }
    } else {
      // Fallback for desktop/unsupported browsers
      const mockContact: Contact = {
        id: crypto.randomUUID(),
        name: 'New Friend',
        avatar: `https://ui-avatars.com/api/?name=New+Friend&background=random`,
        status: 'Hey there! I am using WhatsApp.',
        phoneNumbers: ['1234567890'],
        lastUsed: Date.now()
      };

      setContacts(prev => {
        let updated = [...prev];
        const newC = { ...mockContact, phoneNumbers: [...mockContact.phoneNumbers].sort() };

        const existingIndex = updated.findIndex(ex =>
          ex.name === newC.name ||
          ex.phoneNumbers.some(n => newC.phoneNumbers.includes(n))
        );

        if (existingIndex !== -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            phoneNumbers: Array.from(new Set([...updated[existingIndex].phoneNumbers, ...newC.phoneNumbers])).sort(),
            lastUsed: Date.now()
          };
        } else {
          updated.unshift(newC);
        }
        return updated
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, 5);
      });

      setFormData(prev => ({
        ...prev,
        contact: mockContact,
        selectedPhoneNumber: mockContact.phoneNumbers[0] || ''
      }));
      alert('Contact Picker API not supported on this device. Added a mock contact for demonstration.');
    }
  };

  const leadTimes: AppointmentData['leadTime'][] = ['30 mins', '1 hour', '1 day'];

  const handleSend = () => {
    // Add to address history (keep last 3, unique)
    if (formData.address.trim()) {
      setAddressHistory(prev => {
        const filtered = prev.filter(a => a !== formData.address);
        return [formData.address, ...filtered].slice(0, 3);
      });
    }

    // Update lastUsed timestamp when sending
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

    // Format time from 24h to 12h for the message
    const [hours, minutes] = formData.time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const formattedTime = `${h12}:${minutes} ${ampm}`;

    const message = `Hello *${formData.contact.name}*, looking forward to our meeting at *${formData.address}* on *${formattedDate}* at *${formattedTime}*.`;
    const encodedMessage = encodeURIComponent(message);

    // Construct WhatsApp URL with selected phone number
    const baseUrl = formData.selectedPhoneNumber
      ? `https://wa.me/${formData.selectedPhoneNumber}`
      : `https://wa.me/`;

    window.open(`${baseUrl}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Appointment</h1>
      </div>

      {/* Contacts List */}
      <ContactSelector
        contacts={contacts}
        selectedContactId={formData.contact.id}
        selectedPhoneNumber={formData.selectedPhoneNumber}
        onSelect={(contact, phoneNumber) => {
          // Update lastUsed timestamp when selecting
          setContacts(prev => prev.map(c =>
            c.id === contact.id ? { ...c, lastUsed: Date.now() } : c
          ).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 5));

          setFormData(prev => ({
            ...prev,
            contact,
            selectedPhoneNumber: phoneNumber
          }));
        }}
        onSeeAll={handleSeeAll}
      />

      {/* Form Fields */}
      <div className="space-y-4 mb-6">
        <InputField
          label="Appointment Address"
          icon="location_on"
          value={formData.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          suggestions={addressHistory}
          onSuggestionClick={(val) => handleFieldChange('address', val)}
        />
        <div className="grid grid-cols-2 gap-4">
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

      {/* Automatic Reminder Section */}
      <div className="mb-6">
        <div className="glass-light dark:glass rounded-3xl p-5 border border-white/10 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">notifications_active</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Automatic Reminder</span>
            </div>
            <button
              onClick={() => handleFieldChange('reminderEnabled', !formData.reminderEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 border border-white/20 cursor-pointer ${formData.reminderEnabled ? 'bg-primary/20 neon-glow-toggle' : 'bg-slate-200 dark:bg-white/10'
                }`}
            >
              <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ring-2 ${formData.reminderEnabled ? 'translate-x-6 bg-primary ring-primary/20' : 'translate-x-1 ring-transparent'
                }`} />
            </button>
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

      {/* WhatsApp Preview */}
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

      {/* Action Button */}
      <button
        onClick={handleSend}
        className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg neon-glow active:scale-[0.98] hover:brightness-110 transition-all mb-4"
      >
        <span className="material-icons-round">send</span>
        <span>Send via WhatsApp</span>
      </button>

      {/* Home Indicator (Mimic iOS) */}
      <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2 opacity-50"></div>
    </Layout>
  );
};

export default App;
