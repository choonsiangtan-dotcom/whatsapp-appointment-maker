package com.whatsappappointmentmaker.app;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.ComponentName;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationPermission")
public class NotificationPermissionPlugin extends Plugin {

    @PluginMethod
    public void openSettings(PluginCall call) {
        MainActivity.openNotificationSettings();
        call.resolve();
    }

    @PluginMethod
    public void openAppNotificationSettings(PluginCall call) {
        MainActivity.openAppNotificationSettings();
        call.resolve();
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        ComponentName cn = new ComponentName(getContext(), WhatsAppNotificationListener.class);
        String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        boolean enabled = flat != null && flat.contains(cn.flattenToString());
        
        JSObject ret = new JSObject();
        ret.put("granted", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
            ret.put("granted", granted);
        } else {
            ret.put("granted", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        1012
                );
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getPendingNavigation(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("tab", MainActivity.pendingNavigationTab);
        MainActivity.pendingNavigationTab = null; // Reset after reading
        call.resolve(ret);
    }

    @PluginMethod
    public void showNotification(PluginCall call) {
        String title = call.getString("title");
        String body = call.getString("body");

        if (title == null || body == null) {
            call.reject("Title and body are required");
            return;
        }

        Context context = getContext();
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "appointment_confirmations";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Appointment Confirmations",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for auto-confirmed appointments");
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra("action", "navigate-history");
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(context, (int) System.currentTimeMillis(), intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pendingIntent)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
        call.resolve();
    }
}
