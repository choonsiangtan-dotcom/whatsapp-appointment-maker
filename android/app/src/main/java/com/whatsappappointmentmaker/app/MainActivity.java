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
    public static String pendingAppointmentId = null;

    private void handleNotificationIntent(Intent intent) {
        if (intent != null && "navigate-history".equals(intent.getStringExtra("action"))) {
            pendingNavigationTab = "history";
            pendingAppointmentId = intent.getStringExtra("appointmentId");
            dispatchNavigationToWebView("history", pendingAppointmentId);
        }
    }

    private void dispatchNavigationToWebView(String tab, String appointmentId) {
        if (tab != null) {
            String js;
            if (appointmentId != null) {
                js = "window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: '" + tab + "', appointmentId: '" + appointmentId + "' } }));";
            } else {
                js = "window.dispatchEvent(new CustomEvent('navigate-tab', { detail: { tab: '" + tab + "' } }));";
            }
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

    public static void openStartupManager() {
        if (instance != null) {
            Intent intent = new Intent();
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                intent.setClassName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity");
                instance.startActivity(intent);
            } catch (Exception e) {
                try {
                    intent.setClassName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity");
                    instance.startActivity(intent);
                } catch (Exception e2) {
                    try {
                        intent.setClassName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity");
                        instance.startActivity(intent);
                    } catch (Exception e3) {
                        // Fallback to battery optimization settings
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            Intent bat = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                            bat.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            instance.startActivity(bat);
                        }
                    }
                }
            }
        }
    }

    public static boolean isIgnoringBatteryOptimizations() {
        if (instance != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.os.PowerManager pm = (android.os.PowerManager) instance.getSystemService(Context.POWER_SERVICE);
                return pm.isIgnoringBatteryOptimizations(instance.getPackageName());
            }
        }
        return true;
    }

    public static void requestIgnoreBatteryOptimizations() {
        if (instance != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    Intent intent = new Intent();
                    intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + instance.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    instance.startActivity(intent);
                } catch (Exception e) {
                    openStartupManager();
                }
            }
        }
    }

    public static void forceRebindService() {
        if (instance != null) {
            try {
                android.content.ComponentName cn = new android.content.ComponentName(instance, WhatsAppNotificationListener.class);
                android.content.pm.PackageManager pm = instance.getPackageManager();
                pm.setComponentEnabledSetting(cn, android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED, android.content.pm.PackageManager.DONT_KILL_APP);
                pm.setComponentEnabledSetting(cn, android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED, android.content.pm.PackageManager.DONT_KILL_APP);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    WhatsAppNotificationListener.requestRebind(cn);
                }
                android.util.Log.d("MainActivity", "Successfully triggered forceRebindService");
            } catch (Exception e) {
                android.util.Log.e("MainActivity", "Failed to forceRebindService", e);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        forceRebindService();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationPermissionPlugin.class);
        super.onCreate(savedInstanceState);
        instance = this;
        handleNotificationIntent(getIntent());

        forceRebindService();

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




