import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input, Header, Card } from '../../components';
import { useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { Medicine, MedicationFrequency, MedicineType } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { typography, spacing, radius, shadows, colors } from '../../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

export default function EditMedicineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  const { selectedMedicine, setSelectedMedicine } = useMedicationStore();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicationFrequency>('once_daily');
  const [timings, setTimings] = useState<string[]>(['09:00']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [stockCount, setStockCount] = useState('30');
  const [refillThreshold, setRefillThreshold] = useState('5');
  const [medicineType, setMedicineType] = useState<MedicineType>('tablet');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [precautions, setPrecautions] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [interactionInput, setInteractionInput] = useState('');
  const [interactions, setInteractions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPicker, setShowPicker] = useState<'time' | 'startDate' | 'endDate' | null>(null);
  const [activeTimingIndex, setActiveTimingIndex] = useState<number | null>(null);

  const FREQUENCY_OPTIONS: { value: MedicationFrequency; label: string }[] = [
    { value: 'once_daily', label: 'Once Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: '3x Daily' },
    { value: 'as_needed', label: 'As Needed' },
  ];

  const TYPE_OPTIONS: { value: MedicineType; label: string; icon: any }[] = [
    { value: 'tablet', label: 'Tablet', icon: 'pill' },
    { value: 'capsule', label: 'Capsule', icon: 'pill' },
    { value: 'syrup', label: 'Syrup', icon: 'bottle-tonic-outline' },
    { value: 'injection', label: 'Injection', icon: 'needle' },
    { value: 'inhaler', label: 'Inhaler', icon: 'air-filter' },
  ];

  const loadMedicine = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const medicine = await medicationService.getMedicine(id);
      if (medicine) {
        setSelectedMedicine(medicine);
        setName(medicine.name);
        setDosage(medicine.dosage);
        setFrequency(medicine.frequency);
        setTimings(medicine.timings);
        setStartDate(medicine.startDate);
        setEndDate(medicine.endDate || '');
        setInstructions(medicine.instructions || '');
        setStockCount(medicine.stockCount.toString());
        setRefillThreshold(medicine.refillThreshold.toString());
        setMedicineType(medicine.medicineType);
        setCategory(medicine.category || '');
        setExpiryDate(medicine.expiryDate || '');
        setIsActive(medicine.isActive);
        setPrecautions(medicine.precautions || '');
        setAllergies(medicine.allergies ?? []);
        setInteractions(medicine.interactions ?? []);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load medicine' });
    } finally {
      setFetching(false);
    }
  }, [id, setSelectedMedicine]);

  useEffect(() => { loadMedicine(); }, [loadMedicine]);

  const onPickerChange = (event: any, selectedDate?: Date) => {
    const pickerType = showPicker;
    setShowPicker(null);
    if (selectedDate) {
      if (pickerType === 'time' && activeTimingIndex !== null) {
        const timeString = dayjs(selectedDate).format('HH:mm');
        const newT = [...timings];
        newT[activeTimingIndex] = timeString;
        setTimings(newT);
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

  const handleSave = async () => {
    if (!name || !dosage || !startDate || timings.length === 0) {
      Toast.show({ type: 'error', text1: 'Please fill required fields' });
      return;
    }

    setLoading(true);
    try {
      const medicine: Medicine = {
        ...selectedMedicine!,
        name,
        dosage,
        frequency,
        timings,
        startDate,
        endDate: endDate || undefined,
        instructions: instructions || undefined,
        precautions: precautions || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        interactions: interactions.length > 0 ? interactions : undefined,
        stockCount: parseInt(stockCount),
        refillThreshold: parseInt(refillThreshold),
        medicineType,
        category: category || undefined,
        expiryDate: expiryDate || undefined,
        isActive,
        updatedAt: new Date().toISOString(),
      };

      await medicationService.updateMedicine(medicine);
      Toast.show({ type: 'success', text1: 'Updated successfully' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header title="Edit Medicine" subtitle="Update your prescription" showBack />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Essential Info Section */}
          <SectionHeader title="Essential Info" c={c} />
          <Card style={styles.formCard}>
            <Input label="Medicine Name *" value={name} onChangeText={setName} placeholder="e.g. Paracetamol" />
            <Input label="Dosage *" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />
            
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Frequency</Text>
            <View style={styles.choiceGrid}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={[styles.choiceBtn, { backgroundColor: frequency === opt.value ? c.primary : c.fillTertiary }]}
                  onPress={() => setFrequency(opt.value)}
                >
                  <Text style={[styles.choiceText, { color: frequency === opt.value ? '#fff' : c.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Schedule Section */}
          <SectionHeader title="Schedule & Timing" c={c} />
          <Card style={styles.formCard}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Reminder Timings</Text>
            {timings.map((t, idx) => {
              const displayTime = dayjs(`2000-01-01 ${t}`).format('hh:mm A');
              return (
                <View key={idx} style={styles.timingRow}>
                  <TouchableOpacity 
                    style={[styles.timingInputBox, { backgroundColor: c.fillTertiary }]}
                    onPress={() => openTimePicker(idx)}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color={c.primary} />
                    <View style={styles.timeDisplay}>
                      <Text style={[styles.timeDisplayText, { color: c.text }]}>{displayTime}</Text>
                      <Text style={[styles.timeDisplaySub, { color: c.textTertiary }]}>Tap to change</Text>
                    </View>
                  </TouchableOpacity>
                  {timings.length > 1 && (
                    <TouchableOpacity onPress={() => setTimings(timings.filter((_, i) => i !== idx))}>
                      <MaterialCommunityIcons name="minus-circle-outline" size={24} color={c.error} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <TouchableOpacity 
              style={[styles.addBtn, { borderColor: c.primary }]} 
              onPress={() => setTimings([...timings, '09:00'])}
            >
              <MaterialCommunityIcons name="plus" size={20} color={c.primary} />
              <Text style={[styles.addBtnText, { color: c.primary }]}>Add Another Time</Text>
            </TouchableOpacity>

            <View style={styles.dateRow}>
              <TouchableOpacity 
                style={[styles.flex, styles.dateInputBox, { backgroundColor: c.fillTertiary }]} 
                onPress={() => setShowPicker('startDate')}
              >
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Start Date</Text>
                <View style={styles.dateDisplayRow}>
                  <MaterialCommunityIcons name="calendar-start" size={18} color={c.primary} />
                  <Text style={[styles.dateValueText, { color: c.text }]}>
                    {startDate ? dayjs(startDate).format('MMM DD, YYYY') : 'Set Date'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.flex, styles.dateInputBox, { backgroundColor: c.fillTertiary }]} 
                onPress={() => setShowPicker('endDate')}
              >
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>End Date</Text>
                <View style={styles.dateDisplayRow}>
                  <MaterialCommunityIcons name="calendar-end" size={18} color={c.textTertiary} />
                  <Text style={[styles.dateValueText, { color: c.text }]}>
                    {endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'Optional'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Details Section */}
          <SectionHeader title="Type & Inventory" c={c} />
          <Card style={styles.formCard}>
            <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Medicine Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={[styles.typeBtn, { backgroundColor: medicineType === opt.value ? c.primary : c.fillTertiary }]}
                  onPress={() => setMedicineType(opt.value)}
                >
                  <MaterialCommunityIcons name={opt.icon} size={20} color={medicineType === opt.value ? '#fff' : c.primary} />
                  <Text style={[styles.typeBtnText, { color: medicineType === opt.value ? '#fff' : c.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Input label="Stock Count" value={stockCount} onChangeText={setStockCount} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Refill at" value={refillThreshold} onChangeText={setRefillThreshold} keyboardType="numeric" />
              </View>
            </View>
          </Card>

          {/* Instructions */}
          <SectionHeader title="Notes & Warnings" c={c} />
          <Card style={styles.formCard}>
            <Input label="Instructions" value={instructions} onChangeText={setInstructions} multiline placeholder="Take after food..." />
            <Input label="Precautions" value={precautions} onChangeText={setPrecautions} multiline placeholder="Avoid driving..." />
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionFooter}>
            <Button onPress={handleSave} loading={loading} disabled={loading} style={styles.mainBtn}>
              Save Changes
            </Button>
            <TouchableOpacity onPress={() => router.back()} disabled={loading} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: c.textTertiary }]}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <DateTimePicker
          value={
            showPicker === 'time' 
              ? dayjs(`2000-01-01 ${timings[activeTimingIndex ?? 0]}`).toDate()
              : showPicker === 'startDate'
                ? dayjs(startDate || undefined).toDate()
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

function SectionHeader({ title, c }: { title: string; c: any }) {
  return <Text style={[styles.sectionHeader, { color: c.textSecondary }]}>{title.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginLeft: 8, marginTop: 20, marginBottom: 8 },
  formCard: { padding: 16, gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  choiceText: { fontSize: 13, fontWeight: '600' },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  timingInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12 },
  bareInput: { flex: 1, backgroundColor: 'transparent', marginBottom: 0, height: 44 },
  addBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    borderWidth: 1.5, 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 12, 
    marginTop: 8 
  },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  typeScroll: { gap: 10, paddingRight: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  typeBtnText: { fontSize: 13, fontWeight: '600' },
  actionFooter: { marginTop: 32, gap: 12 },
  mainBtn: { height: 56, borderRadius: 16, justifyContent: 'center' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  timeDisplay: {
    marginLeft: 12,
    flex: 1,
    paddingVertical: 8,
  },
  timeDisplayText: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeDisplaySub: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: -2,
    fontWeight: '600',
  },
  dateInputBox: {
    padding: 12,
    borderRadius: 12,
  },
  dateDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  flex: { flex: 1 },
});

