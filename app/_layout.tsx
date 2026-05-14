import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { theme, colors } from '../constants/theme';
import { useAuthStore } from '../store';
import { onAuthStateChange, getSession } from '../services';
import { sqliteService } from '../database/sqliteService';
import LoadingScreen from '../components/LoadingScreen';

export default function RootLayout() {
  const { isLoading, setSession, setIsLoading, logout } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        await sqliteService.init();
      } catch (error) {
        console.error('Database init failed:', error);
      }

      // Flag: don't allow the listener to call logout() before we've
      // completed the initial session check — Supabase fires SIGNED_OUT
      // immediately on startup before it restores the persisted token.
      let sessionResolved = false;

      unsubscribe = onAuthStateChange((session) => {
        if (session) {
          setSession(session);
          setIsLoading(false);
        } else if (sessionResolved) {
          // Only log out if the initial check already ran — this is a real sign-out
          logout();
          setIsLoading(false);
        }
        // If sessionResolved is false and session is null, ignore it (startup noise)
      });

      // Initial session check — this is the source of truth on startup
      const { data } = await getSession();
      if (data) {
        setSession(data as any);
      }
      // Mark initial check complete — the listener can now react to sign-outs
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
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <LoadingScreen message="Loading..." />
          <Toast />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar translucent backgroundColor="transparent" style="light" />
        <Stack screenOptions={{ 
          headerShown: false, 
          contentStyle: { backgroundColor: colors.background } 
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
