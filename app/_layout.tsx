import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../constants/theme';
import { useAuthStore } from '../store';
import { onAuthStateChange, getSession } from '../services';
import LoadingScreen from '../components/LoadingScreen';

/**
 * Root layout for Expo Router
 * Configures navigation structure, theme provider, and protected routes
 */
export default function RootLayout() {
  const { isAuthenticated, isLoading, setSession, setIsLoading, logout } = useAuthStore();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data } = await getSession();
      if (data) {
        setSession(data as any);
      }
      setIsLoading(false);
    };

    checkSession();

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((session) => {
      if (session) {
        setSession(session);
      } else {
        logout();
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [setSession, setIsLoading, logout]);

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <LoadingScreen message="Loading..." />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="auth/forgot-password" 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="onboarding/role-selection" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="onboarding/profile-setup" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="dashboard/index" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="medications/index" 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="medications/add" 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="medications/edit" 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="medications/details" 
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="adherence/index" 
          options={{ 
            headerShown: false,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
