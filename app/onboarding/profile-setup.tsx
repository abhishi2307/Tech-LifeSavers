import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { Button, Input, Header, Card } from '../../components';
import { useAuthStore, useOnboardingStore } from '../../store';
import { upsertProfile } from '../../services';
import { UserProfile, Gender, BloodGroup } from '../../types';
import { colors } from '../../constants/theme';

/**
 * Patient profile setup screen
 * Collects detailed health information for the user profile
 */
export default function ProfileSetupScreen() {
  const router = useRouter();
  const { userId, email, setUserProfile } = useAuthStore();
  const { selectedRole, completeOnboarding } = useOnboardingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [allergies, setAllergies] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const GENDER_OPTIONS: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const BLOOD_GROUP_OPTIONS: { value: BloodGroup; label: string }[] = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  const handleSaveProfile = async () => {
    setError('');

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !age || !gender) {
      setError('Please fill in all required fields');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const profileData: Partial<UserProfile> = {
        id: userId,
        email: email || '',
        firstName,
        lastName,
        role: selectedRole || 'patient',
        dateOfBirth,
        age: parseInt(age),
        gender,
        bloodGroup: bloodGroup || undefined,
        allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
        emergencyContact: emergencyName ? {
          name: emergencyName,
          relationship: emergencyRelation,
          phoneNumber: emergencyPhone,
        } : undefined,
        phoneNumber: phoneNumber || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data, error: profileError } = await upsertProfile(profileData);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      if (data) {
        setUserProfile(data);
        completeOnboarding();
        router.replace('/dashboard/index');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/dashboard/index');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Complete Your Profile"
          subtitle="Tell us more about yourself"
        />

        <Card>
          <View style={styles.nameRow}>
            <Input
              label="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              error={!!error}
              style={[styles.input, styles.nameInput]}
            />
            <Input
              label="Last Name *"
              value={lastName}
              onChangeText={setLastName}
              error={!!error}
              style={[styles.input, styles.nameInput]}
            />
          </View>

          <Input
            label="Date of Birth *"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            error={!!error}
            style={styles.input}
          />

          <Input
            label="Age *"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            error={!!error}
            style={styles.input}
          />

          <Text style={styles.label}>Gender *</Text>
          <View style={styles.optionsGrid}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  gender === option.value && styles.selectedOption,
                ]}
                onPress={() => setGender(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Blood Group</Text>
          <View style={styles.optionsGrid}>
            {BLOOD_GROUP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  bloodGroup === option.value && styles.selectedOption,
                ]}
                onPress={() => setBloodGroup(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    bloodGroup === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Allergies (comma separated)"
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g., Penicillin, Peanuts"
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <Input
            label="Contact Name"
            value={emergencyName}
            onChangeText={setEmergencyName}
            style={styles.input}
          />

          <Input
            label="Relationship"
            value={emergencyRelation}
            onChangeText={setEmergencyRelation}
            style={styles.input}
          />

          <Input
            label="Contact Phone"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Input
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            onPress={handleSaveProfile}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Save Profile
          </Button>

          <Button
            variant="outline"
            onPress={handleSkip}
            disabled={loading}
            style={styles.button}
          >
            Skip for Now
          </Button>

          <Button
            onPress={handleBack}
            disabled={loading}
            style={styles.button}
          >
            Back
          </Button>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
  },
});
