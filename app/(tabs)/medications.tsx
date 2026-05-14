import { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, Pressable, Alert, Text, Platform, StatusBar, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useMedicationStore, useFamilyStore } from '../../store';
import { useAppTheme } from '../../hooks/useAppTheme';
import { medicationService } from '../../services';
import { familyService } from '../../services/familyService';
import { Medicine, MedicineType, UserRole, FamilyMember } from '../../types';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TYPE_ICONS: Record<MedicineType, MCIName> = {
  tablet: 'pill', capsule: 'pill', syrup: 'bottle-tonic-outline',
  liquid: 'bottle-tonic-outline', injection: 'needle', inhaler: 'air-filter',
  cream: 'lotion-outline', drops: 'water-outline', patch: 'bandage', other: 'medical-bag',
};

const TYPE_COLORS: Record<MedicineType, string> = {
  tablet: '#007AFF', capsule: '#5856D6', syrup: '#0891B2', liquid: '#0891B2',
  injection: '#FF3B30', inhaler: '#34C759', cream: '#FF9500', drops: '#007AFF',
  patch: '#5856D6', other: '#8E8E93',
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub, action, c }: { icon: MCIName; title: string; sub: string; action?: { label: string; onPress: () => void }; c: any }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.fillTertiary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <MaterialCommunityIcons name={icon} size={36} color={c.textSecondary} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: action ? 28 : 0 }}>{sub}</Text>
      {action && (
        <Pressable
          style={({ pressed }) => ({
            backgroundColor: pressed ? c.primary + 'CC' : c.primary,
            borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
          })}
          onPress={action.onPress}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Medication row ───────────────────────────────────────────────────────────

function MedRow({ med, onPress, onDelete, c, isFirst }: { med: Medicine; onPress: () => void; onDelete: () => void; c: any; isFirst: boolean }) {
  const iconColor = TYPE_COLORS[med.medicineType] ?? c.primary;
  const isLow = med.stockCount <= med.refillThreshold;
  return (
    <View>
      {!isFirst && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: pressed ? c.fillTertiary : 'transparent' })}
      >
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: iconColor + '14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MaterialCommunityIcons name={TYPE_ICONS[med.medicineType]} size={17} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: c.text, letterSpacing: -0.2 }}>{med.name}</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>
            {med.dosage} · {med.frequency.replace(/_/g, ' ')}
          </Text>
          {isLow && (
            <Text style={{ fontSize: 11, color: '#FF9500', fontWeight: '600', marginTop: 3 }}>
              Low stock — {med.stockCount} remaining
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: med.isActive ? '#34C75914' : c.fillTertiary }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: med.isActive ? '#34C759' : c.textTertiary }}>
              {med.isActive ? 'Active' : 'Paused'}
            </Text>
          </View>
          <Pressable onPress={onDelete} hitSlop={12}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={c.textTertiary} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Patient view ─────────────────────────────────────────────────────────────

function PatientMedsView({ c }: { c: any }) {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { medicines, setMedicines } = useMedicationStore();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try { setMedicines(await medicationService.getActiveMedicines(userId)); }
    catch {} finally { setLoading(false); }
  }, [userId, setMedicines]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (med: Medicine) => {
    Alert.alert('Remove', `Remove ${med.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await medicationService.deleteMedicine(med.id);
          setMedicines(medicines.filter((m) => m.id !== med.id));
          Toast.show({ type: 'success', text1: `${med.name} removed` });
        } catch { Toast.show({ type: 'error', text1: 'Could not remove' }); }
      }},
    ]);
  };

  const active = medicines.filter((m) => m.isActive).length;
  const lowStock = medicines.filter((m) => m.stockCount <= m.refillThreshold).length;

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Stats row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 10 }}>
          {[
            { label: 'Active',    value: active,            color: '#34C759' },
            { label: 'Low Stock', value: lowStock,          color: '#FF9500' },
            { label: 'Total',     value: medicines.length,  color: c.primary },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : medicines.length === 0 ? (
          <EmptyState
            icon="pill"
            title="No medications yet"
            sub="Add your first medication to start tracking doses and reminders."
            action={{ label: 'Add Medication', onPress: () => router.push('/medications/add') }}
            c={c}
          />
        ) : (
          <View style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
            {medicines.map((med, i) => (
              <MedRow
                key={med.id} med={med} isFirst={i === 0} c={c}
                onPress={() => router.push({ pathname: '/medications/details', params: { id: med.id } } as any)}
                onDelete={() => handleDelete(med)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => ({
          position: 'absolute', bottom: 100, right: 20,
          width: 54, height: 54, borderRadius: 27,
          backgroundColor: pressed ? c.primary + 'CC' : c.primary,
          alignItems: 'center', justifyContent: 'center',
        })}
        onPress={() => router.push('/medications/add')}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </Pressable>
    </>
  );
}

// ─── Caregiver / Doctor: patients ────────────────────────────────────────────

function PatientsView({ roleLabel, c }: { roleLabel: string; c: any }) {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { members, setMembers } = useFamilyStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    familyService.getFamilyMembers(userId).then(setMembers).finally(() => setLoading(false));
  }, [userId, setMembers]);

  function avatarColor(name: string) {
    const p = [c.primary, '#5856D6', '#0891B2', '#34C759', '#C2410C'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return p[Math.abs(h) % p.length];
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
      {loading ? (
        <View style={{ padding: 60, alignItems: 'center' }}><ActivityIndicator color={c.primary} /></View>
      ) : members.length === 0 ? (
        <EmptyState icon="account-group-outline" title="No patients yet"
          sub="Add people to manage their health and medications."
          action={{ label: 'Add Person', onPress: () => router.push('/family/add') }} c={c} />
      ) : (
        <View style={{ marginHorizontal: 16, backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
          {members.map((m: FamilyMember, i: number) => {
            const bg = avatarColor(m.name);
            const ini = m.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <View key={m.id}>
                {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
                <Pressable
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: pressed ? c.fillTertiary : 'transparent' })}
                  onPress={() => router.push(`/family/${m.id}` as any)}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: bg + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: bg, fontWeight: '700', fontSize: 13 }}>{ini}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: c.text, letterSpacing: -0.2 }}>{m.name}</Text>
                    <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{m.relationship}{m.isCaregiver ? ' · Caregiver' : ''}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={c.textTertiary} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Org Admin: team ─────────────────────────────────────────────────────────

function TeamView({ c }: { c: any }) {
  const router = useRouter();
  const GRID = [
    { label: 'Doctors',    count: 12, icon: 'stethoscope' as MCIName,          color: '#5856D6' },
    { label: 'Caregivers', count: 28, icon: 'heart-plus-outline' as MCIName,   color: '#FF9500' },
    { label: 'Nurses',     count: 35, icon: 'account-nurse-outline' as MCIName,color: '#007AFF' },
    { label: 'Admin',      count: 8,  icon: 'office-building-outline' as MCIName, color: '#FF3B30' },
  ];
  const ACTIONS = [
    { icon: 'account-plus-outline' as MCIName,  label: 'Add Team Member',    sub: 'Invite staff to the organisation', color: c.primary },
    { icon: 'account-group-outline' as MCIName, label: 'View All Staff',     sub: 'Browse and manage team members',  color: '#5856D6' },
    { icon: 'chart-line' as MCIName,            label: 'Performance Reports',sub: 'Staff metrics and outcomes',      color: '#34C759' },
    { icon: 'shield-check-outline' as MCIName,  label: 'Compliance',         sub: 'Regulatory and audit tools',      color: '#FF9500' },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8, marginBottom: 20 }}>
        {GRID.map((g) => (
          <View key={g.label} style={{ width: '47%', backgroundColor: c.surface, borderRadius: 16, padding: 16, gap: 8 }}>
            <MaterialCommunityIcons name={g.icon} size={24} color={g.color} />
            <Text style={{ fontSize: 28, fontWeight: '800', color: g.color }}>{g.count}</Text>
            <Text style={{ fontSize: 13, color: c.textSecondary, fontWeight: '500' }}>{g.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {ACTIONS.map((item, i) => (
          <View key={item.label}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <Pressable style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, backgroundColor: pressed ? c.fillTertiary : 'transparent' })}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.fillTertiary, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={item.icon} size={17} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{item.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={c.textTertiary} />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Family member hub ────────────────────────────────────────────────────────

function FamilyHubView({ c }: { c: any }) {
  const router = useRouter();
  const PEOPLE = [
    { name: 'Mom',    status: '2 meds today', ok: true,  seen: '2 min ago', avatar: 'M', color: '#FF9500' },
    { name: 'Dad',    status: '1 missed dose', ok: false, seen: '1 hr ago',  avatar: 'D', color: '#5856D6' },
    { name: 'Grandma',status: 'All on time',  ok: true,  seen: '30 min ago',avatar: 'G', color: '#34C759' },
  ];
  const LINKS = [
    { icon: 'pill' as MCIName,              label: 'View Medications',  route: '/(tabs)/medications', color: c.primary },
    { icon: 'alarm-light-outline' as MCIName, label: 'SOS Emergency',   route: '/sos',                color: '#EF4444' },
    { icon: 'account-plus-outline' as MCIName, label: 'Add Member',    route: '/family/add',          color: '#34C759' },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 20 }}>
        {PEOPLE.map((p, i) => (
          <View key={p.name}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <Pressable
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, backgroundColor: pressed ? c.fillTertiary : 'transparent' })}
              onPress={() => router.push('/(tabs)/family')}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: p.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: p.color }}>{p.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>{p.name}</Text>
                <Text style={{ fontSize: 13, color: p.ok ? '#34C759' : '#EF4444', fontWeight: '500', marginTop: 1 }}>{p.status}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color={c.textTertiary} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
        {LINKS.map((item, i) => (
          <View key={item.label}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
            <Pressable
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, backgroundColor: pressed ? c.fillTertiary : 'transparent' })}
              onPress={() => router.push(item.route as any)}
            >
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.fillTertiary, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name={item.icon} size={17} color={item.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: c.text }}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={c.textTertiary} />
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TITLE: Record<UserRole, string> = {
  patient: 'My Medicines', family_member: 'Family Hub',
  caregiver: 'My Patients', doctor: 'My Patients', organization_admin: 'Team',
};

export default function MedicationsTab() {
  const { colors: c, isDark } = useAppTheme();
  const { userProfile } = useAuthStore();
  const role: UserRole = userProfile?.role ?? 'patient';

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 58, paddingBottom: 8 }}>
        <Text style={{ fontSize: 34, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>{TITLE[role]}</Text>
      </View>
      {role === 'family_member'       ? <FamilyHubView c={c} />
       : role === 'caregiver'         ? <PatientsView roleLabel="Caregiver" c={c} />
       : role === 'doctor'            ? <PatientsView roleLabel="Doctor" c={c} />
       : role === 'organization_admin'? <TeamView c={c} />
       :                               <PatientMedsView c={c} />
      }
    </View>
  );
}
