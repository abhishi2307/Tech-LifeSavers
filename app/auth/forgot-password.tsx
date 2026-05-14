import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { Button, Input, Header, Card } from '../../components';
import { resetPassword } from '../../services';
import { colors } from '../../constants/theme';

/**
 * Forgot password screen
 * Allows users to request a password reset email
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
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
          title="Forgot Password?"
          subtitle="Enter your email to receive a reset link"
        />

        <Card>
          {!success ? (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!error}
                style={styles.input}
              />

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <Button
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Send Reset Link
              </Button>

              <Button
                variant="outline"
                onPress={navigateToLogin}
                disabled={loading}
                style={styles.button}
              >
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.successText}>
                Password reset email sent!
              </Text>
              <Text style={styles.successSubtext}>
                Check your email inbox and follow the instructions to reset your password.
              </Text>

              <Button
                onPress={navigateToLogin}
                style={styles.button}
              >
                Back to Login
              </Button>
            </>
          )}
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
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 12,
  },
});
