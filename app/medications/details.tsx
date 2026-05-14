import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, IconButton, Divider } from 'react-native-paper';
import { Button, Header, Card } from '../../components';
import { useMedicationStore, useAdherenceStore } from '../../store';
import { medicationService } from '../../services';
import { Medicine, MedicationLog, AdherenceStatus } from '../../types';
import { colors } from '../../constants/theme';

/**
 * Medicine details screen
 * Shows detailed information about a medicine with adherence history
 */
export default function MedicineDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSelectedMedicine } = useMedicationStore();
  const { logs, setLogs } = useAdherenceStore();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMedicineDetails();
  }, [id]);

  const loadMedicineDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const med = await medicationService.getMedicine(id);
      if (med) {
        setMedicine(med);
        setSelectedMedicine(med);

        // Load today's logs for this medicine
        const allLogs = await medicationService.getMedicationLogsByMedicineId(id);
        const today = new Date().toISOString().split('T')[0];
        const todayMedLogs = allLogs.filter((log: MedicationLog) => log.scheduledTime.startsWith(today));
        setTodayLogs(todayMedLogs);
      }
    } catch (error) {
      console.error('Failed to load medicine details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/medications/edit?id=${id}`);
  };

  const handleDelete = async () => {
    if (!medicine) return;

    try {
      await medicationService.deleteMedicine(medicine.id);
      router.back();
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    }
  };

  const handleMarkAsTaken = async (scheduledTime: string) => {
    if (!medicine) return;

    try {
      await medicationService.markAsTaken(medicine.id, scheduledTime);
      await loadMedicineDetails();
    } catch (error) {
      console.error('Failed to mark as taken:', error);
    }
  };

  const handleMarkAsMissed = async (scheduledTime: string) => {
    if (!medicine) return;

    try {
      await medicationService.markAsMissed(medicine.id, scheduledTime);
      await loadMedicineDetails();
    } catch (error) {
      console.error('Failed to mark as missed:', error);
    }
  };

  const handleMarkAsDelayed = async (scheduledTime: string) => {
    if (!medicine) return;

    try {
      await medicationService.markAsDelayed(medicine.id, scheduledTime);
      await loadMedicineDetails();
    } catch (error) {
      console.error('Failed to mark as delayed:', error);
    }
  };

  const getLogStatusColor = (status: AdherenceStatus) => {
    switch (status) {
      case 'taken':
        return colors.success;
      case 'missed':
        return colors.error;
      case 'delayed':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getLogStatusIcon = (status: AdherenceStatus) => {
    switch (status) {
      case 'taken':
        return '✓';
      case 'missed':
        return '✗';
      case 'delayed':
        return '⏱';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!medicine) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Medicine not found</Text>
      </View>
    );
  }

  const isLowStock = medicine.stockCount <= medicine.refillThreshold;
  const isExpiring = medicine.expiryDate && new Date(medicine.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Header
          title={medicine.name}
          subtitle={medicine.dosage}
        />

        <Card style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={styles.detailValue}>{medicine.frequency.replace(/_/g, ' ')}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{medicine.medicineType}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text style={[styles.detailValue, isLowStock && styles.warningText]}>
              {medicine.stockCount}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refill Threshold:</Text>
            <Text style={styles.detailValue}>{medicine.refillThreshold}</Text>
          </View>

          {medicine.category && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{medicine.category}</Text>
              </View>
            </>
          )}

          {medicine.expiryDate && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiry Date:</Text>
                <Text style={[styles.detailValue, isExpiring && styles.warningText]}>
                  {medicine.expiryDate}
                </Text>
              </View>
            </>
          )}

          {medicine.instructions && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.instructionsContainer}>
                <Text style={styles.detailLabel}>Instructions:</Text>
                <Text style={styles.instructionsText}>{medicine.instructions}</Text>
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>{medicine.startDate}</Text>
          </View>

          {medicine.endDate && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>{medicine.endDate}</Text>
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, !medicine.isActive && styles.inactiveText]}>
              {medicine.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Timings</Text>
        <Card style={styles.card}>
          <View style={styles.timingsContainer}>
            {medicine.timings.map((timing, index) => (
              <View key={index} style={styles.timingChip}>
                <Text style={styles.timingText}>{timing}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todayLogs.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No scheduled doses for today</Text>
          </Card>
        ) : (
          todayLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={styles.logTime}>{log.scheduledTime.split('T')[1]?.substring(0, 5) || log.scheduledTime}</Text>
                  <Text style={[
                    styles.logStatus,
                    { color: getLogStatusColor(log.status) },
                  ]}>
                    {getLogStatusIcon(log.status)} {log.status.toUpperCase()}
                  </Text>
                </View>
                {log.status === 'pending' && (
                  <View style={styles.logActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsTaken(log.scheduledTime)}
                    >
                      <Text style={styles.actionButtonText}>Take</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonSecondary]}
                      onPress={() => handleMarkAsDelayed(log.scheduledTime)}
                    >
                      <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                        Delay
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleMarkAsMissed(log.scheduledTime)}
                    >
                      <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                        Miss
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {log.takenTime && (
                <Text style={styles.takenTimeText}>
                  Taken at {new Date(log.takenTime).toLocaleTimeString()}
                </Text>
              )}
              {log.notes && (
                <Text style={styles.notesText}>{log.notes}</Text>
              )}
            </Card>
          ))
        )}

        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={handleEdit}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Medicine
          </Button>
          <Button
            mode="outlined"
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteButton]}
            icon="delete"
          >
            Delete Medicine
          </Button>
        </View>
      </ScrollView>
    </View>
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
  card: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  warningText: {
    color: colors.warning,
  },
  inactiveText: {
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: 8,
  },
  instructionsContainer: {
    paddingVertical: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  timingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingChip: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  logCard: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonSecondary: {
    backgroundColor: colors.warning,
  },
  actionButtonTextSecondary: {
    color: '#FFFFFF',
  },
  actionButtonDanger: {
    backgroundColor: colors.error,
  },
  actionButtonTextDanger: {
    color: '#FFFFFF',
  },
  takenTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    marginTop: 8,
  },
  editButton: {
    borderColor: colors.primary,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
  },
});
