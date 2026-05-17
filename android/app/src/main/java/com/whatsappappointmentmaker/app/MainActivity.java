package com.whatsappappointmentmaker.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static MainActivity instance;
    public static String pendingNavigationTab = null;

    private void handleNotificationIntent(Intent intent) {
        if (intent != null && "navigate-history".equals(intent.getStringExtra("action"))) {
            pendingNavigationTab = "history";
            dispatchNavigationToWebView("history");
        }
    }

    private void dispatchNavigationToWebView(String tab) {
        if (tab != null) {
            final String js = "window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: '" + tab + "' } }));";
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().evaluateJavascript(js, null);
                    }
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleNotificationIntent(intent);
    }

    public static void onWhatsAppReceived(String sender, String message) {
        if (instance != null) {
            instance.dispatchToWebView(sender, message);
        }
    }

    public static void openNotificationSettings() {
        if (instance != null) {
            Intent s = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            instance.startActivity(s);
        }
    }

    public static void openAppNotificationSettings() {
        if (instance != null) {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, instance.getPackageName());
            } else {
                intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
                intent.putExtra("app_package", instance.getPackageName());
                intent.putExtra("app_uid", instance.getApplicationInfo().uid);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            instance.startActivity(intent);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationPermissionPlugin.class);
        super.onCreate(savedInstanceState);
        instance = this;
        handleNotificationIntent(getIntent());

        // Debug BroadcastReceiver for ADB testing
        IntentFilter filter = new IntentFilter("com.whatsappappointmentmaker.app.DEBUG_WHATSAPP");
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                // Support both title/text and sender/message for debugging
                String sender = intent.getStringExtra("title");
                if (sender == null) sender = intent.getStringExtra("sender");
                
                String message = intent.getStringExtra("text");
                if (message == null) message = intent.getStringExtra("message");
                
                onWhatsAppReceived(sender, message);
            }

        };
        if (android.os.Build.VERSION.SDK_INT >= 34) { // Android 14
            registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(receiver, filter);
        }
    }


    private void dispatchToWebView(String sender, String message) {
        if (sender != null && message != null) {
            String sanitizedSender = sender.replace("'", "\\'");
            String sanitizedMessage = message.replace("'", "\\'");
            
            final String js = "window.dispatchEvent(new CustomEvent('whatsapp-received', { detail: { sender: '" + sanitizedSender + "', message: '" + sanitizedMessage + "' } }));";
            
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    getBridge().getWebView().evaluateJavascript(js, null);
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

}




