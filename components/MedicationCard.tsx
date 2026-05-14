import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Medicine } from '../types';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';
import Card from './Card';

/**
 * Reusable medication card component with professional styling
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
  const expiryDate = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
  const isExpiring = expiryDate && expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Card 
      style={styles.container} 
      variant="elevated"
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={styles.touchable}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{medicine.name}</Text>
            <Text style={styles.dosage}>{medicine.dosage}</Text>
          </View>
          {showActions && (
            <View style={styles.actions}>
              {onEdit && (
                <IconButton
                  icon="pencil-outline"
                  size={20}
                  onPress={onEdit}
                  style={styles.actionButton}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  onPress={onDelete}
                  style={styles.actionButton}
                />
              )}
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{medicine.frequency.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Stock</Text>
            <Text style={[
              styles.detailValue,
              isLowStock && styles.warningText
            ]}>
              {medicine.stockCount} units
            </Text>
          </View>
        </View>

        <View style={styles.timingsContainer}>
          <Text style={styles.detailLabel}>Daily Schedule</Text>
          <View style={styles.timingsList}>
            {medicine.timings.map((timing, index) => (
              <View key={index} style={styles.timingChip}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.primary} />
                <Text style={styles.timingText}>{timing}</Text>
              </View>
            ))}
          </View>
        </View>

        {showStockWarning && (isLowStock || isExpiring) && (
          <View style={styles.alerts}>
            {isLowStock && (
              <View style={[styles.alertBadge, { backgroundColor: colors.warning + '15' }]}>
                <MaterialCommunityIcons name="alert-outline" size={14} color={colors.warning} />
                <Text style={[styles.alertText, { color: colors.warning }]}>Low Stock</Text>
              </View>
            )}
            {isExpiring && (
              <View style={[styles.alertBadge, { backgroundColor: colors.error + '15' }]}>
                <MaterialCommunityIcons name="calendar-alert" size={14} color={colors.error} />
                <Text style={[styles.alertText, { color: colors.error }]}>Expiring Soon</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    padding: 0,
  },
  touchable: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    color: colors.text,
  },
  dosage: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    ...typography.overline,
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.text,
  },
  warningText: {
    color: colors.error,
  },
  timingsContainer: {
    marginBottom: spacing.sm,
  },
  timingsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '08',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary + '15',
    gap: 4,
  },
  timingText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  alerts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  alertText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
