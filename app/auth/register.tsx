import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TextInput as PaperInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { useAuthStore, useOnboardingStore } from '../../store';
import { signUp } from '../../services';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { UserRole } from '../../types';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type RoleConfig = {
  id: UserRole;
  label: string;
  icon: MCIName;
  color: string;
  bg: string;
  description: string;
};

const ROLES: RoleConfig[] = [
  { id: 'patient',           label: 'Patient',    icon: 'account-heart-outline',   color: '#007AFF', bg: '#EFF6FF', description: 'Track my health & medications' },
  { id: 'family_member',     label: 'Family',     icon: 'account-group-outline',   color: '#34C759', bg: '#F0FDF4', description: 'Monitor loved ones remotely' },
  { id: 'caregiver',         label: 'Caregiver',  icon: 'heart-plus-outline',      color: '#FF9500', bg: '#FFF7ED', description: 'Provide professional care' },
  { id: 'doctor',            label: 'Doctor',     icon: 'stethoscope',             color: '#5856D6', bg: '#F5F3FF', description: 'Manage patients & prescriptions' },
  { id: 'organization_admin',label: 'Org Admin',  icon: 'office-building-outline', color: '#FF3B30', bg: '#FFF1F0', description: 'Manage healthcare organization' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { resetOnboarding, setSelectedRole } = useOnboardingStore();

  const [selectedRole, setRole] = useState<UserRole>('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifyStep, setIsVerifyStep] = useState(false);

  const activeRole = ROLES.find((r) => r.id === selectedRole)!;

  const handleRegister = async () => {
    setError('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: selectedRole,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      // Save role to onboarding store so profile-setup picks it up
      resetOnboarding();
      setSelectedRole(selectedRole);

      if (data) {
        setSession(data as any);
        router.push('/onboarding/profile-setup');
      } else {
        setIsVerifyStep(true);
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isVerifyStep) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.verifyContainer}>
            <View style={[styles.verifyIcon, { backgroundColor: activeRole.bg }]}>
              <MaterialCommunityIcons name="email-check-outline" size={44} color={activeRole.color} />
            </View>
            <Text style={styles.verifyTitle}>Check your email</Text>
            <Text style={styles.verifySub}>
              We sent a verification link to{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
              {'\n\n'}Click the link to confirm your account, then sign in.
            </Text>
            <Button onPress={() => router.replace('/auth/login')} style={styles.verifyBtn}>
              Go to Sign In
            </Button>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
            {/* Nav */}
            <View style={styles.navBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join MediPulse AI and take control of your health</Text>
            </View>

            {/* Step 1 — Role Selection */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: activeRole.color }]}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Choose your account type</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roleScroll}
              >
                {ROLES.map((role) => {
                  const active = selectedRole === role.id;
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleChip,
                        active
                          ? { backgroundColor: role.bg, borderColor: role.color, borderWidth: 2 }
                          : styles.roleChipInactive,
                      ]}
                      onPress={() => setRole(role.id)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.roleChipIcon,
                          { backgroundColor: active ? role.color : colors.fillTertiary },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={role.icon}
                          size={20}
                          color={active ? '#fff' : colors.textSecondary}
                        />
                      </View>
                      <View>
                        <Text style={[styles.roleChipName, active && { color: role.color }]}>
                          {role.label}
                        </Text>
                        <Text style={styles.roleChipDesc}>{role.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected role summary */}
              <View style={[styles.roleSummary, { backgroundColor: activeRole.bg, borderColor: activeRole.color + '40' }]}>
                <MaterialCommunityIcons name={activeRole.icon} size={20} color={activeRole.color} />
                <Text style={[styles.roleSummaryText, { color: activeRole.color }]}>
                  Signing up as <Text style={{ fontWeight: '700' }}>{activeRole.label}</Text> — {activeRole.description}
                </Text>
              </View>
            </View>

            {/* Step 2 — Account Details */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: activeRole.color }]}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Account details</Text>
              </View>

              <View style={[styles.card, { borderTopColor: activeRole.color }]}>
                {error ? (
                  <View style={styles.errorRow}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.nameRow}>
                  <View style={styles.halfField}>
                    <Input
                      label="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoComplete="given-name"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      autoComplete="family-name"
                    />
                  </View>
                </View>

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
                  autoComplete="new-password"
                  leftIcon="lock-outline"
                  right={
                    <PaperInput.Icon
                      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setShowPassword(!showPassword)}
                      color={colors.textSecondary}
                    />
                  }
                />

                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  leftIcon="lock-check-outline"
                  right={
                    <PaperInput.Icon
                      icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      color={colors.textSecondary}
                    />
                  }
                />

                <Text style={styles.hint}>Minimum 8 characters</Text>

                <Button
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  style={{ backgroundColor: activeRole.color } as any}
                >
                  Create {activeRole.label} Account
                </Button>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                <Text style={[styles.footerLink, { color: activeRole.color }]}> Sign In</Text>
              </TouchableOpacity>
            </View>
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
  scroll: { flexGrow: 1, paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  navBar: { paddingTop: spacing.sm, marginBottom: spacing.xs },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  header: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.35, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 20, letterSpacing: -0.24 },

  stepSection: { marginBottom: spacing.xl },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepTitle: { fontSize: 17, fontWeight: '600', color: colors.text, letterSpacing: -0.41 },

  // Role scroll
  roleScroll: { gap: spacing.sm, paddingRight: spacing.md, paddingBottom: spacing.sm },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    gap: 10,
    minWidth: 160,
    ...shadows.sm,
  },
  roleChipInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleChipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleChipName: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.1 },
  roleChipDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2, lineHeight: 14 },

  roleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  roleSummaryText: { fontSize: 13, flex: 1, lineHeight: 18 },

  // Form card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 4,
    ...shadows.md,
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
  errorText: { fontSize: 13, color: colors.error, fontWeight: '500', flex: 1 },
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  hint: { fontSize: 12, color: colors.textTertiary, marginTop: 2, marginBottom: spacing.md },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15, color: colors.textSecondary },
  footerLink: { fontSize: 15, fontWeight: '700' },

  // Verify email step
  verifyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  verifyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  verifyTitle: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  verifySub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  verifyBtn: { width: '100%' },
});
