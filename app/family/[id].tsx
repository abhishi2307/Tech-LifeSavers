import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Button, Input, Card, Header } from '../../components';
import { useAuthStore, useFamilyStore } from '../../store';
import { familyService } from '../../services/familyService';
import { FamilyMember, BloodGroup } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, radius, shadows, typography } from '../../constants/theme';

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent',
  'Grandchild', 'Friend', 'Caregiver', 'Other',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditFamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  const { userId } = useAuthStore();
  const { updateMember, removeMember } = useFamilyStore();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [emergencyPriority, setEmergencyPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [original, setOriginal] = useState<FamilyMember | null>(null);

  useEffect(() => {
    if (!id) return;
    familyService.getFamilyMemberById(id).then((m) => {
      if (m) {
        setOriginal(m);
        setName(m.name);
        setRelationship(m.relationship);
        setPhone(m.phoneNumber ?? '');
        setDateOfBirth(m.dateOfBirth ?? '');
        setBloodGroup((m.bloodGroup as BloodGroup) ?? '');
        setIsCaregiver(m.isCaregiver);
        setEmergencyPriority((m.emergencyPriority ?? 0) > 0);
      }
      setPageLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!relationship) { setError('Please select a relationship'); return; }
    if (!original) return;

    setLoading(true);
    setError('');
    try {
      const updated: FamilyMember = {
        ...original,
        name: name.trim(),
        relationship,
        phoneNumber: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        isCaregiver,
        emergencyPriority: emergencyPriority ? 1 : 0,
        updatedAt: new Date().toISOString(),
      };
      await familyService.updateFamilyMember(updated);
      updateMember(updated);
      Toast.show({ type: 'success', text1: 'Updated!', text2: `${updated.name} updated` });
      router.back();
    } catch {
      setError('Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!original) return;
    Alert.alert('Remove Member', `Are you sure you want to remove ${original.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await familyService.deleteFamilyMember(original.id);
          removeMember(original.id);
          Toast.show({ type: 'success', text1: 'Removed' });
          router.back();
        },
      },
    ]);
  };

  if (pageLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header 
        title="Edit Member" 
        showBack 
        rightAction={{
          icon: 'trash-can-outline',
          onPress: handleDelete
        }}
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
              onChangeText={setName} 
              style={styles.input}
              placeholder="Enter member's name"
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
                      onPress={() => setRelationship(r)}
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
              Save Changes
            </Button>
            
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.cancelLink}
              disabled={loading}
            >
              <Text style={[styles.cancelLinkText, { color: c.textSecondary }]}>Discard Changes</Text>
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
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
