import { useEffect, useCallback, useState } from 'react';
import { View, FlatList, Pressable, Alert, StatusBar, Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useAppointmentStore } from '../../store';
import { appointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentType } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TYPE_DATA: Record<AppointmentType, { icon: MCIName; color: string; label: string }> = {
  checkup:     { icon: 'stethoscope',      color: '#007AFF', label: 'Check-up'    },
  follow_up:   { icon: 'calendar-refresh', color: '#5856D6', label: 'Follow-up'   },
  specialist:  { icon: 'account-heart',    color: '#FF9500', label: 'Specialist'  },
  emergency:   { icon: 'alarm-light',      color: '#FF3B30', label: 'Emergency'   },
  vaccination: { icon: 'needle',           color: '#34C759', label: 'Vaccination' },
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const { colors: c, isDark } = useAppTheme();
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
    } catch {}
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
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        await appointmentService.cancelAppointment(appt.id);
        updateAppointment({ ...appt, status: 'cancelled' });
        Toast.show({ type: 'success', text1: 'Appointment cancelled' });
      }},
    ]);
  };

  const today = new Date().toISOString().split('T')[0];
  const displayed = appointments.filter((a) =>
    tab === 'upcoming'
      ? a.appointmentDate >= today && a.status === 'scheduled'
      : a.appointmentDate < today || a.status !== 'scheduled'
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'android' ? 44 : 58, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 }}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={c.primary} />
          <Text style={{ fontSize: 16, color: c.primary, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 32, fontWeight: '800', color: c.text, letterSpacing: -0.8 }}>Appointments</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 2 }}>{displayed.length} {tab}</Text>
      </View>

      {/* Segment control */}
      <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: c.fillTertiary, borderRadius: 12, padding: 3, flexDirection: 'row' }}>
        {(['upcoming', 'past'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: tab === t ? c.surface : 'transparent' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: tab === t ? c.text : c.textSecondary }}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Appointment cards */}
      <FlatList
        data={displayed}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        renderItem={({ item: appt }) => {
          const td = TYPE_DATA[appt.type];
          return (
            <View style={{ backgroundColor: c.surface, borderRadius: 18, marginBottom: 12, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: td.color + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MaterialCommunityIcons name={td.icon} size={22} color={td.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 2 }}>{appt.title}</Text>
                  {appt.doctorName ? <Text style={{ fontSize: 13, color: c.textSecondary }}>Dr. {appt.doctorName}</Text> : null}
                  {appt.clinicName ? <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 1 }}>{appt.clinicName}</Text> : null}
                  {appt.notes ? <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 6, lineHeight: 17 }}>{appt.notes}</Text> : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <View style={{ backgroundColor: td.color + '14', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: td.color }}>{td.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: c.text }}>{appt.appointmentDate}</Text>
                  <Text style={{ fontSize: 14, color: c.primary, fontWeight: '700' }}>{appt.appointmentTime}</Text>
                </View>
              </View>

              {appt.status === 'scheduled' ? (
                <View style={{ flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: c.separator }}>
                  <Pressable
                    onPress={() => handleComplete(appt)}
                    style={({ pressed }) => ({ flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: pressed ? '#34C75910' : 'transparent' })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#34C759' }}>Complete</Text>
                  </Pressable>
                  <View style={{ width: 0.5, backgroundColor: c.separator }} />
                  <Pressable
                    onPress={() => handleCancel(appt)}
                    style={({ pressed }) => ({ flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: pressed ? '#FF3B3010' : 'transparent' })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF3B30' }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ borderTopWidth: 0.5, borderTopColor: c.separator, paddingHorizontal: 16, paddingVertical: 11 }}>
                  <View style={{ backgroundColor: (appt.status === 'completed' ? '#34C759' : '#FF3B30') + '14', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: appt.status === 'completed' ? '#34C759' : '#FF3B30', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {appt.status}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 64, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#007AFF14', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={36} color="#007AFF" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>No {tab} appointments</Text>
            <Text style={{ fontSize: 14, color: c.textSecondary }}>Tap + to schedule one</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/appointments/add')}
        style={({ pressed }) => ({
          position: 'absolute', bottom: 110, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: pressed ? c.primary + 'DD' : c.primary,
          alignItems: 'center', justifyContent: 'center',
        })}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
