import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useAuthStore } from '../store';
import { colors } from '../constants/theme';

/**
 * Welcome screen with animated logo and healthcare-inspired UI
 * Features smooth transitions and responsive design
 * Auto-navigates based on authentication state
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo animation sequence
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 800 }),
      withTiming(1, { duration: 400 })
    );
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Subtitle animation
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));

    // Button animation
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));

    // Auto-navigate after animation (only if not loading)
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace('/dashboard/index');
        } else {
          router.replace('/auth/login');
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <View style={styles.pulseLine} />
            <View style={[styles.pulseLine, styles.pulseLine2]} />
            <View style={[styles.pulseLine, styles.pulseLine3]} />
          </View>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.title, subtitleAnimatedStyle]}>
        MediPulse AI
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
        Tech Lifesavers
      </Animated.Text>

      <Animated.View style={[styles.loadingContainer, buttonAnimatedStyle]}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDot2]} />
        <View style={[styles.loadingDot, styles.loadingDot3]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseLine: {
    width: 60,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    position: 'absolute',
  },
  pulseLine2: {
    transform: [{ rotate: '60deg' }],
  },
  pulseLine3: {
    transform: [{ rotate: '-60deg' }],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 48,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  loadingDot2: {
    opacity: 0.6,
  },
  loadingDot3: {
    opacity: 0.3,
  },
});
