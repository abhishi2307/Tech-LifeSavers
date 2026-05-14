import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TextInput as PaperInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { useAuthStore } from '../../store';
import { signIn } from '../../services';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      shakeError();
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await signIn(email.trim(), password);
      if (authError) {
        setError(authError.message);
        shakeError();
        return;
      }
      if (data) {
        setSession(data as any);
        router.replace('/(tabs)/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.logoRing}>
                <View style={styles.logoInner}>
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={38}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.appName}>MediPulse AI</Text>
              <Text style={styles.appTagline}>Your personal health companion</Text>
            </View>

            {/* Form */}
            <Animated.View
              style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
            >
              <View style={styles.cardStripe} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>Welcome back</Text>
                <Text style={styles.cardSub}>Sign in to continue</Text>

                {error ? (
                  <View style={styles.errorRow}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={16}
                      color={colors.error}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.fields}>
                  <Input
                    label="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    leftIcon="email-outline"
                  />
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    leftIcon="lock-outline"
                    right={
                      <PaperInput.Icon
                        icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        onPress={() => setShowPassword(!showPassword)}
                        color={colors.textSecondary}
                      />
                    }
                  />
                </View>

                <TouchableOpacity
                  style={styles.forgotRow}
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <Button onPress={handleLogin} loading={loading} disabled={loading}>
                  Sign In
                </Button>
              </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to MediPulse?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={styles.footerLink}> Create account</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.version}>MediPulse AI · Tech Lifesavers</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  hero: { alignItems: 'center', marginBottom: spacing.xl },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.35,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: -0.24,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardStripe: { height: 4, backgroundColor: colors.primary },
  cardBody: { padding: spacing.lg },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.35,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    letterSpacing: -0.24,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error + '10',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
    flex: 1,
  },

  fields: { gap: spacing.xs, marginBottom: spacing.xs },

  forgotRow: { alignSelf: 'flex-end', paddingVertical: 4, marginBottom: spacing.md },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.24,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerText: { fontSize: 15, color: colors.textSecondary },
  footerLink: { fontSize: 15, color: colors.primary, fontWeight: '700' },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textTertiary,
  },
});
