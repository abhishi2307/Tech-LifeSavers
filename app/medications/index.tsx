import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { shadows, radius, typography, spacing } from '../../constants/theme';
import { Medicine, MedicineType } from '../../types';
import { Header } from '../../components';
import { useAppTheme } from '../../hooks/useAppTheme';

const TYPE_ICONS: Record<MedicineType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  tablet: 'pill',
  capsule: 'pill',
  syrup: 'bottle-tonic-outline',
  liquid: 'bottle-tonic-outline',
  injection: 'needle',
  inhaler: 'air-filter',
  cream: 'lotion-outline',
  drops: 'water-outline',
  patch: 'bandage',
  other: 'medical-bag',
};

function MedCard({ item, onPress, onEdit, onDelete, isExpiring, c }: {
  item: Medicine;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isExpiring: boolean;
  c: any;
}) {
  const isLowStock = item.stockCount <= item.refillThreshold;
  const iconName = TYPE_ICONS[item.medicineType] ?? 'pill';
  const typeColors: any = {
    tablet: c.primary,
    capsule: '#7C3AED',
    syrup: '#0891B2',
    liquid: '#0891B2',
    injection: '#DC2626',
    inhaler: '#059669',
    cream: '#D97706',
    drops: '#2563EB',
    patch: '#9333EA',
    other: c.textSecondary,
  };
  const iconColor = typeColors[item.medicineType] ?? c.primary;
  const iconBg = iconColor + '15';
  const freqLabel = item.frequency.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: c.surface }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: iconColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <View style={[styles.medIcon, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
          </View>
          <View style={styles.medMeta}>
            <Text style={[styles.medName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.medDosage, { color: c.textSecondary }]}>{item.dosage}  ·  {freqLabel}</Text>
          </View>
          <View style={styles.cardMenu}>
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: c.fillTertiary }]} onPress={onEdit}>
              <MaterialCommunityIcons name="pencil-outline" size={17} color={c.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuBtn, { backgroundColor: c.fillTertiary }]} onPress={onDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={17} color={c.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timingsRow}>
          {item.timings.map((t, i) => (
            <View key={i} style={[styles.timingChip, { backgroundColor: c.fillTertiary }]}>
              <MaterialCommunityIcons name="clock-outline" size={11} color={iconColor} />
              <Text style={[styles.timingText, { color: iconColor }]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFoot}>
          <View style={[styles.stockBadge, { backgroundColor: c.fillTertiary }, isLowStock && { backgroundColor: c.error + '10' }]}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={13}
              color={isLowStock ? c.warning : c.textSecondary}
            />
            <Text style={[styles.stockText, { color: c.textSecondary }, isLowStock && { color: c.error, fontWeight: '700' }]}>
              {item.stockCount} left
            </Text>
          </View>
          {isLowStock && <Text style={[styles.warnTag, { color: c.warning }]}>⚠ Low stock</Text>}
          {isExpiring && <Text style={[styles.warnTag, { color: c.error }]}>⚠ Expiring</Text>}
          {item.isActive ? (
            <View style={[styles.activeDot, { backgroundColor: c.success }]} />
          ) : (
            <Text style={[styles.inactiveTag, { color: c.textTertiary }]}>Inactive</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MedicationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  const { userId } = useAuthStore();
  const { medicines, setMedicines, isLoading, setIsLoading } = useMedicationStore();
  const [expiringIds, setExpiringIds] = useState<Set<string>>(new Set());

  const loadMedicines = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [allMeds, expiring] = await Promise.all([
        medicationService.getActiveMedicines(userId),
        medicationService.getExpiringMedicines(userId),
      ]);
      setMedicines(allMeds);
      setExpiringIds(new Set(expiring.map((m: Medicine) => m.id)));
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [userId, setMedicines, setIsLoading]);

  useEffect(() => { loadMedicines(); }, [loadMedicines]);

  const handleDelete = (medicine: Medicine) => {
    Alert.alert('Delete Medicine', `Remove ${medicine.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await medicationService.deleteMedicine(medicine.id);
            await loadMedicines();
            Toast.show({ type: 'success', text1: `${medicine.name} removed` });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not delete medicine' });
          }
        },
      },
    ]);
  };

  const lowStockCount = medicines.filter((m) => m.stockCount <= m.refillThreshold).length;
  const expiringCount = expiringIds.size;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header 
        title="Medications" 
        subtitle={medicines.length > 0 ? `${medicines.length} active medicine${medicines.length !== 1 ? 's' : ''}` : 'Track your medications'}
        rightAction={{
          icon: 'plus',
          onPress: () => router.push('/medications/add')
        }}
        centered
      />

      {(lowStockCount > 0 || expiringCount > 0) && (
        <View style={styles.alertStrip}>
          {lowStockCount > 0 && (
            <View style={[styles.alertItem, { backgroundColor: c.warning + '15' }]}>
              <MaterialCommunityIcons name="package-variant" size={14} color={c.warning} />
              <Text style={[styles.alertItemText, { color: c.warning }]}>{lowStockCount} low stock</Text>
            </View>
          )}
          {expiringCount > 0 && (
            <View style={[styles.alertItem, { backgroundColor: c.error + '15' }]}>
              <MaterialCommunityIcons name="calendar-alert" size={14} color={c.error} />
              <Text style={[styles.alertItemText, { color: c.error }]}>{expiringCount} expiring</Text>
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading medicines…</Text>
        </View>
      ) : medicines.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIllustration, { backgroundColor: c.fillTertiary }]}>
            <MaterialCommunityIcons name="pill" size={52} color={c.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No medications yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>Add your medications to start tracking doses and reminders</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: c.primary }]} onPress={() => router.push('/medications/add')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedCard
              item={item}
              isExpiring={expiringIds.has(item.id)}
              onPress={() => router.push(`/medications/details?id=${item.id}`)}
              onEdit={() => router.push(`/medications/edit?id=${item.id}`)}
              onDelete={() => handleDelete(item)}
              c={c}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  alertStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alertItemText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  medIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medMeta: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  medDosage: { fontSize: 13 },
  cardMenu: { flexDirection: 'row', gap: 2 },
  menuBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  timingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timingText: { fontSize: 12, fontWeight: '600' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: { fontSize: 12, fontWeight: '500' },
  warnTag: { fontSize: 11, fontWeight: '700' },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  inactiveTag: { fontSize: 11, marginLeft: 'auto' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...shadows.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

