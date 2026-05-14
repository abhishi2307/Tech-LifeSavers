import { useEffect, useRef, useCallback } from 'react';
import {
  View, ScrollView, Pressable, Text, Animated, Platform, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useAdherenceStore } from '../../store';
import { useAppTheme } from '../../hooks/useAppTheme';
import { medicationService } from '../../services/medicationService';
import { UserRole } from '../../types';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function scoreColor(pct: number) {
  if (pct >= 80) return '#30B050';
  if (pct >= 60) return '#007AFF';
  if (pct >= 40) return '#FF9500';
  return '#FF3B30';
}
function scoreLabel(pct: number) {
  if (pct >= 80) return 'On Track';
  if (pct >= 60) return 'Building';
  if (pct >= 40) return 'Improving';
  if (pct === 0) return 'Get Started';
  return 'Needs Focus';
}

function ScoreRing({ pct, size, color, bg }: { pct: number; size: number; color: string; bg: string }) {
  const sw = Math.round(size * 0.09);
  const deg1 = Math.min((pct / 100) * 360, 180);
  const deg2 = Math.max((pct / 100 - 0.5) * 360, 0);
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: sw, borderColor: color + '18' }} />
      <View style={{ position: 'absolute', width: size / 2, height: size, left: size / 2, overflow: 'hidden' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: sw, borderColor: pct > 0 ? color : color + '18', left: -(size / 2), transform: [{ rotate: `${deg1}deg` }] }} />
      </View>
      {pct > 50 && (
        <View style={{ position: 'absolute', width: size / 2, height: size, left: 0, overflow: 'hidden' }}>
          <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: sw, borderColor: color, transform: [{ rotate: `${deg2}deg` }] }} />
        </View>
      )}
      <View style={{ position: 'absolute', top: sw, left: sw, right: sw, bottom: sw, borderRadius: (size - sw * 2) / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.26, fontWeight: '800', color, letterSpacing: -1 }}>{pct}%</Text>
        <Text style={{ fontSize: size * 0.1, color: color + 'AA', fontWeight: '600', letterSpacing: 0.3, marginTop: 1 }}>{scoreLabel(pct)}</Text>
      </View>
    </View>
  );
}

// ─── Patient ─────────────────────────────────────────────────────────────────

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOCK_DAYS = [100, 75, 100, 50, 100, 100, 83];

const TIPS: { icon: MCIName; color: string; title: string; body: string }[] = [
  { icon: 'bell-ring-outline',   color: '#007AFF', title: 'Morning Reminder',   body: 'Most missed doses happen before 10 AM. Try setting a backup alarm.' },
  { icon: 'food-apple-outline',  color: '#34C759', title: 'Take With Food',     body: 'Taking medication with meals improves absorption and comfort.' },
  { icon: 'water-outline',       color: '#5AC8FA', title: 'Stay Hydrated',      body: 'A full glass of water with each dose aids faster absorption.' },
  { icon: 'clock-check-outline', color: '#FF9500', title: 'Consistent Timing',  body: 'Same time daily keeps medication levels stable in your body.' },
];

