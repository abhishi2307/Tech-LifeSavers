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
import { colors, shadows, radius, typography, spacing } from '../../constants/theme';
import { Medicine, MedicineType } from '../../types';
import { Header } from '../../components';

const TYPE_ICONS: Record<MedicineType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  tablet: 'pill',
  capsule: 'pill',
  liquid: 'bottle-tonic-outline',
  injection: 'needle',
  inhaler: 'air-filter',
  cream: 'lotion-outline',
  drops: 'water-outline',
  patch: 'bandage',
  other: 'medical-bag',
};

const TYPE_COLORS: Record<MedicineType, string> = {
  tablet: colors.primary,
  capsule: '#7C3AED',
  liquid: '#0891B2',
  injection: '#DC2626',
  inhaler: '#059669',
  cream: '#D97706',
  drops: '#2563EB',
  patch: '#9333EA',
  other: colors.textSecondary,
};

function MedCard({ item, onPress, onEdit, onDelete, isExpiring }: {
  item: Medicine;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isExpiring: boolean;
}) {
  const isLowStock = item.stockCount <= item.refillThreshold;
  const iconName = TYPE_ICONS[item.medicineType] ?? 'pill';
  const iconColor = TYPE_COLORS[item.medicineType] ?? colors.primary;
  const iconBg = iconColor + '15';
  const freqLabel = item.frequency.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardAccent, { backgroundColor: iconColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <View style={[styles.medIcon, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
          </View>
          <View style={styles.medMeta}>
            <Text style={styles.medName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.medDosage}>{item.dosage}  ·  {freqLabel}</Text>
          </View>
          <View style={styles.cardMenu}>
            <TouchableOpacity style={styles.menuBtn} onPress={onEdit}>
              <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={onDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={17} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timingsRow}>
          {item.timings.map((t, i) => (
            <View key={i} style={styles.timingChip}>
              <MaterialCommunityIcons name="clock-outline" size={11} color={iconColor} />
              <Text style={[styles.timingText, { color: iconColor }]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFoot}>
          <View style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={13}
              color={isLowStock ? colors.warning : colors.textSecondary}
            />
            <Text style={[styles.stockText, isLowStock && styles.stockTextLow]}>
              {item.stockCount} left
            </Text>
          </View>
          {isLowStock && <Text style={styles.warnTag}>⚠ Low stock</Text>}
          {isExpiring && <Text style={[styles.warnTag, { color: colors.error }]}>⚠ Expiring</Text>}
          {item.isActive ? (
            <View style={styles.activeDot} />
          ) : (
            <Text style={styles.inactiveTag}>Inactive</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MedicationListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
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
            <View style={styles.alertItem}>
              <MaterialCommunityIcons name="package-variant" size={14} color={colors.warning} />
              <Text style={styles.alertItemText}>{lowStockCount} low stock</Text>
            </View>
          )}
          {expiringCount > 0 && (
            <View style={[styles.alertItem, { backgroundColor: colors.error + '15' }]}>
              <MaterialCommunityIcons name="calendar-alert" size={14} color={colors.error} />
              <Text style={[styles.alertItemText, { color: colors.error }]}>{expiringCount} expiring</Text>
            </View>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading medicines…</Text>
        </View>
      ) : medicines.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIllustration}>
            <MaterialCommunityIcons name="pill" size={52} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No medications yet</Text>
          <Text style={styles.emptySub}>Add your medications to start tracking doses and reminders</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/medications/add')} activeOpacity={0.85}>
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
  root: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alertItemText: { fontSize: 12, fontWeight: '600', color: colors.warning },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
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
  medName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  medDosage: { fontSize: 13, color: colors.textSecondary },
  cardMenu: { flexDirection: 'row', gap: 2 },
  menuBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
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
    backgroundColor: colors.surfaceVariant,
  },
  timingText: { fontSize: 12, fontWeight: '600' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockBadgeLow: { backgroundColor: colors.error + '10' },
  stockText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  stockTextLow: { color: colors.error, fontWeight: '700' },
  warnTag: { fontSize: 11, fontWeight: '700', color: colors.warning },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: 'auto',
  },
  inactiveTag: { fontSize: 11, color: colors.textTertiary, marginLeft: 'auto' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...shadows.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
