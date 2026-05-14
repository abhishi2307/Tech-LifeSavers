import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Medicine } from '../types';
import { colors } from '../constants/theme';

/**
 * Reusable medication card component
 * Displays medicine information with quick actions
 */
interface MedicationCardProps {
  medicine: Medicine;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showStockWarning?: boolean;
}

export function MedicationCard({
  medicine,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
  showStockWarning = true,
}: MedicationCardProps) {
  const isLowStock = medicine.stockCount <= medicine.refillThreshold;
  const isExpiring = medicine.expiryDate && new Date(medicine.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{medicine.name}</Text>
          <Text style={styles.dosage}>{medicine.dosage}</Text>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={onEdit}
              />
            )}
            {onDelete && (
              <IconButton
                icon="delete"
                size={20}
                iconColor={colors.error}
                onPress={onDelete}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{medicine.frequency.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={[
            styles.detailValue,
            showStockWarning && isLowStock && styles.warningText
          ]}>
            {medicine.stockCount}
          </Text>
        </View>
      </View>

      <View style={styles.timingsContainer}>
        <Text style={styles.timingsLabel}>Timings:</Text>
        <View style={styles.timingsList}>
          {medicine.timings.map((timing, index) => (
            <View key={index} style={styles.timingChip}>
              <Text style={styles.timingText}>{timing}</Text>
            </View>
          ))}
        </View>
      </View>

      {(showStockWarning && (isLowStock || isExpiring)) && (
        <View style={styles.warningContainer}>
          {isLowStock && (
            <Text style={styles.warningText}>⚠️ Low stock</Text>
          )}
          {isExpiring && (
            <Text style={styles.warningText}>⚠️ Expiring soon</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
  },
  details: {
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
  warningText: {
    color: colors.warning,
  },
  timingsContainer: {
    marginBottom: 8,
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
    marginTop: 8,
  },
});
