import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input, Card } from '../../components';
import { useAuthStore, useAppointmentStore } from '../../store';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentType } from '../../types';
import { colors } from '../../constants/theme';

const TYPES: { value: AppointmentType; label: string; icon: string }[] = [
  { value: 'checkup', label: 'Checkup', icon: '🩺' },
  { value: 'follow_up', label: 'Follow-up', icon: '🔄' },
  { value: 'specialist', label: 'Specialist', icon: '👨‍⚕️' },
  { value: 'emergency', label: 'Emergency', icon: '🚨' },
  { value: 'vaccination', label: 'Vaccination', icon: '💉' },
];

export default function AddAppointmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { addAppointment } = useAppointmentStore();

  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<AppointmentType>('checkup');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!date.trim()) { setError('Date is required (YYYY-MM-DD)'); return; }
    if (!time.trim()) { setError('Time is required (HH:MM)'); return; }
    if (!userId) return;

    setLoading(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const appt: Appointment = {
        id: `appt-${userId}-${Date.now()}`,
        userId,
        title: title.trim(),
        doctorName: doctorName.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        appointmentDate: date.trim(),
        appointmentTime: time.trim(),
        type,
        notes: notes.trim() || undefined,
        reminderMinutes: 60,
        status: 'scheduled',
        location: location.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        localOnly: true,
      };

      await appointmentService.addAppointment(appt);
      addAppointment(appt);
      Toast.show({ type: 'success', text1: 'Appointment saved!', text2: title });
      router.back();
    } catch {
      setError('Failed to save appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>New Appointment</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card>
            <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. Annual Checkup" style={styles.input} />
            <Input label="Doctor Name" value={doctorName} onChangeText={setDoctorName} style={styles.input} />
            <Input label="Clinic / Hospital" value={clinicName} onChangeText={setClinicName} style={styles.input} />

            <View style={styles.row}>
              <Input
                label="Date * (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                placeholder="2025-03-20"
                keyboardType="numeric"
                style={[styles.input, styles.half]}
              />
              <Input
                label="Time * (HH:MM)"
                value={time}
                onChangeText={setTime}
                placeholder="10:30"
                keyboardType="numeric"
                style={[styles.input, styles.half]}
              />
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, type === t.value && styles.typeChipSelected]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, type === t.value && styles.typeLabelSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Location / Address" value={location} onChangeText={setLocation} style={styles.input} />
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={styles.input} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button onPress={handleSave} loading={loading} disabled={loading} style={styles.saveBtn}>
              Save Appointment
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
  back: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  typeIcon: { fontSize: 14 },
  typeLabel: { fontSize: 13, color: colors.textSecondary },
  typeLabelSelected: { color: colors.primary, fontWeight: '600' },
  error: { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  saveBtn: { marginTop: 8, marginBottom: 8 },
  cancelBtn: { borderColor: colors.border },
});
