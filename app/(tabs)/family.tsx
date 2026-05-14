import { useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Linking,
  Alert,
  StatusBar,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useFamilyStore } from '../../store';
import { useAppTheme } from '../../hooks/useAppTheme';
import { familyService } from '../../services/familyService';
import { FamilyMember } from '../../types';
import { colors, spacing, radius } from '../../constants/theme';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const REL_COLORS: Record<string, { bg: string; fg: string }> = {
  spouse:      { bg: '#FCE7F3', fg: '#9D174D' },
  child:       { bg: '#DCFCE7', fg: '#14532D' },
  parent:      { bg: '#DBEAFE', fg: '#1E3A8A' },
  sibling:     { bg: '#FEF3C7', fg: '#78350F' },
  grandparent: { bg: '#EDE9FE', fg: '#4C1D95' },
  default:     { bg: colors.fillTertiary, fg: colors.primary },
};

const AVATAR_PALETTE = [colors.primary, '#7C3AED', '#0891B2', '#10B981', '#C2410C', '#B45309'];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Patient: Family list ─────────────────────────────────────────────────────

function MemberCard({
  member,
  onEdit,
  onDelete,
}: {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rel = REL_COLORS[member.relationship] ?? REL_COLORS.default;
  const bg = avatarColor(member.name);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      } as any}
    >
      <View style={{ padding: 16 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: bg + '18',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: bg }}>{initials(member.name)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              {member.name}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
              <View
                style={{
                  backgroundColor: rel.bg,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  borderCurve: 'continuous',
                } as any}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: rel.fg }}>{member.relationship}</Text>
              </View>
              {member.isCaregiver && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: colors.success + '12',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderCurve: 'continuous',
                  } as any}
                >
                  <MaterialCommunityIcons name="shield-check" size={11} color={colors.success} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>Caregiver</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                borderCurve: 'continuous',
                backgroundColor: pressed ? colors.fillSecondary : colors.fillTertiary,
                alignItems: 'center',
                justifyContent: 'center',
              } as any)}
              onPress={onEdit}
            >
              <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                borderCurve: 'continuous',
                backgroundColor: pressed ? colors.error + '18' : colors.error + '0C',
                alignItems: 'center',
                justifyContent: 'center',
              } as any)}
              onPress={onDelete}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.error} />
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 0.5,
            borderTopColor: colors.separator,
            paddingTop: 12,
          }}
        >
          {member.phoneNumber ? (
            <Pressable
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                backgroundColor: pressed ? colors.primary + '14' : colors.primary + '08',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                borderCurve: 'continuous',
              } as any)}
              onPress={() => Linking.openURL(`tel:${member.phoneNumber}`)}
            >
              <MaterialCommunityIcons name="phone" size={15} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                {member.phoneNumber}
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {member.bloodGroup && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.error + '08',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              <MaterialCommunityIcons name="water" size={13} color={colors.error} />
              <Text style={{ fontSize: 12, color: colors.error, fontWeight: '800' }}>{member.bloodGroup}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function PatientFamilyView() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { members, setMembers, isLoading, setIsLoading, removeMember } = useFamilyStore();

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await familyService.getFamilyMembers(userId);
      setMembers(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load family members' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setMembers, setIsLoading]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = (member: FamilyMember) => {
    Alert.alert('Remove Member', `Remove ${member.name} from your family list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await familyService.deleteFamilyMember(member.id);
            removeMember(member.id);
            Toast.show({ type: 'success', text1: `${member.name} removed` });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not remove member' });
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.primary + '12',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
          No family members yet
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Add family members to coordinate care and share health updates with each other.
        </Text>
        <Pressable
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: pressed ? '#006BE6' : colors.primary,
            borderRadius: 14,
            borderCurve: 'continuous',
            paddingHorizontal: 24,
            paddingVertical: 14,
            boxShadow: '0 2px 8px rgba(0,122,255,0.30)',
          } as any)}
          onPress={() => router.push('/family/add')}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Add Family Member</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MemberCard
          member={item}
          onEdit={() => router.push(`/family/${item.id}` as any)}
          onDelete={() => confirmDelete(item)}
        />
      )}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View
          style={{
            backgroundColor: colors.primary + '0A',
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 16,
          } as any}
        >
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.primary, flex: 1, lineHeight: 18 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in your care circle
          </Text>
        </View>
      }
    />
  );
}

// ─── Family Member: Reports ───────────────────────────────────────────────────

const FAMILY_REPORTS = [
  {
    name: 'Mom',
    adherence: 94,
    trend: '+2%',
    trendUp: true,
    lastDose: '8:00 AM',
    status: 'good',
    color: '#34C759',
    medications: 3,
  },
  {
    name: 'Dad',
    adherence: 71,
    trend: '-5%',
    trendUp: false,
    lastDose: 'Missed',
    status: 'warning',
    color: '#FF9500',
    medications: 5,
  },
  {
    name: 'Grandma',
    adherence: 88,
    trend: '+1%',
    trendUp: true,
    lastDose: '9:30 AM',
    status: 'good',
    color: '#34C759',
    medications: 7,
  },
];

const WEEKLY_DATA = [
  { day: 'Mon', pct: 100 },
  { day: 'Tue', pct: 85 },
  { day: 'Wed', pct: 100 },
  { day: 'Thu', pct: 71 },
  { day: 'Fri', pct: 100 },
  { day: 'Sat', pct: 57 },
  { day: 'Sun', pct: 100 },
];

function FamilyReportsView() {
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Weekly overview */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          padding: 18,
          marginBottom: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        } as any}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
          Family Weekly Adherence
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
          Combined average across all members
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {WEEKLY_DATA.map((d) => (
            <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: '100%',
                  height: (d.pct / 100) * 60,
                  backgroundColor: d.pct >= 90 ? '#34C759' : d.pct >= 70 ? '#FF9500' : colors.error,
                  borderRadius: 4,
                  borderCurve: 'continuous',
                } as any}
              />
              <Text style={{ fontSize: 10, color: colors.textTertiary, fontWeight: '600' }}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Per-person cards */}
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        Member Reports
      </Text>
      {FAMILY_REPORTS.map((r) => (
        <View
          key={r.name}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderCurve: 'continuous',
            padding: 16,
            marginBottom: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          } as any}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: r.color + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: r.color }}>{r.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{r.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {r.medications} medications · Last: {r.lastDose}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: r.color }}>{r.adherence}%</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: r.trendUp ? '#34C759' : colors.error,
                }}
              >
                {r.trend} this week
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ height: 6, backgroundColor: colors.fillTertiary, borderRadius: 3 }}>
            <View
              style={{
                width: `${r.adherence}%`,
                height: 6,
                backgroundColor: r.color,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      ))}

      {/* Alerts summary */}
      <View
        style={{
          backgroundColor: colors.error + '08',
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: colors.error + '20',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 4,
        } as any}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.error + '14',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.error} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.error }}>1 Missed Dose Alert</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Dad missed afternoon medication — tap to view details
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </View>
    </Animated.ScrollView>
  );
}

// ─── Caregiver: Patient Outcomes ──────────────────────────────────────────────

const CAREGIVER_OUTCOMES = [
  { name: 'Robert Chen', age: 72, adherence: 88, meds: 6, nextVisit: 'Today 2pm', status: 'stable', color: '#34C759' },
  { name: 'Mary Johnson', age: 65, adherence: 62, meds: 4, nextVisit: 'Tomorrow', status: 'review', color: '#FF9500' },
  { name: 'James Wilson', age: 81, adherence: 95, meds: 8, nextVisit: 'Fri 10am', status: 'excellent', color: '#34C759' },
  { name: 'Linda Park', age: 58, adherence: 45, meds: 3, nextVisit: 'Today 4pm', status: 'critical', color: '#FF3B30' },
];

const STATUS_CHIP: Record<string, { bg: string; fg: string; label: string }> = {
  excellent: { bg: '#DCFCE7', fg: '#14532D', label: 'Excellent' },
  stable:    { bg: '#DBEAFE', fg: '#1E3A8A', label: 'Stable' },
  review:    { bg: '#FEF3C7', fg: '#78350F', label: 'Review' },
  critical:  { bg: '#FEE2E2', fg: '#7F1D1D', label: 'Critical' },
};

function CaregiverOutcomesView() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const avgAdherence = Math.round(
    CAREGIVER_OUTCOMES.reduce((s, p) => s + p.adherence, 0) / CAREGIVER_OUTCOMES.length
  );

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary strip */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Avg Adherence', value: `${avgAdherence}%`, color: '#FF9500', icon: 'chart-line' as const },
          { label: 'Active Patients', value: '4', color: colors.primary, icon: 'account-group-outline' as const },
          { label: 'Need Attention', value: '2', color: colors.error, icon: 'alert-circle-outline' as const },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 14,
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            } as any}
          >
            <MaterialCommunityIcons name={s.icon} size={22} color={s.color} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        Patient Outcomes
      </Text>

      {CAREGIVER_OUTCOMES.map((p) => {
        const chip = STATUS_CHIP[p.status];
        return (
          <Pressable
            key={p.name}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.fillTertiary : colors.surface,
              borderRadius: radius.xl,
              borderCurve: 'continuous',
              padding: 16,
              marginBottom: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            } as any)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: p.color + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: p.color }}>
                  {initials(p.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Age {p.age} · {p.meds} medications
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 5 }}>
                <View
                  style={{
                    backgroundColor: chip.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    borderCurve: 'continuous',
                  } as any}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: chip.fg }}>{chip.label}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{p.nextVisit}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, height: 6, backgroundColor: colors.fillTertiary, borderRadius: 3 }}>
                <View
                  style={{
                    width: `${p.adherence}%`,
                    height: 6,
                    backgroundColor: p.color,
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: p.color, minWidth: 38 }}>
                {p.adherence}%
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Animated.ScrollView>
  );
}

// ─── Doctor: Medical Records ──────────────────────────────────────────────────

const RECORDS_DATA = [
  {
    patient: 'Sarah Connor',
    type: 'Lab Results',
    date: 'May 12, 2026',
    tag: 'CBC Panel',
    icon: 'flask-outline' as const,
    color: '#5856D6',
    urgent: false,
  },
  {
    patient: 'John Carter',
    type: 'Prescription',
    date: 'May 11, 2026',
    tag: 'Renewed',
    icon: 'prescription' as const,
    color: colors.primary,
    urgent: false,
  },
  {
    patient: 'Emma Davis',
    type: 'Imaging',
    date: 'May 10, 2026',
    tag: 'X-Ray',
    icon: 'radiology-box-outline' as const,
    color: '#0891B2',
    urgent: true,
  },
  {
    patient: 'Michael Brown',
    type: 'Consultation Note',
    date: 'May 9, 2026',
    tag: 'Follow-Up',
    icon: 'note-text-outline' as const,
    color: '#FF9500',
    urgent: false,
  },
  {
    patient: 'Linda Park',
    type: 'Referral',
    date: 'May 8, 2026',
    tag: 'Cardiology',
    icon: 'send-outline' as const,
    color: '#FF3B30',
    urgent: true,
  },
];

function DoctorRecordsView() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Search-like filter bar */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginBottom: 18,
        }}
      >
        {['All', 'Labs', 'Imaging', 'Notes'].map((f, i) => (
          <View
            key={f}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: i === 0 ? '#5856D6' : colors.fillTertiary,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: i === 0 ? '#fff' : colors.textSecondary,
              }}
            >
              {f}
            </Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        Recent Records
      </Text>

      {RECORDS_DATA.map((rec) => (
        <Pressable
          key={`${rec.patient}-${rec.type}`}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.fillTertiary : colors.surface,
            borderRadius: radius.xl,
            borderCurve: 'continuous',
            padding: 15,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          } as any)}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              borderCurve: 'continuous',
              backgroundColor: rec.color + '14',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            } as any}
          >
            <MaterialCommunityIcons name={rec.icon} size={22} color={rec.color} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{rec.type}</Text>
              {rec.urgent && (
                <View
                  style={{
                    backgroundColor: colors.error + '12',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.error }}>URGENT</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {rec.patient} · {rec.date}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View
              style={{
                backgroundColor: rec.color + '12',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: rec.color }}>{rec.tag}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
          </View>
        </Pressable>
      ))}

      {/* Upload CTA */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: '#5856D6' + '60',
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          paddingVertical: 16,
          marginTop: 4,
          backgroundColor: pressed ? '#5856D6' + '06' : 'transparent',
        } as any)}
      >
        <MaterialCommunityIcons name="upload-outline" size={18} color="#5856D6" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#5856D6' }}>Upload New Record</Text>
      </Pressable>
    </Animated.ScrollView>
  );
}

// ─── Org Admin: Compliance Reports ───────────────────────────────────────────

const COMPLIANCE_DEPTS = [
  { name: 'Cardiology', compliance: 94, patients: 120, trend: '+3%', trendUp: true },
  { name: 'Oncology', compliance: 87, patients: 84, trend: '-1%', trendUp: false },
  { name: 'Geriatrics', compliance: 91, patients: 210, trend: '+5%', trendUp: true },
  { name: 'Neurology', compliance: 76, patients: 67, trend: '-4%', trendUp: false },
  { name: 'Pediatrics', compliance: 98, patients: 155, trend: '+2%', trendUp: true },
];

function OrgReportsView() {
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const overallCompliance = Math.round(
    COMPLIANCE_DEPTS.reduce((s, d) => s + d.compliance, 0) / COMPLIANCE_DEPTS.length
  );

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero compliance score */}
      <View
        style={{
          backgroundColor: '#FF3B30',
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          padding: 20,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(255,59,48,0.25)',
        } as any}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
            ORGANIZATION COMPLIANCE
          </Text>
          <Text style={{ fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>
            {overallCompliance}%
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Across 636 active patients · May 2026
          </Text>
        </View>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={40} color="#fff" />
        </View>
      </View>

      {/* KPI row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Reports Generated', value: '248', icon: 'file-chart-outline' as const, color: '#FF3B30' },
          { label: 'Dept Reviewed', value: '5 / 5', icon: 'check-circle-outline' as const, color: '#34C759' },
          { label: 'Incidents', value: '3', icon: 'alert-outline' as const, color: '#FF9500' },
        ].map((k) => (
          <View
            key={k.label}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 13,
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            } as any}
          >
            <MaterialCommunityIcons name={k.icon} size={20} color={k.color} style={{ marginBottom: 5 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', color: k.color }}>{k.value}</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
              {k.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Department compliance */}
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
        Department Compliance
      </Text>

      {COMPLIANCE_DEPTS.map((dept) => (
        <View
          key={dept.name}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderCurve: 'continuous',
            padding: 16,
            marginBottom: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          } as any}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 }}>
              {dept.name}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 12 }}>
              {dept.patients} patients
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: dept.trendUp ? '#34C759' : colors.error,
              }}
            >
              {dept.trend}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 8, backgroundColor: colors.fillTertiary, borderRadius: 4 }}>
              <View
                style={{
                  width: `${dept.compliance}%`,
                  height: 8,
                  backgroundColor:
                    dept.compliance >= 90 ? '#34C759' : dept.compliance >= 80 ? '#FF9500' : '#FF3B30',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color:
                  dept.compliance >= 90 ? '#34C759' : dept.compliance >= 80 ? '#FF9500' : '#FF3B30',
                minWidth: 44,
                textAlign: 'right',
              }}
            >
              {dept.compliance}%
            </Text>
          </View>
        </View>
      ))}

      {/* Export CTA */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: pressed ? '#E6002A' : '#FF3B30',
          borderRadius: 14,
          borderCurve: 'continuous',
          paddingVertical: 15,
          marginTop: 8,
          boxShadow: '0 2px 8px rgba(255,59,48,0.30)',
        } as any)}
      >
        <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Export Compliance Report</Text>
      </Pressable>
    </Animated.ScrollView>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

const HEADER_CONFIG = {
  patient:            { title: 'Family Care',       subtitle: 'Manage your medical circle',        addRoute: '/family/add', color: colors.primary },
  family_member:      { title: 'Reports',           subtitle: 'Family health overview',             addRoute: null,          color: '#34C759' },
  caregiver:          { title: 'Reports',           subtitle: 'Patient outcomes & progress',        addRoute: null,          color: '#FF9500' },
  doctor:             { title: 'Records',           subtitle: 'Patient medical documents',          addRoute: null,          color: '#5856D6' },
  organization_admin: { title: 'Compliance',        subtitle: 'Department & organisation reports',  addRoute: null,          color: '#FF3B30' },
};

export default function FamilyScreen() {
  const { userProfile } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const role = userProfile?.role ?? 'patient';
  const cfg = HEADER_CONFIG[role];
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingTop: Platform.OS === 'android' ? 44 : 58,
          paddingBottom: spacing.md,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '700',
              color: colors.text,
              letterSpacing: 0.35,
              lineHeight: 41,
            }}
          >
            {cfg.title}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>
            {cfg.subtitle}
          </Text>
        </View>

        {cfg.addRoute && (
          <Pressable
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed ? cfg.color + 'CC' : cfg.color,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${cfg.color}40`,
            } as any)}
            onPress={() => router.push(cfg.addRoute as any)}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Role content */}
      {role === 'patient'            && <PatientFamilyView />}
      {role === 'family_member'      && <FamilyReportsView />}
      {role === 'caregiver'          && <CaregiverOutcomesView />}
      {role === 'doctor'             && <DoctorRecordsView />}
      {role === 'organization_admin' && <OrgReportsView />}
    </View>
  );
}
