package com.whatsappappointmentmaker.app;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class WhatsAppNotificationListener extends NotificationListenerService {
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d("WhatsAppListener", "WhatsAppNotificationListener created!");
    }

    @Override
    public void onDestroy() {
        Log.d("WhatsAppListener", "WhatsAppNotificationListener destroyed!");
        super.onDestroy();
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d("WhatsAppListener", "WhatsAppNotificationListener connected/bound successfully!");
    }

    @Override
    public void onListenerDisconnected() {
        Log.d("WhatsAppListener", "WhatsAppNotificationListener disconnected/unbound!");
        super.onListenerDisconnected();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        Log.d("WhatsAppListener", "onNotificationPosted: " + packageName);
        
        if (packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b")) {
            Bundle extras = sbn.getNotification().extras;
            
            // Debug: Log all extra keys
            if (extras != null) {
                for (String key : extras.keySet()) {
                    Log.d("WhatsAppListener", "Extra [" + key + "]: " + extras.get(key));
                }
            } else {
                Log.d("WhatsAppListener", "No extras found in notification");
            }

            CharSequence titleCharSeq = null;
            if (extras != null) {
                titleCharSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
                if (titleCharSeq == null) {
                    titleCharSeq = extras.getCharSequence("android.title");
                }
            }
            String title = titleCharSeq != null ? titleCharSeq.toString() : null;
            CharSequence text = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
            
            if (title != null && text != null) {
                Log.d("WhatsAppListener", "MATCH FOUND - Title: " + title + " Text: " + text);
                MainActivity.onWhatsAppReceived(title, text.toString());
            } else {
                Log.e("WhatsAppListener", "MISSING DATA - Title: " + title + " Text: " + text);
            }
        }
    }
}
