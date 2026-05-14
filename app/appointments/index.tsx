import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore, useAppointmentStore } from '../../store';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentType } from '../../types';
import { colors } from '../../constants/theme';

const TYPE_ICONS: Record<AppointmentType, string> = {
  checkup: '🩺',
  follow_up: '🔄',
  specialist: '👨‍⚕️',
  emergency: '🚨',
  vaccination: '💉',
};

const TYPE_COLORS: Record<AppointmentType, string> = {
  checkup: colors.primary,
  follow_up: colors.secondary,
  specialist: colors.accent,
  emergency: colors.error,
  vaccination: colors.success,
};

function AppointmentCard({
  appt,
  onComplete,
  onCancel,
}: {
  appt: Appointment;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const color = TYPE_COLORS[appt.type];
  return (
    <Card style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.typeIcon}>{TYPE_ICONS[appt.type]}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{appt.title}</Text>
            {appt.doctorName ? <Text style={styles.cardMeta}>Dr. {appt.doctorName}</Text> : null}
            {appt.clinicName ? <Text style={styles.cardMeta}>{appt.clinicName}</Text> : null}
          </View>
          <View style={styles.cardDateBox}>
            <Text style={styles.cardDate}>{appt.appointmentDate}</Text>
            <Text style={styles.cardTime}>{appt.appointmentTime}</Text>
          </View>
        </View>
        {appt.notes ? <Text style={styles.cardNotes}>{appt.notes}</Text> : null}
        {appt.status === 'scheduled' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.completeBtn} onPress={onComplete}>
              <Text style={styles.completeBtnText}>✓ Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        {appt.status !== 'scheduled' && (
          <View style={[styles.statusBadge, { backgroundColor: appt.status === 'completed' ? colors.success + '20' : colors.error + '20' }]}>
            <Text style={[styles.statusText, { color: appt.status === 'completed' ? colors.success : colors.error }]}>
              {appt.status.toUpperCase()}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { appointments, setAppointments, updateAppointment } = useAppointmentStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [upcoming, past] = await Promise.all([
        appointmentService.getUpcomingAppointments(userId),
        appointmentService.getPastAppointments(userId),
      ]);
      setAppointments([...upcoming, ...past]);
    } catch { /* silent */ }
    setLoading(false);
  }, [userId, setAppointments]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async (appt: Appointment) => {
    await appointmentService.completeAppointment(appt.id);
    updateAppointment({ ...appt, status: 'completed' });
    Toast.show({ type: 'success', text1: 'Marked as completed' });
  };

  const handleCancel = (appt: Appointment) => {
    Alert.alert('Cancel Appointment', 'Mark this appointment as cancelled?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await appointmentService.cancelAppointment(appt.id);
          updateAppointment({ ...appt, status: 'cancelled' });
          Toast.show({ type: 'success', text1: 'Appointment cancelled' });
        },
      },
    ]);
  };

  const today = new Date().toISOString().split('T')[0];
  const displayed = appointments.filter((a) =>
    tab === 'upcoming'
      ? a.appointmentDate >= today && a.status === 'scheduled'
      : a.appointmentDate < today || a.status !== 'scheduled'
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['upcoming', 'past'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appt={item}
            onComplete={() => handleComplete(item)}
            onCancel={() => handleCancel(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No {tab} appointments</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push('/appointments/add')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
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
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  list: { padding: 16, paddingBottom: 80 },
  card: { borderRadius: 14, elevation: 2, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { fontSize: 28, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardDateBox: { alignItems: 'flex-end' },
  cardDate: { fontSize: 13, fontWeight: '700', color: colors.text },
  cardTime: { fontSize: 12, color: colors.textSecondary },
  cardNotes: { fontSize: 13, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  completeBtn: { flex: 1, backgroundColor: colors.success + '20', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  completeBtnText: { color: colors.success, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: colors.error + '15', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: colors.error, fontWeight: '700' },
  statusBadge: { marginTop: 10, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: colors.textSecondary },
  fab: { position: 'absolute', right: 20, backgroundColor: colors.primary },
});
