import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { useOnboardingStore } from '../../store';
import { UserRole } from '../../types';
import { colors, spacing, radius, shadows } from '../../constants/theme';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type RoleConfig = {
  id: UserRole;
  title: string;
  description: string;
  icon: MCIName;
  color: string;
  bg: string;
  features: string[];
};

const ROLES: RoleConfig[] = [
  {
    id: 'patient',
    title: 'Patient',
    description: 'Manage your personal health, medications & adherence',
    icon: 'account-heart-outline',
    color: '#007AFF',
    bg: '#EFF6FF',
    features: ['Medication reminders', 'Adherence tracking', 'Health reports'],
  },
  {
    id: 'family_member',
    title: 'Family Member',
    description: 'Monitor and support your loved ones remotely',
    icon: 'account-group-outline',
    color: '#34C759',
    bg: '#F0FDF4',
    features: ['Family health overview', 'Shared notifications', 'Emergency alerts'],
  },
  {
    id: 'caregiver',
    title: 'Caregiver',
    description: 'Provide professional care and medication management',
    icon: 'heart-plus-outline',
    color: '#FF9500',
    bg: '#FFF7ED',
    features: ['Multi-patient view', 'Dose administration', 'Care notes'],
  },
  {
    id: 'doctor',
    title: 'Doctor',
    description: 'Manage patients, prescriptions and health records',
    icon: 'stethoscope',
    color: '#5856D6',
    bg: '#F5F3FF',
    features: ['Patient management', 'Prescription tools', 'Clinical reports'],
  },
  {
    id: 'organization_admin',
    title: 'Organization Admin',
    description: 'Oversee and manage your healthcare organization',
    icon: 'office-building-outline',
    color: '#FF3B30',
    bg: '#FFF1F0',
    features: ['Team management', 'Analytics dashboard', 'Compliance tools'],
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { selectedRole, setSelectedRole } = useOnboardingStore();

  const activeRole = ROLES.find((r) => r.id === selectedRole);

  const handleContinue = () => {
    if (!selectedRole) return;
    router.push('/onboarding/profile-setup');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            <View style={[styles.step, styles.stepActive]} />
            <View style={styles.step} />
          </View>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
          <Text style={styles.title}>What's your role?</Text>
          <Text style={styles.subtitle}>
            Choose how you'll use MediPulse AI. You can always change this later.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.roleList}>
            {ROLES.map((role) => {
              const selected = selectedRole === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selected && {
                      borderColor: role.color,
                      borderWidth: 2,
                      backgroundColor: role.bg,
                    },
                  ]}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.roleIcon,
                      { backgroundColor: selected ? role.color : role.bg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={role.icon}
                      size={28}
                      color={selected ? '#fff' : role.color}
                    />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text
                      style={[
                        styles.roleTitle,
                        selected && { color: role.color },
                      ]}
                    >
                      {role.title}
                    </Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                    {selected ? (
                      <View style={styles.featureRow}>
                        {role.features.map((f) => (
                          <View
                            key={f}
                            style={[styles.featurePill, { backgroundColor: role.color + '18' }]}
                          >
                            <MaterialCommunityIcons
                              name="check"
                              size={10}
                              color={role.color}
                            />
                            <Text style={[styles.featureText, { color: role.color }]}>
                              {f}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  {selected ? (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={role.color}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="circle-outline"
                      size={24}
                      color={colors.textTertiary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            onPress={handleContinue}
            disabled={!selectedRole}
            style={
              activeRole
                ? ([{ backgroundColor: activeRole.color }] as any)
                : undefined
            }
          >
            Continue to Profile Setup
          </Button>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  step: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  stepActive: {
    backgroundColor: colors.primary,
    width: 32,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.35,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: -0.24,
  },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  roleList: {
    gap: spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
    ...shadows.sm,
  },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleInfo: { flex: 1 },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.32,
    marginBottom: 3,
  },
  roleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
  },

  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
