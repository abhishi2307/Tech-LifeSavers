import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Header, Card } from '../../components';
import { useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { Medicine, MedicationLog, AdherenceStatus, MedicineType } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, typography, radius, shadows } from '../../constants/theme';

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

export default function MedicineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  const { setSelectedMedicine } = useMedicationStore();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedicineDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const med = await medicationService.getMedicine(id);
      if (med) {
        setMedicine(med);
        setSelectedMedicine(med);

        const allLogs = await medicationService.getMedicationLogsByMedicineId(id);
        const today = new Date().toISOString().split('T')[0];
        const todayMedLogs = allLogs.filter((log: MedicationLog) => log.scheduledTime.startsWith(today));
        setTodayLogs(todayMedLogs);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to load details' });
    } finally {
      setLoading(false);
    }
  }, [id, setSelectedMedicine]);

  useEffect(() => { loadMedicineDetails(); }, [loadMedicineDetails]);

  const handleDelete = () => {
    if (!medicine) return;
    Alert.alert('Delete Medicine', `Are you sure you want to remove ${medicine.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await medicationService.deleteMedicine(medicine.id);
            router.back();
            Toast.show({ type: 'success', text1: 'Medicine removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete' });
          }
        },
      },
    ]);
  };

  const handleAction = async (scheduledTime: string, status: AdherenceStatus) => {
    if (!medicine) return;
    try {
      if (status === 'taken') await medicationService.markAsTaken(medicine.id, scheduledTime);
      else if (status === 'missed') await medicationService.markAsMissed(medicine.id, scheduledTime);
      else if (status === 'delayed') await medicationService.markAsDelayed(medicine.id, scheduledTime);
      await loadMedicineDetails();
    } catch {
      Toast.show({ type: 'error', text1: 'Update failed' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!medicine) return null;

  const isLowStock = medicine.stockCount <= medicine.refillThreshold;
  const iconName = TYPE_ICONS[medicine.medicineType] ?? 'pill';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header 
        title={medicine.name} 
        subtitle={medicine.medicineType.toUpperCase()} 
        showBack
        rightAction={{
          icon: 'pencil',
          onPress: () => router.push(`/medications/edit?id=${id}`)
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Medicine Overview Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={[styles.iconBox, { backgroundColor: c.primary + '15' }]}>
              <MaterialCommunityIcons name={iconName} size={32} color={c.primary} />
            </View>
            <View style={styles.heroMeta}>
              <Text style={[styles.heroName, { color: c.text }]}>{medicine.name}</Text>
              <Text style={[styles.heroDosage, { color: c.textSecondary }]}>{medicine.dosage}  ·  {medicine.frequency.replace(/_/g, ' ')}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: medicine.isActive ? c.success + '15' : c.textTertiary + '15' }]}>
              <Text style={[styles.statusText, { color: medicine.isActive ? c.success : c.textSecondary }]}>
                {medicine.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Schedule Section */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Today's Schedule</Text>
        {todayLogs.length === 0 ? (
          <Card style={styles.emptyScheduleCard}>
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No doses scheduled for today</Text>
          </Card>
        ) : (
          todayLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={[styles.logTimeBox, { backgroundColor: c.fillTertiary }]}>
                  <Text style={[styles.logTime, { color: c.text }]}>
                    {log.scheduledTime.split('T')[1]?.substring(0, 5) || log.scheduledTime}
                  </Text>
                </View>
                <View style={styles.logMeta}>
                  <Text style={[styles.logStatusLabel, { color: log.status === 'taken' ? c.success : log.status === 'missed' ? c.error : c.textSecondary }]}>
                    {log.status.toUpperCase()}
                  </Text>
                </View>
                {log.status === 'pending' && (
                  <View style={styles.logActions}>
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: c.success }]} 
                      onPress={() => handleAction(log.scheduledTime, 'taken')}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.smallActionBtn, { backgroundColor: c.error }]} 
                      onPress={() => handleAction(log.scheduledTime, 'missed')}
                    >
                      <MaterialCommunityIcons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}

        {/* Info Grid */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Information</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <InfoItem label="Stock" value={`${medicine.stockCount} left`} icon="package-variant" color={isLowStock ? c.error : c.primary} c={c} />
            <Divider style={styles.vDivider} />
            <InfoItem label="Timings" value={medicine.timings.join(', ')} icon="clock-outline" color={c.secondary} c={c} />
          </View>
          <Divider style={styles.hDivider} />
          <View style={styles.infoRow}>
            <InfoItem label="Start Date" value={medicine.startDate} icon="calendar-start" color={c.success} c={c} />
            <Divider style={styles.vDivider} />
            <InfoItem label="Threshold" value={medicine.refillThreshold.toString()} icon="bell-ring-outline" color={c.warning} c={c} />
          </View>
        </Card>

        {/* Instructions & Precautions */}
        {(medicine.instructions || medicine.precautions) && (
          <View style={styles.memoContainer}>
            {medicine.instructions && (
              <Card style={styles.memoCard}>
                <View style={styles.memoHeader}>
                  <MaterialCommunityIcons name="information" size={20} color={c.primary} />
                  <Text style={[styles.memoTitle, { color: c.text }]}>Instructions</Text>
                </View>
                <Text style={[styles.memoText, { color: c.textSecondary }]}>{medicine.instructions}</Text>
              </Card>
            )}
            {medicine.precautions && (
              <Card style={[styles.memoCard, { borderLeftColor: c.warning, borderLeftWidth: 4 }]}>
                <View style={styles.memoHeader}>
                  <MaterialCommunityIcons name="alert" size={20} color={c.warning} />
                  <Text style={[styles.memoTitle, { color: c.text }]}>Precautions</Text>
                </View>
                <Text style={[styles.memoText, { color: c.textSecondary }]}>{medicine.precautions}</Text>
              </Card>
            )}
          </View>
        )}

        {/* Risks Section */}
        {(medicine.allergies?.length || medicine.interactions?.length) && (
          <View style={styles.riskContainer}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Risks & Warnings</Text>
            {medicine.allergies && medicine.allergies.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={[styles.tagLabel, { color: c.textTertiary }]}>ALLERGENS</Text>
                <View style={styles.tagRow}>
                  {medicine.allergies.map((a, i) => (
                    <View key={i} style={[styles.riskTag, { backgroundColor: c.error + '15', borderColor: c.error + '30' }]}>
                      <Text style={[styles.riskTagText, { color: c.error }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {medicine.interactions && medicine.interactions.length > 0 && (
              <View style={[styles.tagSection, { marginTop: 12 }]}>
                <Text style={[styles.tagLabel, { color: c.textTertiary }]}>INTERACTIONS</Text>
                <View style={styles.tagRow}>
                  {medicine.interactions.map((inter, i) => (
                    <View key={i} style={[styles.riskTag, { backgroundColor: c.warning + '15', borderColor: c.warning + '30' }]}>
                      <Text style={[styles.riskTagText, { color: c.warning }]}>{inter}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Delete Action */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.error} />
          <Text style={[styles.deleteBtnText, { color: c.error }]}>Remove Medicine</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoItem({ label, value, icon, color, c }: { label: string; value: string; icon: any; color: string; c: any }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoItemHead}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
        <Text style={[styles.infoLabel, { color: c.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: c.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: { margin: 16, marginBottom: 8, padding: 16 },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  heroMeta: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  heroDosage: { fontSize: 14, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  emptyScheduleCard: { marginHorizontal: 16, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' },
  logCard: { marginHorizontal: 16, marginBottom: 8, padding: 12 },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  logTimeBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 12 },
  logTime: { fontSize: 15, fontWeight: '700' },
  logMeta: { flex: 1 },
  logStatusLabel: { fontSize: 12, fontWeight: '800' },
  logActions: { flexDirection: 'row', gap: 8 },
  smallActionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoCard: { marginHorizontal: 16, padding: 0, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', padding: 16 },
  infoItem: { flex: 1 },
  infoItemHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '600' },
  hDivider: { height: 1 },
  vDivider: { width: 1, height: '100%', marginHorizontal: 16 },
  memoContainer: { marginHorizontal: 16, marginTop: 16, gap: 12 },
  memoCard: { padding: 16 },
  memoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  memoTitle: { fontSize: 15, fontWeight: '700' },
  memoText: { fontSize: 14, lineHeight: 22 },
  riskContainer: { marginHorizontal: 16 },
  tagSection: { paddingHorizontal: 4 },
  tagLabel: { fontSize: 10, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  riskTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  riskTagText: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginTop: 40,
    paddingVertical: 12,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700' },
});

