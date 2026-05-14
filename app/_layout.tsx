import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { theme, darkTheme } from '../constants/theme';
import { useAuthStore } from '../store';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import { onAuthStateChange, getSession } from '../services';
import { sqliteService } from '../database/sqliteService';
import LoadingScreen from '../components/LoadingScreen';

export default function RootLayout() {
  const { isLoading, setSession, setIsLoading, logout, userId } = useAuthStore();
  const { isDark, colors: c } = useAppTheme();
  const activeTheme = isDark ? darkTheme : theme;

  // Initialize reminders
  useReminderScheduler();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        await sqliteService.init();
      } catch (error) {
        console.error('Database init failed:', error);
      }

      let sessionResolved = false;

      unsubscribe = onAuthStateChange((session) => {
        if (session) {
          setSession(session);
          setIsLoading(false);
        } else if (sessionResolved) {
          logout();
          setIsLoading(false);
        }
      });

      const { data } = await getSession();
      if (data) {
        setSession(data as any);
      }
      sessionResolved = true;
      setIsLoading(false);
    };

    initialize();

    return () => {
      unsubscribe?.();
    };
  }, [setSession, setIsLoading, logout]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={activeTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <LoadingScreen message="Loading..." />
          <Toast />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <StatusBar translucent backgroundColor="transparent" style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: c.background } 
        }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="onboarding/role-selection" />
          <Stack.Screen name="onboarding/profile-setup" />
          <Stack.Screen name="medications/add" />
          <Stack.Screen name="medications/edit" />
          <Stack.Screen name="medications/details" />
          <Stack.Screen name="family/add" />
          <Stack.Screen name="family/[id]" />
          <Stack.Screen
            name="sos/index"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="chatbot/index" />
          <Stack.Screen name="ocr/index" />
          <Stack.Screen name="appointments/add" />
          <Stack.Screen name="appointments/index" />
          <Stack.Screen name="reports/index" />
          <Stack.Screen name="precautions/index" />
        </Stack>
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

