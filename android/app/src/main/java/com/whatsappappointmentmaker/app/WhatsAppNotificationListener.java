package com.whatsappappointmentmaker.app;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class WhatsAppNotificationListener extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        if (packageName.equals("com.whatsapp")) {
            Bundle extras = sbn.getNotification().extras;
            
            // Debug: Log all extra keys
            for (String key : extras.keySet()) {
                Log.d("WhatsAppListener", "Extra [" + key + "]: " + extras.get(key));
            }

            String title = extras.getString(Notification.EXTRA_TITLE);
            CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
            
            // Sometimes title is in different extras for group chats or specific versions
            if (title == null) {
                title = extras.getString("android.title");
            }
            
            if (title != null && text != null) {
                Log.d("WhatsAppListener", "MATCH FOUND - Title: " + title + " Text: " + text);
                MainActivity.onWhatsAppReceived(title, text.toString());
            } else {

                Log.e("WhatsAppListener", "MISSING DATA - Title: " + title + " Text: " + text);
            }
        }

    }
}
