import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card, Header } from '../../components';
import { useAuthStore, useFamilyStore } from '../../store';
import { familyService } from '../../services/familyService';
import { FamilyMember, BloodGroup } from '../../types';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent',
  'Grandchild', 'Friend', 'Caregiver', 'Other',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { addMember } = useFamilyStore();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [emergencyPriority, setEmergencyPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!relationship) {
      setError('Please select a relationship');
      return;
    }
    if (!userId) return;

    setLoading(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const member: FamilyMember = {
        id: `${userId}-${Date.now()}`,
        userId,
        name: name.trim(),
        relationship,
        phoneNumber: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        isCaregiver,
        emergencyPriority: emergencyPriority ? 1 : 0,
        createdAt: now,
        updatedAt: now,
        localOnly: true,
      };

      await familyService.addFamilyMember(member);
      addMember(member);
      Toast.show({ 
        type: 'success', 
        text1: 'Added Successfully', 
        text2: `${member.name} is now in your family circle` 
      });
      router.back();
    } catch {
      setError('Failed to add family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Header 
        title="Add Family Member" 
        subtitle="Grow your healthcare circle" 
        showBack 
        centered
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Input
                label="Full Name *"
                value={name}
                onChangeText={(val) => { setName(val); setError(''); }}
                placeholder="Enter their full name"
                leftIcon="account-outline"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Relationship *</Text>
              <View style={styles.chipRow}>
                {RELATIONSHIPS.map((r) => {
                  const isSelected = relationship === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => { setRelationship(r); setError(''); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact & Details</Text>
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
                leftIcon="phone-outline"
                style={styles.input}
              />

              <Input
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Blood Group</Text>
              <View style={styles.chipRow}>
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.chip, styles.bloodChip, isSelected && styles.bloodChipSelected]}
                      onPress={() => setBloodGroup(bg)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Roles & Permissions</Text>
              
              <View style={styles.settingItem}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                  <MaterialCommunityIcons name="account-heart-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Is a Caregiver</Text>
                  <Text style={styles.settingSub}>Can manage medications on your behalf</Text>
                </View>
                <Switch
                  value={isCaregiver}
                  onValueChange={setIsCaregiver}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={isCaregiver ? colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={[styles.iconBox, { backgroundColor: colors.error + '10' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Emergency Contact</Text>
                  <Text style={styles.settingSub}>Notify this person first during SOS</Text>
                </View>
                <Switch
                  value={emergencyPriority}
                  onValueChange={setEmergencyPriority}
                  trackColor={{ false: colors.border, true: colors.error + '80' }}
                  thumbColor={emergencyPriority ? colors.error : '#f4f3f4'}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonGroup}>
              <Button
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.saveButton}
              >
                Add Family Member
              </Button>

              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.cancelButton}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md },
  formCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  input: { marginBottom: spacing.md },
  fieldLabel: { 
    ...typography.caption, 
    color: colors.textSecondary, 
    marginBottom: spacing.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.sm, 
    marginBottom: spacing.md 
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
  },
  chipSelected: { 
    borderColor: colors.primary, 
    backgroundColor: colors.primary + '10' 
  },
  bloodChip: {
    width: 50,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  bloodChipSelected: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  chipText: { 
    ...typography.bodySm, 
    color: colors.textSecondary 
  },
  chipTextSelected: { 
    color: colors.primary, 
    fontWeight: '700' 
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  settingLabel: { 
    ...typography.body, 
    fontWeight: '700',
    color: colors.text,
  },
  settingSub: { 
    ...typography.caption, 
    color: colors.textTertiary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: { 
    ...typography.caption, 
    color: colors.error, 
    fontWeight: '600' 
  },
  buttonGroup: {
    marginTop: spacing.sm,
  },
  saveButton: { 
    marginBottom: spacing.sm,
  },
  cancelButton: { 
    borderColor: 'transparent',
  },
});
