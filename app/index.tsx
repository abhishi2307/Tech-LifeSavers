import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store';
import LoadingScreen from '../components/LoadingScreen';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return <LoadingScreen message="Initializing..." />;
}
