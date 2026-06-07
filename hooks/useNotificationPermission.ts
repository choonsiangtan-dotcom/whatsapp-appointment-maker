import { useState, useEffect, useCallback } from 'react';
import { registerPlugin } from '@capacitor/core';

export interface NotificationPermissionPlugin {
  openSettings(): Promise<void>;
  openAppNotificationSettings(): Promise<void>;
  checkPermission(): Promise<{ granted: boolean }>;
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  requestNotificationPermission(): Promise<void>;
  showNotification(options: { title: string; body: string }): Promise<void>;
  openStartupManager(): Promise<void>;
  checkBatteryOptimization(): Promise<{ ignored: boolean }>;
  requestIgnoreBatteryOptimization(): Promise<void>;
}

const NotificationPermission = registerPlugin<NotificationPermissionPlugin>('NotificationPermission');

export function useNotificationPermission() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);
  const [batteryOptimizationIgnored, setBatteryOptimizationIgnored] = useState<boolean | null>(null);

  const checkPermission = useCallback(async () => {
    try {
      const result = await NotificationPermission.checkPermission();
      setHasPermission(result.granted);
    } catch (e) {
      console.warn('NotificationPermission plugin not available', e);
      setHasPermission(false);
    }
  }, []);

  const checkNotificationPerm = useCallback(async () => {
    try {
      const result = await NotificationPermission.checkNotificationPermission();
      setHasNotificationPermission(result.granted);
    } catch (e) {
      console.warn('checkNotificationPermission not available', e);
      setHasNotificationPermission(true);
    }
  }, []);

  const checkBatteryOptimization = useCallback(async () => {
    try {
      const result = await NotificationPermission.checkBatteryOptimization();
      setBatteryOptimizationIgnored(result.ignored);
    } catch (e) {
      console.warn('checkBatteryOptimization not available', e);
      setBatteryOptimizationIgnored(true);
    }
  }, []);

  const requestNotificationPerm = useCallback(async () => {
    try {
      await NotificationPermission.requestNotificationPermission();
      setTimeout(checkNotificationPerm, 1000);
    } catch (e) {
      console.error('Failed to request notification permission', e);
    }
  }, [checkNotificationPerm]);

  const requestPermission = useCallback(async () => {
    try {
      await NotificationPermission.openSettings();
      // On Android, opening settings doesn't block, so we might want to tell the user to return here.
    } catch (e) {
      console.error('Failed to open settings', e);
    }
  }, []);

  const showNotification = useCallback(async (title: string, body: string) => {
    try {
      await NotificationPermission.showNotification({ title, body });
    } catch (e) {
      console.error('Failed to trigger notification', e);
    }
  }, []);

  const openStartupManager = useCallback(async () => {
    try {
      await NotificationPermission.openStartupManager();
    } catch (e) {
      console.error('Failed to open startup manager', e);
    }
  }, []);

  const requestIgnoreBatteryOptimization = useCallback(async () => {
    try {
      await NotificationPermission.requestIgnoreBatteryOptimization();
      setTimeout(checkBatteryOptimization, 1000);
    } catch (e) {
      console.error('Failed to request ignore battery optimization', e);
    }
  }, [checkBatteryOptimization]);

  useEffect(() => {
    checkPermission();
    checkNotificationPerm();
    checkBatteryOptimization();

    // Re-check permission when app returns to foreground
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPermission();
        checkNotificationPerm();
        checkBatteryOptimization();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkPermission, checkNotificationPerm, checkBatteryOptimization]);

  const [autoConfirmEnabled, setAutoConfirmEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('whatsapp_appointment_maker_auto_confirm') !== 'false';
  });

  const [alertsEnabled, setAlertsEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('whatsapp_appointment_maker_alerts') !== 'false';
  });

  const setAutoConfirmEnabled = useCallback((enabled: boolean) => {
    setAutoConfirmEnabledState(enabled);
    localStorage.setItem('whatsapp_appointment_maker_auto_confirm', String(enabled));
  }, []);

  const setAlertsEnabled = useCallback((enabled: boolean) => {
    setAlertsEnabledState(enabled);
    localStorage.setItem('whatsapp_appointment_maker_alerts', String(enabled));
  }, []);

  const openAppNotificationSettings = useCallback(async () => {
    try {
      await NotificationPermission.openAppNotificationSettings();
    } catch (e) {
      console.error('Failed to open app notification settings', e);
    }
  }, []);

  return { 
    hasPermission, 
    requestPermission, 
    checkPermission, 
    showNotification,
    hasNotificationPermission,
    requestNotificationPerm,
    autoConfirmEnabled,
    setAutoConfirmEnabled,
    alertsEnabled,
    setAlertsEnabled,
    openAppNotificationSettings,
    batteryOptimizationIgnored,
    openStartupManager,
    requestIgnoreBatteryOptimization
  };
}
