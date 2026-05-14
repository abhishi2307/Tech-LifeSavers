import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { Button, Header, Card } from '../../components';
import { useOnboardingStore } from '../../store';
import { UserRole } from '../../types';
import { colors } from '../../constants/theme';

/**
 * Role selection onboarding screen
 * Allows users to select their role in the healthcare ecosystem
 */
const ROLES: { id: UserRole; title: string; description: string; icon: string }[] = [
  {
    id: 'patient',
    title: 'Patient',
    description: 'Manage your health and medications',
    icon: '👤',
  },
  {
    id: 'family_member',
    title: 'Family Member',
    description: 'Support and monitor loved ones',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'caregiver',
    title: 'Caregiver',
    description: 'Provide professional care services',
    icon: '🏥',
  },
  {
    id: 'doctor',
    title: 'Doctor',
    description: 'Manage patients and prescriptions',
    icon: '👨‍⚕️',
  },
  {
    id: 'organization_admin',
    title: 'Organization Admin',
    description: 'Manage healthcare organization',
    icon: '🏢',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { selectedRole, setSelectedRole } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push('/onboarding/profile-setup');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Select Your Role"
          subtitle="Choose how you'll use MediPulse AI"
        />

        <View style={styles.rolesGrid}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.7}
              style={styles.roleCardWrapper}
            >
              <Card
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.selectedRoleCard,
                ]}
              >
                <Text style={styles.roleIcon}>{role.icon}</Text>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          onPress={handleContinue}
          loading={loading}
          disabled={!selectedRole || loading}
          style={styles.button}
        >
          Continue
        </Button>

        <Button
          variant="outline"
          onPress={handleBack}
          disabled={loading}
          style={styles.button}
        >
          Back
        </Button>
      </ScrollView>
    </View>
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
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  roleCardWrapper: {
    width: '48%',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  roleCard: {
    alignItems: 'center',
    padding: 16,
  },
  selectedRoleCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
  },
});