function PatientAdherenceView({ c }: { c: any }) {
  const { userId } = useAuthStore();
  const { stats, setStats } = useAdherenceStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!userId) return;
    try { setStats(await medicationService.getAdherenceStats(userId)); } catch {}
  }, [userId, setStats]);

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, []);

  const pct = Math.round(stats?.adherencePercentage ?? 0);
  const taken = stats?.totalTaken ?? 0;
  const missed = stats?.totalMissed ?? 0;
  const scheduled = (stats as any)?.totalScheduled ?? 0;
  const streak = (stats as any)?.currentStreak ?? 0;
  const thisWeek = (stats as any)?.weeklyTaken ?? 0;
  const ring = scoreColor(pct);

  return (
    <Animated.ScrollView
      style={{ opacity: fadeAnim }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}
    >
      {/* Score card (white + colored ring) */}
      <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 22, marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: c.textTertiary, letterSpacing: 0.8, marginBottom: 20 }}>
          LAST 30 DAYS
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
          <ScoreRing pct={pct} size={120} color={ring} bg={c.surface} />
          <View style={{ flex: 1, gap: 14 }}>
            {[
              { color: '#34C759', label: `${taken} Taken` },
              { color: '#FF3B30', label: `${missed} Missed` },
              { color: c.textTertiary, label: `${scheduled} Scheduled` },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                <Text style={{ fontSize: 15, color: c.text, fontWeight: '500' }}>{row.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ marginTop: 20 }}>
          <View style={{ height: 4, backgroundColor: c.fillTertiary, borderRadius: 2 }}>
            <View style={{ height: 4, width: `${pct}%`, borderRadius: 2, backgroundColor: ring }} />
          </View>
        </View>
      </View>

      {/* KPIs */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Day Streak',  value: streak,    icon: 'fire' as MCIName,           color: '#FF9500' },
          { label: 'This Week',   value: thisWeek,  icon: 'check-circle' as MCIName,   color: '#34C759' },
          { label: 'Scheduled',   value: scheduled, icon: 'calendar-check' as MCIName, color: '#007AFF' },
        ].map((k) => (
          <View key={k.label} style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name={k.icon} size={22} color={k.color} />
            <Text style={{ fontSize: 24, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{k.value}</Text>
            <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{k.label}</Text>
          </View>
        ))}
      </View>

      {/* Weekly dots */}
      <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 16 }}>This Week</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {WEEK.map((day, i) => {
            const val = MOCK_DAYS[i] ?? 0;
            const dotColor = val >= 90 ? '#34C759' : val >= 60 ? '#007AFF' : val > 0 ? '#FF9500' : c.fillTertiary;
            return (
              <View key={`${day}-${i}`} style={{ alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: val > 0 ? dotColor + '18' : c.fillTertiary,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {val > 0
                    ? <MaterialCommunityIcons name="check" size={16} color={dotColor} />
                    : <Text style={{ fontSize: 14, color: c.textTertiary }}>–</Text>
                  }
                </View>
                <Text style={{ fontSize: 12, color: c.textSecondary, fontWeight: '500' }}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips */}
      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 12 }}>
        Recommendations
      </Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {TIPS.map((tip, i) => (
          <View key={tip.title}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tip.color + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <MaterialCommunityIcons name={tip.icon} size={17} color={tip.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 3 }}>{tip.title}</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 18 }}>{tip.body}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Animated.ScrollView>
  );
}

// ─── Family Member: Alerts ────────────────────────────────────────────────────

const ALERTS = [
  { name: 'Mom',    med: 'Metformin 500mg',   type: 'Missed',   time: '9:00 AM',  color: '#FF3B30' },
  { name: 'Dad',    med: 'Lisinopril 10mg',   type: 'Delayed',  time: '12:00 PM', color: '#FF9500' },
  { name: 'Grandma',med: 'Amlodipine 5mg',   type: 'Upcoming', time: '6:00 PM',  color: '#007AFF' },
];

function FamilyAlertsView({ c }: { c: any }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}>
      {/* Summary strip */}
      <View style={{ backgroundColor: c.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          {[{ label: 'Critical', value: 1, color: '#FF3B30' }, { label: 'Warnings', value: 1, color: '#FF9500' }, { label: 'On Track', value: 1, color: '#34C759' }].map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4,
              borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: c.separator }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 12 }}>Active Alerts</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
        {ALERTS.map((a, i) => (
          <View key={`${a.name}-${a.med}`}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: a.color + '14', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: a.color }}>{a.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{a.name}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{a.med} · {a.time}</Text>
              </View>
              <View style={{ backgroundColor: a.color + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: a.color }}>{a.type}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={({ pressed }) => ({
        backgroundColor: pressed ? '#DC2626' : '#EF4444',
        borderRadius: 16, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, paddingVertical: 16,
      })}>
        <MaterialCommunityIcons name="alarm-light" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Emergency SOS</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Caregiver: Schedule ──────────────────────────────────────────────────────

const SCHEDULE = [
  { patient: 'Robert Chen',  med: 'Metformin 500mg',    time: '08:00', status: 'given',   color: '#34C759' },
  { patient: 'Mary Johnson', med: 'Lisinopril 10mg',    time: '10:00', status: 'pending', color: '#FF9500' },
  { patient: 'James Wilson', med: 'Atorvastatin 20mg',  time: '12:00', status: 'given',   color: '#34C759' },
  { patient: 'Linda Park',   med: 'Aspirin 81mg',       time: '14:00', status: 'pending', color: '#FF3B30' },
  { patient: 'Robert Chen',  med: 'Insulin Glargine',   time: '18:00', status: 'pending', color: '#FF9500' },
];

function CaregiverScheduleView({ c }: { c: any }) {
  const given = SCHEDULE.filter(d => d.status === 'given').length;
  const pending = SCHEDULE.filter(d => d.status === 'pending').length;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          {[{ label: 'Given', value: given, color: '#34C759' }, { label: 'Pending', value: pending, color: '#FF9500' }, { label: 'Patients', value: 4, color: '#007AFF' }].map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4,
              borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: c.separator }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 12 }}>Dose Schedule</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {SCHEDULE.map((row, i) => (
          <View key={`${row.patient}-${row.time}`}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 54 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.primary, width: 42 }}>{row.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{row.patient}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{row.med}</Text>
              </View>
              <View style={{ backgroundColor: row.color + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: row.color, textTransform: 'capitalize' }}>{row.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Doctor: Appointments ─────────────────────────────────────────────────────

const APPTS = [
  { patient: 'Sarah Connor',  initials: 'SC', time: '09:00', type: 'Follow-Up',    color: '#007AFF', duration: '30 min' },
  { patient: 'John Carter',   initials: 'JC', time: '10:30', type: 'Consultation', color: '#5856D6', duration: '45 min' },
  { patient: 'Emma Davis',    initials: 'ED', time: '12:00', type: 'Lab Review',   color: '#34C759', duration: '20 min' },
  { patient: 'Michael Brown', initials: 'MB', time: '14:30', type: 'New Patient',  color: '#FF9500', duration: '60 min' },
];

function DoctorAppointmentsView({ c }: { c: any }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          {[{ label: 'Today', value: APPTS.length, color: '#007AFF' }, { label: 'Pending', value: 3, color: '#FF9500' }, { label: 'Done', value: 1, color: '#34C759' }].map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4,
              borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: c.separator }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 12 }}>Appointments</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {APPTS.map((a, i) => (
          <View key={a.patient}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <Pressable style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
              backgroundColor: pressed ? c.fillTertiary : 'transparent',
            })}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: a.color + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: a.color }}>{a.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{a.patient}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{a.time} · {a.duration}</Text>
              </View>
              <View style={{ backgroundColor: a.color + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: a.color }}>{a.type}</Text>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Org: Analytics ──────────────────────────────────────────────────────────

const DEPTS = [
  { name: 'Cardiology', pct: 94, up: true },
  { name: 'Oncology',   pct: 87, up: false },
  { name: 'Geriatrics', pct: 91, up: true },
  { name: 'Neurology',  pct: 76, up: false },
  { name: 'Pediatrics', pct: 98, up: true },
];

function OrgAnalyticsView({ c }: { c: any }) {
  const avg = Math.round(DEPTS.reduce((s, d) => s + d.pct, 0) / DEPTS.length);
  const ring = avg >= 90 ? '#30B050' : avg >= 70 ? '#007AFF' : '#FF9500';
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 }}>
      <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 22, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <ScoreRing pct={avg} size={100} color={ring} bg={c.surface} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: c.textTertiary, letterSpacing: 0.8, marginBottom: 6 }}>ORGANISATION COMPLIANCE</Text>
          <Text style={{ fontSize: 44, fontWeight: '900', color: c.text, letterSpacing: -2 }}>{avg}%</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>636 active patients · May 2026</Text>
        </View>
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          {[{ label: 'Reports', value: '248', color: '#FF3B30' }, { label: 'Depts', value: '5/5', color: '#34C759' }, { label: 'Incidents', value: '3', color: '#FF9500' }].map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4,
              borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: c.separator }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3, marginBottom: 12 }}>Department Compliance</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {DEPTS.map((d, i) => {
          const bar = d.pct >= 90 ? '#34C759' : d.pct >= 80 ? '#007AFF' : '#FF3B30';
          return (
            <View key={d.name}>
              {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator }} />}
              <View style={{ padding: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: c.text, flex: 1 }}>{d.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: d.up ? '#34C759' : '#FF3B30', marginRight: 12 }}>{d.up ? '↑' : '↓'}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: bar }}>{d.pct}%</Text>
                </View>
                <View style={{ height: 4, backgroundColor: c.fillTertiary, borderRadius: 2 }}>
                  <View style={{ height: 4, width: `${d.pct}%`, borderRadius: 2, backgroundColor: bar }} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TITLES: Record<UserRole, { title: string; sub: string }> = {
  patient:            { title: 'Health Insights',  sub: 'Medication adherence overview' },
  family_member:      { title: 'Alerts',            sub: 'Family medication status' },
  caregiver:          { title: 'Schedule',          sub: 'Today\'s dose administration' },
  doctor:             { title: 'Appointments',      sub: 'Today\'s patient schedule' },
  organization_admin: { title: 'Analytics',         sub: 'Compliance & performance' },
};

export default function AdherenceScreen() {
  const { colors: c, isDark } = useAppTheme();
  const { userProfile } = useAuthStore();
  const role: UserRole = userProfile?.role ?? 'patient';
  const { title, sub } = TITLES[role];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 58, paddingBottom: 12 }}>
        <Text style={{ fontSize: 34, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>{title}</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>{sub}</Text>
      </View>
      {role === 'patient'            && <PatientAdherenceView c={c} />}
      {role === 'family_member'      && <FamilyAlertsView c={c} />}
      {role === 'caregiver'          && <CaregiverScheduleView c={c} />}
      {role === 'doctor'             && <DoctorAppointmentsView c={c} />}
      {role === 'organization_admin' && <OrgAnalyticsView c={c} />}
    </View>
  );
}
