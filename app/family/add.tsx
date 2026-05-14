import React, { useState } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Button, Input, Card, Header } from '../../components';
import { useAuthStore, useFamilyStore } from '../../store';
import { familyService } from '../../services/familyService';
import { FamilyMember, BloodGroup } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { colors, radius, shadows, spacing, typography } from '../../constants/theme';

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent',
  'Grandchild', 'Friend', 'Caregiver', 'Other',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
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
    if (!name.trim()) { setError('Name is required'); return; }
    if (!relationship) { setError('Please select a relationship'); return; }
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
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header 
        title="Add Member" 
        subtitle="Grow your healthcare circle" 
        showBack 
        centered
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.mainCard}>
            <Input 
              label="Full Name *" 
              value={name} 
              onChangeText={(v) => { setName(v); setError(''); }} 
              style={styles.input}
              placeholder="Enter member's name"
              leftIcon="account-outline"
            />

            <View style={styles.section}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Relationship *</Text>
              <View style={styles.chipRow}>
                {RELATIONSHIPS.map((r) => {
                  const isActive = relationship === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.chip, 
                        { borderColor: isActive ? c.primary : c.borderLight, backgroundColor: isActive ? c.primary + '15' : c.surface }
                      ]}
                      onPress={() => { setRelationship(r); setError(''); }}
                    >
                      <Text style={[styles.chipText, { color: isActive ? c.primary : c.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="+91 0000000000"
              leftIcon="phone-outline"
            />

            <Input
              label="Date of Birth"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              style={styles.input}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar-outline"
            />

            <View style={styles.section}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Blood Group</Text>
              <View style={styles.chipRow}>
                {BLOOD_GROUPS.map((bg) => {
                  const isActive = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.chip, 
                        { borderColor: isActive ? c.primary : c.borderLight, backgroundColor: isActive ? c.primary + '15' : c.surface }
                      ]}
                      onPress={() => setBloodGroup(bg)}
                    >
                      <Text style={[styles.chipText, { color: isActive ? c.primary : c.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.switchCard, { backgroundColor: c.fillSecondary }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={[styles.switchLabel, { color: c.text }]}>Is a Caregiver</Text>
                  <Text style={[styles.switchSub, { color: c.textTertiary }]}>Can manage medications on your behalf</Text>
                </View>
                <Switch
                  value={isCaregiver}
                  onValueChange={setIsCaregiver}
                  trackColor={{ false: c.border, true: c.primary + '80' }}
                  thumbColor={isCaregiver ? c.primary : '#fff'}
                />
              </View>
              
              <View style={[styles.separator, { backgroundColor: c.borderLight }]} />
              
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={[styles.switchLabel, { color: c.text }]}>Emergency Contact</Text>
                  <Text style={[styles.switchSub, { color: c.textTertiary }]}>Alert first during SOS</Text>
                </View>
                <Switch
                  value={emergencyPriority}
                  onValueChange={setEmergencyPriority}
                  trackColor={{ false: c.border, true: c.error + '80' }}
                  thumbColor={emergencyPriority ? c.error : '#fff'}
                />
              </View>
            </View>

            {error ? <Text style={[styles.error, { color: c.error }]}>{error}</Text> : null}

            <Button onPress={handleSave} loading={loading} disabled={loading} style={styles.saveBtn}>
              Add Family Member
            </Button>
            
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.cancelLink}
              disabled={loading}
            >
              <Text style={[styles.cancelLinkText, { color: c.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.md },
  mainCard: { padding: spacing.lg, borderRadius: radius.xl },
  input: { marginBottom: spacing.md },
  section: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, ...shadows.sm },
  chipText: { fontSize: 13 },
  switchCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchTextCol: { flex: 1, paddingRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '700' },
  switchSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  separator: { height: 1, marginVertical: 12 },
  error: { fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  saveBtn: { height: 56, borderRadius: 16, marginBottom: 12 },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: 14, fontWeight: '600' },
});
