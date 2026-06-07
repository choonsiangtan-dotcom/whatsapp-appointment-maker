import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsappappointmentmaker.app',
  appName: 'WhatsAppointment',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
