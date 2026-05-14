import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, ScrollView, Pressable, RefreshControl,
  StatusBar, Platform, Animated, Text, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import {
  useAuthStore, useMedicationStore, useAdherenceStore, useFamilyStore,
} from '../../store';
import { medicationService } from '../../services/medicationService';
import { useStockMonitor } from '../../hooks/useStockMonitor';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Medicine, UserRole } from '../../types';
import { spacing, radius, shadows } from '../../constants/theme';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Reminder = { medicine: Medicine; timing: string; scheduledTime: string };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
}

function todayStr() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ─── Quick action tile ────────────────────────────────────────────────────────

function ActionTile({ icon, label, color, onPress, c }: { icon: MCIName; label: string; color: string; onPress: () => void; c: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, backgroundColor: pressed ? c.fillSecondary : c.surface,
        borderRadius: 20, paddingVertical: 18, alignItems: 'center', gap: 10,
        ...shadows.sm,
      })}
    >
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: color + '12', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: c.text, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

// ─── Dose row ─────────────────────────────────────────────────────────────────

const TIMING_COLOR: Record<string, string> = { morning: '#FF9500', afternoon: '#30B050', evening: '#5856D6', night: '#007AFF' };

function DoseRow({ item, index, onTake, c }: { item: Reminder; index: number; onTake: () => void; c: any }) {
  const h = parseInt(item.scheduledTime?.split(':')[0] ?? '8', 10);
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 20 ? 'evening' : 'night';
  const accent = TIMING_COLOR[period];
  return (
    <View>
      {index > 0 && <View style={{ height: 1, backgroundColor: c.borderLight, marginLeft: 68 }} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: c.primary, width: 54 }}>{item.timing}</Text>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: accent + '12', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MaterialCommunityIcons name="pill" size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{item.medicine.name}</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{item.medicine.dosage} · {item.medicine.instructions ?? 'Take with water'}</Text>
        </View>
        <Pressable
          onPress={onTake}
          style={({ pressed }) => ({
            paddingHorizontal: 16, paddingVertical: 8,
            backgroundColor: pressed ? c.primary + 'CC' : c.primary,
            borderRadius: 20,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Take</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Dashboard Header ───

function DashboardHeader({ firstName, router, c }: { firstName: string, router: any, c: any }) {
  return (
    <View style={[styles.header, { backgroundColor: c.primary }]}>
      <View style={{ paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 50 : 64, paddingBottom: 80 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.headerGreeting}>{greeting()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={styles.headerName}>{firstName} 👋</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/sos')}
              style={({ pressed }) => [styles.headerSOS, { opacity: pressed ? 0.9 : 1 }]}
            >
              <MaterialCommunityIcons name="alarm-light" size={18} color="#fff" />
              <Text style={styles.headerSOSText}>SOS</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={({ pressed }) => [styles.headerSettings, { opacity: pressed ? 0.8 : 1 }]}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Patient dashboard ────────────────────────────────────────────────────────

function PatientDashboard({ loading, refreshing, reminders, onRefresh, onTake, router, activeMedCount, adherencePct, streak, members, hasAlerts, firstName, c }: {
  loading: boolean; refreshing: boolean; reminders: Reminder[]; onRefresh: () => void; onTake: (r: Reminder) => void;
  router: any; activeMedCount: number; adherencePct: number; streak: number; members: any[]; hasAlerts: boolean; firstName: string; c: any;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const ACTIONS: { icon: MCIName; label: string; color: string; route: string }[] = [
    { icon: 'plus',                 label: 'Add Med',  color: '#007AFF', route: '/medications/add' },
    { icon: 'camera-outline',      label: 'Scan Rx',  color: '#5856D6', route: '/ocr' },
    { icon: 'robot-outline',       label: 'AI Chat',  color: '#FF9500', route: '/chatbot' },
    { icon: 'account-group-outline',label:'Family',   color: '#34C759', route: '/(tabs)/family' },
  ];

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      <DashboardHeader firstName={firstName} router={router} c={c} />

      {/* ── Summary Overlapping Card ── */}
      <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
        {[
          { icon: 'pill' as MCIName, color: '#007AFF', label: 'Active Meds', value: `${activeMedCount}` },
          { icon: 'reload' as MCIName, color: '#34C759', label: 'Adherence', value: `${Math.round(adherencePct)}%` },
          { icon: 'account-group' as MCIName, color: '#FF9500', label: 'Family', value: `${members.length}` },
        ].map((stat, i) => (
          <View key={stat.label} style={[styles.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.borderLight }]}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '12' }]}>
              <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: c.textTertiary }]}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Quick Actions ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 28, marginTop: 12 }}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {ACTIONS.map((a) => (
            <ActionTile key={a.label} icon={a.icon} label={a.label} color={a.color} onPress={() => router.push(a.route as any)} c={c} />
          ))}
        </View>
      </View>

      {/* ── Today's Schedule ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 0 }]}>Today's Schedule</Text>
            <Text style={{ fontSize: 13, color: c.textTertiary, marginTop: 2 }}>{todayStr()}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/medications')} hitSlop={12}>
            <Text style={{ fontSize: 15, color: c.primary, fontWeight: '700' }}>View All</Text>
          </Pressable>
        </View>
        <View style={[styles.scheduleCard, { backgroundColor: c.surface }]}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: c.textSecondary }}>Loading schedule...</Text>
            </View>
          ) : reminders.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#34C75912', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="check-all" size={32} color="#34C759" />
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>You're all set!</Text>
                <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', marginTop: 4 }}>No pending doses for the rest of today.</Text>
              </View>
            </View>
          ) : (
            reminders.slice(0, 5).map((item, i) => (
              <DoseRow key={i} item={item} index={i} onTake={() => onTake(item)} c={c} />
            ))
          )}
        </View>
      </View>

      {/* ── AI Insight ── */}
      <Pressable
        onPress={() => router.push('/chatbot')}
        style={({ pressed }) => ({
          marginHorizontal: 20, backgroundColor: pressed ? c.fillSecondary : c.primary + '08',
          borderRadius: 24, padding: 20, flexDirection: 'row', gap: 16,
          alignItems: 'center', borderWidth: 1, borderColor: c.primary + '15',
        })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="robot" size={24} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: c.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>AI Health Insight</Text>
          <Text style={{ fontSize: 14, color: c.textSecondary, lineHeight: 20, fontWeight: '500' }}>
            {adherencePct >= 80 ? 'Great consistency! Your adherence is strong. Keep the momentum going.'
              : adherencePct > 0 ? 'Setting timely reminders can boost your consistency this week.'
              : 'Add your medications to unlock personalised health insights.'}
          </Text>
        </View>
      </Pressable>
    </Animated.ScrollView>
  );
}

// ─── Role Hub (non-patient) ───────────────────────────────────────────────────

function RoleHubView({ role, router, activeMedCount, adherencePct, members, refreshing, onRefresh, firstName, c }: {
  role: UserRole; router: any; activeMedCount: number; adherencePct: number;
  members: any[]; refreshing: boolean; onRefresh: () => void; firstName: string; c: any;
}) {
  const ACTIONS = {
    family_member:      [{ icon: 'account-group' as MCIName, color: '#30B050', label: 'Family',    route: '/(tabs)/family' }, { icon: 'bell' as MCIName, color: '#FF9500', label: 'Alerts', route: '/(tabs)/adherence' }, { icon: 'robot' as MCIName, color: '#5856D6', label: 'AI Chat', route: '/chatbot' }, { icon: 'folder-open' as MCIName, color: '#007AFF', label: 'Reports', route: '/reports' }],
    caregiver:          [{ icon: 'account-heart' as MCIName, color: '#FF9500', label: 'Patients',  route: '/(tabs)/family' }, { icon: 'pill' as MCIName, color: '#007AFF', label: 'Meds', route: '/(tabs)/medications' }, { icon: 'calendar-clock' as MCIName, color: '#30B050', label: 'Schedule', route: '/appointments' }, { icon: 'folder-open' as MCIName, color: '#5856D6', label: 'Reports', route: '/reports' }],
    doctor:             [{ icon: 'account-group' as MCIName, color: '#5856D6', label: 'Patients',  route: '/(tabs)/family' }, { icon: 'calendar-clock' as MCIName, color: '#007AFF', label: 'Appts', route: '/appointments' }, { icon: 'camera' as MCIName, color: '#30B050', label: 'Scan Rx', route: '/ocr' }, { icon: 'robot' as MCIName, color: '#FF9500', label: 'AI Chat', route: '/chatbot' }],
    organization_admin: [{ icon: 'account-group' as MCIName, color: '#FF3B30', label: 'Team',      route: '/(tabs)/family' }, { icon: 'chart-box' as MCIName, color: '#007AFF', label: 'Analytics', route: '/(tabs)/adherence' }, { icon: 'folder-open' as MCIName, color: '#30B050', label: 'Reports', route: '/reports' }, { icon: 'cog' as MCIName, color: '#5856D6', label: 'Settings', route: '/(tabs)/more' }],
  }[role] ?? [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      contentContainerStyle={{ paddingBottom: 110 }}
    >
      <DashboardHeader firstName={firstName} router={router} c={c} />

      <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
        {[
          { icon: 'account-group' as MCIName, color: '#5856D6', label: role === 'organization_admin' ? 'Team' : 'Patients', value: `${members.length}` },
          { icon: 'pill' as MCIName, color: '#007AFF', label: 'Active', value: `${activeMedCount}` },
          { icon: 'chart-box' as MCIName, color: '#30B050', label: 'Compliance', value: `${Math.round(adherencePct)}%` },
        ].map((stat, i) => (
          <View key={stat.label} style={[styles.statItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.borderLight }]}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '12' }]}>
              <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: c.textTertiary }]}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {ACTIONS.map((a) => (
            <ActionTile key={a.label} icon={a.icon} label={a.label} color={a.color} onPress={() => router.push(a.route as any)} c={c} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { colors: c, isDark } = useAppTheme();
  const { userProfile, userId } = useAuthStore();
  const { medicines, setMedicines } = useMedicationStore();
  const { stats, setStats } = useAdherenceStore();
  const { members } = useFamilyStore();
  const { hasAlerts } = useStockMonitor();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = userProfile?.firstName || 'Aanchal';
  const role: UserRole = userProfile?.role ?? 'patient';
  const activeMedCount = medicines.filter((m) => m.isActive).length;
  const adherencePct = stats?.adherencePercentage ?? 0;
  const streak = (stats as any)?.streakDays ?? 0;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [meds, adherenceStats, upcoming] = await Promise.all([
        medicationService.getActiveMedicines(userId),
        medicationService.getAdherenceStats(userId),
        medicationService.getUpcomingReminders(userId),
      ]);
      setMedicines(meds);
      setStats(adherenceStats);
      setReminders(upcoming as Reminder[]);
    } catch {}
  }, [userId, setMedicines, setStats]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTake = async (item: Reminder) => {
    if (!userId) return;
    try {
      await medicationService.markAsTaken(item.medicine.id, item.timing);
      Toast.show({ type: 'success', text1: 'Dose Recorded', text2: `${item.medicine.name} marked taken` });
      loadData();
    } catch {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {role === 'patient' ? (
        <PatientDashboard
          loading={loading} refreshing={refreshing} reminders={reminders}
          onRefresh={onRefresh} onTake={handleTake} router={router}
          activeMedCount={activeMedCount} adherencePct={adherencePct}
          streak={streak} members={members} hasAlerts={hasAlerts} firstName={firstName} c={c}
        />
      ) : (
        <RoleHubView
          role={role} router={router} activeMedCount={activeMedCount}
          adherencePct={adherencePct} members={members}
          refreshing={refreshing} onRefresh={onRefresh} firstName={firstName} c={c}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  headerName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  headerSOS: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerSOSText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSettings: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -45, // Overlap
    borderRadius: 24,
    paddingVertical: 24,
    ...shadows.lg,
    zIndex: 10,
    elevation: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  scheduleCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.md,
    elevation: 4,
  },
});
