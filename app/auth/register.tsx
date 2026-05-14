import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, TextInput as PaperInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button, Card, Header } from '../../components';
import { useAuthStore, useOnboardingStore } from '../../store';
import { signUp } from '../../services';
import { colors, typography, spacing, radius } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    
    if (!fn || !ln || !em || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(em, password, {
        first_name: fn,
        last_name: ln,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data) {
        setSession(data as any);
        resetOnboarding();
        router.push('/onboarding/role-selection');
      } else {
        setError('Verification email sent! Please check your inbox.');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join MediPulse AI today</Text>
            </View>

            <Card style={styles.formCard} variant="elevated">
              {error ? (
                <View style={[styles.errorContainer, error.includes('Verification') && styles.infoContainer]}>
                  <MaterialCommunityIcons 
                    name={error.includes('Verification') ? "information-outline" : "alert-circle"} 
                    size={18} 
                    color={error.includes('Verification') ? colors.primary : colors.error} 
                  />
                  <Text style={[styles.errorText, error.includes('Verification') && styles.infoText]}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={styles.nameRow}>
                <View style={styles.flex}>
                  <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={styles.flex}>
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                right={
                  <PaperInput.Icon 
                    icon={showPassword ? "eye-off-outline" : "eye-outline"} 
                    onPress={() => setShowPassword(!showPassword)}
                    color={colors.primary}
                  />
                }
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                right={
                  <PaperInput.Icon 
                    icon={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={colors.primary}
                  />
                }
              />

              <Button
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                Create Account
              </Button>
            </Card>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  headerContainer: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  infoContainer: {
    backgroundColor: colors.primary + '10',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  infoText: {
    color: colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
