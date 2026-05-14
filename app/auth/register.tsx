import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { Button, Input, Header, Card } from '../../components';
import { useAuthStore, useOnboardingStore } from '../../store';
import { signUp } from '../../services';
import { colors } from '../../constants/theme';

/**
 * Registration screen for new users
 * Features email/password registration with Supabase integration
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { setSelectedRole, resetOnboarding } = useOnboardingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle registration form submission with Supabase authentication
   */
  const handleRegister = async () => {
    setError('');
    
    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email, password);
      
      if (authError) {
        setError(authError.message);
        return;
      }

      if (data) {
        // Set session in store
        setSession(data as any);
        
        // Reset onboarding state
        resetOnboarding();
        
        // Navigate to role selection onboarding
        router.push('/onboarding/role-selection');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Create Account"
          subtitle="Join MediPulse AI today"
        />

        <Card>
          <View style={styles.nameRow}>
            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              error={!!error}
              style={[styles.input, styles.nameInput]}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              error={!!error}
              style={[styles.input, styles.nameInput]}
            />
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!error}
            style={styles.input}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={!!error}
            right={
              <Text
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordText}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            }
            style={styles.input}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            error={!!error}
            right={
              <Text
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.showPasswordText}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            }
            style={styles.input}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.linkText} onPress={navigateToLogin}>
              Sign In
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  showPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
