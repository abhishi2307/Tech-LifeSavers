import { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Switch,
  Modal,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Header, Card } from '../../components';
import { useAuthStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { Medicine, MedicationFrequency, MedicineType } from '../../types';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

const FREQUENCY_OPTIONS: { value: MedicationFrequency; label: string; icon: string }[] = [
  { value: 'once_daily', label: '1x Daily', icon: 'numeric-1-circle-outline' },
  { value: 'twice_daily', label: '2x Daily', icon: 'numeric-2-circle-outline' },
  { value: 'three_times_daily', label: '3x Daily', icon: 'numeric-3-circle-outline' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { value: 'as_needed', label: 'As Needed', icon: 'clock-alert-outline' },
];

const MEDICINE_TYPES: { value: MedicineType; icon: string }[] = [
  { value: 'tablet', icon: 'pill' },
  { value: 'capsule', icon: 'pill-multiple' },
  { value: 'syrup', icon: 'bottle-tonic-plus' },
  { value: 'injection', icon: 'needle' },
  { value: 'other', icon: 'medical-bag' },
];

export default function AddMedicineScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { addMedicine } = useMedicationStore();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicationFrequency>('once_daily');
  const [timings, setTimings] = useState<string[]>(['09:00']);
  const [instructions, setInstructions] = useState('');
  const [stockCount, setStockCount] = useState('30');
  const [refillThreshold, setRefillThreshold] = useState('5');
  const [medicineType, setMedicineType] = useState<MedicineType>('tablet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState<'time' | 'startDate' | 'endDate' | null>(null);
  const [activeTimingIndex, setActiveTimingIndex] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim()) {
      setError('Medicine name and dosage are required');
      return;
    }
    if (!userId) return;

    setLoading(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const medicine: Medicine = {
        id: `${userId}-${Date.now()}`,
        userId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        timings,
        startDate: now.split('T')[0],
        instructions: instructions.trim() || undefined,
        stockCount: parseInt(stockCount) || 0,
        refillThreshold: parseInt(refillThreshold) || 5,
        medicineType,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await medicationService.addMedicine(medicine);
      addMedicine(medicine);
      Toast.show({
        type: 'success',
        text1: 'Medication Saved',
        text2: `${name} has been added to your schedule`,
      });
      router.back();
    } catch (err) {
      setError('Failed to save medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTiming = () => {
    if (timings.length < 6) {
      setTimings([...timings, '09:00']);
    }
  };

  const removeTiming = (index: number) => {
    if (timings.length > 1) {
      setTimings(timings.filter((_, i) => i !== index));
    }
  };

  const updateTiming = (index: number, value: string) => {
    const next = [...timings];
    next[index] = value;
    setTimings(next);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    const pickerType = showPicker;
    setShowPicker(null);
    
    if (selectedDate) {
      if (pickerType === 'time' && activeTimingIndex !== null) {
        const timeString = dayjs(selectedDate).format('HH:mm');
        updateTiming(activeTimingIndex, timeString);
      } else if (pickerType === 'startDate') {
        setStartDate(dayjs(selectedDate).format('YYYY-MM-DD'));
      } else if (pickerType === 'endDate') {
        setEndDate(dayjs(selectedDate).format('YYYY-MM-DD'));
      }
    }
    setActiveTimingIndex(null);
  };

  const openTimePicker = (index: number) => {
    setActiveTimingIndex(index);
    setShowPicker('time');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Header title="Add Medication" subtitle="Setup your dosage schedule" showBack centered />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.flex} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              <Input
                label="Medicine Name *"
                value={name}
                onChangeText={(val) => { setName(val); setError(''); }}
                placeholder="e.g. Paracetamol"
                leftIcon="pill"
                style={styles.input}
              />
              <Input
                label="Dosage *"
                value={dosage}
                onChangeText={(val) => { setDosage(val); setError(''); }}
                placeholder="e.g. 500mg or 1 Tablet"
                leftIcon="scale-balance"
                style={styles.input}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type & Frequency</Text>
              <Text style={styles.fieldLabel}>Medicine Type</Text>
              <View style={styles.typeRow}>
                {MEDICINE_TYPES.map((type) => {
                  const isSelected = medicineType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.typeBtn, isSelected && styles.typeBtnSelected]}
                      onPress={() => setMedicineType(type.value)}
                    >
                      <MaterialCommunityIcons 
                        name={type.icon as any} 
                        size={24} 
                        color={isSelected ? colors.primary : colors.textTertiary} 
                      />
                      <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                        {type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Frequency</Text>
              <View style={styles.freqGrid}>
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = frequency === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.freqChip, isSelected && styles.freqChipSelected]}
                      onPress={() => setFrequency(opt.value)}
                    >
                      <MaterialCommunityIcons 
                        name={opt.icon as any} 
                        size={16} 
                        color={isSelected ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[styles.freqText, isSelected && styles.freqTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.timingList}>
                {timings.map((t, i) => {
                  const displayTime = dayjs(`2000-01-01 ${t}`).format('hh:mm A');
                  return (
                    <View key={i} style={styles.timingItem}>
                      <TouchableOpacity 
                        style={styles.timingInputWrap}
                        onPress={() => openTimePicker(i)}
                      >
                        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} style={styles.timeIcon} />
                        <View style={styles.timeDisplay}>
                          <Text style={styles.timeDisplayText}>{displayTime}</Text>
                          <Text style={styles.timeDisplaySub}>Tap to change</Text>
                        </View>
                      </TouchableOpacity>
                      {timings.length > 1 && (
                        <TouchableOpacity onPress={() => removeTiming(i)} style={styles.removeBtn}>
                          <MaterialCommunityIcons name="close-circle-outline" size={24} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
              {timings.length < 6 && (
                <Button 
                  mode="text" 
                  onPress={addTiming}
                  icon="plus"
                  style={styles.addTimeBtn}
                >
                  Add Another Time
                </Button>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory & Duration</Text>
              <View style={styles.row}>
                <TouchableOpacity 
                  style={[styles.flex, styles.dateInputBox]} 
                  onPress={() => setShowPicker('startDate')}
                >
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <View style={styles.dateDisplayRow}>
                    <MaterialCommunityIcons name="calendar-start" size={18} color={colors.primary} />
                    <Text style={styles.dateValueText}>{dayjs(startDate).format('MMM DD, YYYY')}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.flex, styles.dateInputBox]} 
                  onPress={() => setShowPicker('endDate')}
                >
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <View style={styles.dateDisplayRow}>
                    <MaterialCommunityIcons name="calendar-end" size={18} color={colors.textTertiary} />
                    <Text style={styles.dateValueText}>{endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'Optional'}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.flex}>
                  <Input
                    label="Current Stock"
                    value={stockCount}
                    onChangeText={setStockCount}
                    keyboardType="number-pad"
                    placeholder="30"
                    leftIcon="package-variant"
                  />
                </View>
                <View style={styles.flex}>
                  <Input
                    label="Refill at"
                    value={refillThreshold}
                    onChangeText={setRefillThreshold}
                    keyboardType="number-pad"
                    placeholder="5"
                    leftIcon="bell-outline"
                  />
                </View>
              </View>
              <Input
                label="Instructions"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Take after food"
                leftIcon="information-outline"
                multiline
                style={styles.instructions}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonGroup}>
              <Button
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.saveBtn}
              >
                Save Medication
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.cancelBtn}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <DateTimePicker
          value={
            showPicker === 'time' 
              ? dayjs(`2000-01-01 ${timings[activeTimingIndex ?? 0]}`).toDate()
              : showPicker === 'startDate'
                ? dayjs(startDate).toDate()
                : dayjs(endDate || undefined).toDate()
          }
          mode={showPicker === 'time' ? 'time' : 'date'}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },
  formCard: { 
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  section: { marginBottom: spacing.sm },
  sectionTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  input: { marginBottom: spacing.md },
  fieldLabel: { 
    ...typography.caption, 
    color: colors.textSecondary, 
    marginBottom: spacing.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  typeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  typeBtn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: radius.md,
    width: '18%',
    backgroundColor: colors.surfaceVariant + '30',
  },
  typeBtnSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  typeLabel: {
    ...typography.caption,
    fontSize: 9,
    marginTop: 4,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  typeLabelSelected: { color: colors.primary },
  freqGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    marginBottom: spacing.md,
  },
  freqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  freqChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  freqText: { ...typography.bodySm, color: colors.textSecondary },
  freqTextSelected: { color: colors.primary, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  timingList: { gap: 10, marginBottom: spacing.sm },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timingInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: 12,
  },
  timeIcon: { marginRight: 0 },
  timingInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    height: 48,
  },
  removeBtn: { padding: 4 },
  addTimeBtn: { alignSelf: 'flex-start', marginLeft: -8 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  instructions: { minHeight: 80, textAlignVertical: 'top' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  buttonGroup: { marginTop: spacing.md },
  saveBtn: { marginBottom: spacing.sm },
  cancelBtn: { borderColor: 'transparent' },
  timeDisplay: {
    marginLeft: 12,
    flex: 1,
    paddingVertical: 8,
  },
  timeDisplayText: {
    ...typography.h4,
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  timeDisplaySub: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  dateInputBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.surface,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateValueText: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text,
  },
});
