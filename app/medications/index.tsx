import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, FAB, IconButton } from 'react-native-paper';
import { Button, Card, Header } from '../../components';
import { useAuthStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { colors } from '../../constants/theme';
import { Medicine } from '../../types';

/**
 * Medication list dashboard screen
 * Displays all medicines with quick actions and stock monitoring
 */
export default function MedicationListScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { medicines, setMedicines, isLoading, setIsLoading } = useMedicationStore();
  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [expiringMedicines, setExpiringMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    loadMedicines();
  }, [userId]);

  const loadMedicines = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [allMedicines, lowStock, expiring] = await Promise.all([
        medicationService.getActiveMedicines(userId),
        medicationService.getLowStockMedicines(userId),
        medicationService.getExpiringMedicines(userId),
      ]);

      setMedicines(allMedicines);
      setLowStockMedicines(lowStock);
      setExpiringMedicines(expiring);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToAdd = () => {
    router.push('/medications/add');
  };

  const navigateToDetails = (medicine: Medicine) => {
    router.push(`/medications/details?id=${medicine.id}`);
  };

  const navigateToEdit = (medicine: Medicine) => {
    router.push(`/medications/edit?id=${medicine.id}`);
  };

  const handleDelete = async (medicine: Medicine) => {
    try {
      await medicationService.deleteMedicine(medicine.id);
      await loadMedicines();
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    }
  };

  const renderMedicineCard = ({ item }: { item: Medicine }) => {
    const isLowStock = item.stockCount <= item.refillThreshold;
    const isExpiring = expiringMedicines.some(m => m.id === item.id);

    return (
      <Card style={styles.medicineCard}>
        <View style={styles.cardHeader}>
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName}>{item.name}</Text>
            <Text style={styles.medicineDosage}>{item.dosage}</Text>
          </View>
          <View style={styles.cardActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigateToEdit(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={colors.error}
              onPress={() => handleDelete(item)}
            />
          </View>
        </View>

        <View style={styles.medicineDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={styles.detailValue}>{item.frequency.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text style={[
              styles.detailValue,
              isLowStock && styles.lowStockText
            ]}>
              {item.stockCount}
            </Text>
          </View>
        </View>

        <View style={styles.timingsContainer}>
          <Text style={styles.timingsLabel}>Timings:</Text>
          <View style={styles.timingsList}>
            {item.timings.map((timing, index) => (
              <View key={index} style={styles.timingChip}>
                <Text style={styles.timingText}>{timing}</Text>
              </View>
            ))}
          </View>
        </View>

        {(isLowStock || isExpiring) && (
          <View style={styles.warningContainer}>
            {isLowStock && (
              <Text style={styles.warningText}>⚠️ Low stock</Text>
            )}
            {isExpiring && (
              <Text style={styles.warningText}>⚠️ Expiring soon</Text>
            )}
          </View>
        )}

        <Button
          mode="outlined"
          onPress={() => navigateToDetails(item)}
          style={styles.detailsButton}
        >
          View Details
        </Button>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading medicines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="My Medications"
        subtitle="Manage your medications and reminders"
      />

      {(lowStockMedicines.length > 0 || expiringMedicines.length > 0) && (
        <View style={styles.alertsContainer}>
          {lowStockMedicines.length > 0 && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                {lowStockMedicines.length} medicine(s) with low stock
              </Text>
            </View>
          )}
          {expiringMedicines.length > 0 && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                {expiringMedicines.length} medicine(s) expiring soon
              </Text>
            </View>
          )}
        </View>
      )}

      {medicines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No medications added yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to add your first medication
          </Text>
        </View>
      ) : (
        <FlatList
          data={medicines}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={navigateToAdd}
        label="Add Medicine"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  alertsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alertBox: {
    backgroundColor: colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  medicineCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
  },
  medicineDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  lowStockText: {
    color: colors.warning,
  },
  timingsContainer: {
    marginBottom: 12,
  },
  timingsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timingsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timingText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  warningContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  detailsButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});
