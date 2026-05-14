import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input, Card } from '../../components';
import { useAuthStore, useFamilyStore } from '../../store';
import { familyService } from '../../services/familyService';
import { FamilyMember, BloodGroup } from '../../types';
import { colors } from '../../constants/theme';

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent',
  'Grandchild', 'Friend', 'Caregiver', 'Other',
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditFamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
    Alert.alert('Remove Member', `Remove ${original.name}?`, [
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Edit Member</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Input label="Full Name *" value={name} onChangeText={setName} style={styles.input} />

            <Text style={styles.fieldLabel}>Relationship *</Text>
            <View style={styles.chipRow}>
              {RELATIONSHIPS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, relationship === r && styles.chipSelected]}
                  onPress={() => setRelationship(r)}
                >
                  <Text style={[styles.chipText, relationship === r && styles.chipTextSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Input
              label="Date of Birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Blood Group</Text>
            <View style={styles.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.chip, bloodGroup === bg && styles.chipSelected]}
                  onPress={() => setBloodGroup(bg)}
                >
                  <Text style={[styles.chipText, bloodGroup === bg && styles.chipTextSelected]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Is a Caregiver</Text>
                <Text style={styles.switchSub}>Can manage medications on your behalf</Text>
              </View>
              <Switch
                value={isCaregiver}
                onValueChange={setIsCaregiver}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={isCaregiver ? colors.primary : colors.disabled}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Emergency Contact</Text>
                <Text style={styles.switchSub}>Alert first during SOS</Text>
              </View>
              <Switch
                value={emergencyPriority}
                onValueChange={setEmergencyPriority}
                trackColor={{ false: colors.border, true: colors.error + '80' }}
                thumbColor={emergencyPriority ? colors.error : colors.disabled}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button onPress={handleSave} loading={loading} disabled={loading} style={styles.saveBtn}>
              Save Changes
            </Button>
            <Button mode="outlined" onPress={() => router.back()} style={styles.cancelBtn}>
              Cancel
            </Button>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  deleteText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  switchSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  error: { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  saveBtn: { marginTop: 16, marginBottom: 8 },
  cancelBtn: { borderColor: colors.border },
});
