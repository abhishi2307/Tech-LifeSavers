import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';
import { Button, Input, Header, Card } from '../../components';
import { useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { Medicine, MedicationFrequency, MedicineType } from '../../types';
import { colors } from '../../constants/theme';

/**
 * Edit medicine screen
 * Form to edit an existing medication
 */
export default function EditMedicineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FREQUENCY_OPTIONS: { value: MedicationFrequency; label: string }[] = [
    { value: 'once_daily', label: 'Once Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'three_times_daily', label: 'Three Times Daily' },
    { value: 'four_times_daily', label: 'Four Times Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as_needed', label: 'As Needed' },
    { value: 'custom', label: 'Custom' },
  ];

  const MEDICINE_TYPE_OPTIONS: { value: MedicineType; label: string; icon: string }[] = [
    { value: 'tablet', label: 'Tablet', icon: '💊' },
    { value: 'capsule', label: 'Capsule', icon: '💊' },
    { value: 'liquid', label: 'Liquid', icon: '🧴' },
    { value: 'injection', label: 'Injection', icon: '💉' },
    { value: 'inhaler', label: 'Inhaler', icon: '💨' },
    { value: 'cream', label: 'Cream', icon: '🧴' },
    { value: 'drops', label: 'Drops', icon: '💧' },
    { value: 'patch', label: 'Patch', icon: '🩹' },
    { value: 'other', label: 'Other', icon: '💊' },
  ];

  useEffect(() => {
    loadMedicine();
  }, [id]);

  const loadMedicine = async () => {
    if (!id) return;

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
      }
    } catch (error) {
      console.error('Failed to load medicine:', error);
      setError('Failed to load medicine');
    }
  };

  const handleAddTiming = () => {
    setTimings([...timings, '12:00']);
  };

  const handleRemoveTiming = (index: number) => {
    setTimings(timings.filter((_, i) => i !== index));
  };

  const handleTimingChange = (index: number, value: string) => {
    const newTimings = [...timings];
    newTimings[index] = value;
    setTimings(newTimings);
  };

  const handleSave = async () => {
    setError('');

    if (!selectedMedicine) {
      setError('Medicine not found');
      return;
    }

    // Validation
    if (!name || !dosage || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (timings.length === 0) {
      setError('Please add at least one timing');
      return;
    }

    if (parseInt(stockCount) < 0) {
      setError('Stock count cannot be negative');
      return;
    }

    setLoading(true);

    try {
      const medicine: Medicine = {
        ...selectedMedicine,
        name,
        dosage,
        frequency,
        timings,
        startDate,
        endDate: endDate || undefined,
        instructions: instructions || undefined,
        stockCount: parseInt(stockCount),
        refillThreshold: parseInt(refillThreshold),
        medicineType,
        category: category || undefined,
        expiryDate: expiryDate || undefined,
        isActive,
        updatedAt: new Date().toISOString(),
      };

      await medicationService.updateMedicine(medicine);
      router.back();
    } catch (err) {
      setError('Failed to update medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Edit Medicine"
          subtitle="Update medication details"
        />

        <Card>
          <Input
            label="Medicine Name *"
            value={name}
            onChangeText={setName}
            error={!!error}
            style={styles.input}
          />

          <Input
            label="Dosage *"
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 500mg"
            error={!!error}
            style={styles.input}
          />

          <Text style={styles.label}>Frequency *</Text>
          <View style={styles.optionsGrid}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  frequency === option.value && styles.selectedOption,
                ]}
                onPress={() => setFrequency(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    frequency === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Timings *</Text>
          {timings.map((timing, index) => (
            <View key={index} style={styles.timingRow}>
              <Input
                value={timing}
                onChangeText={(value) => handleTimingChange(index, value)}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
                style={styles.timingInput}
              />
              {timings.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveTiming(index)}
                  style={styles.removeTimingButton}
                >
                  <Text style={styles.removeTimingText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <Button
            mode="outlined"
            onPress={handleAddTiming}
            style={styles.addTimingButton}
          >
            Add Timing
          </Button>

          <Input
            label="Start Date *"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            error={!!error}
            style={styles.input}
          />

          <Input
            label="End Date (Optional)"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <Input
            label="Instructions (Optional)"
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g., Take with food"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.row}>
            <Input
              label="Stock Count *"
              value={stockCount}
              onChangeText={setStockCount}
              keyboardType="number-pad"
              error={!!error}
              style={[styles.input, styles.rowInput]}
            />
            <Input
              label="Refill Threshold *"
              value={refillThreshold}
              onChangeText={setRefillThreshold}
              keyboardType="number-pad"
              error={!!error}
              style={[styles.input, styles.rowInput]}
            />
          </View>

          <Text style={styles.label}>Medicine Type *</Text>
          <View style={styles.optionsGrid}>
            {MEDICINE_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeOptionButton,
                  medicineType === option.value && styles.selectedOption,
                ]}
                onPress={() => setMedicineType(option.value)}
              >
                <Text style={styles.typeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.typeOptionText,
                    medicineType === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Category (Optional)"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Antibiotics, Pain Relief"
            style={styles.input}
          />

          <Input
            label="Expiry Date (Optional)"
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isActive && styles.toggleButtonActive,
              ]}
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={[
                styles.toggleButtonText,
                isActive && styles.toggleButtonTextActive,
              ]}>
                {isActive ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          >
            Save Changes
          </Button>

          <Button
            variant="outline"
            onPress={() => router.back()}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  timingInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeTimingButton: {
    paddingVertical: 8,
  },
  removeTimingText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  addTimingButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowInput: {
    flex: 1,
    marginBottom: 16,
  },
  typeOptionButton: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeOptionText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 12,
  },
});
