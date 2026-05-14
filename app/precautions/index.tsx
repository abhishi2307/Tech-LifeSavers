import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services/medicationService';
import { Medicine } from '../../types';
import { colors } from '../../constants/theme';

export default function PrecautionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, userProfile } = useAuthStore();
  const { medicines, setMedicines } = useMedicationStore();
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<Array<{ med1: string; med2: string }>>([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const active = await medicationService.getActiveMedicines(userId);
      setMedicines(active);

      // Detect interaction conflicts
      const found: Array<{ med1: string; med2: string }> = [];
      for (const med of active) {
        if (med.interactions && med.interactions.length > 0) {
          for (const otherMed of active) {
            if (otherMed.id !== med.id) {
              const nameMatches = med.interactions.some((i) =>
                otherMed.name.toLowerCase().includes(i.toLowerCase())
              );
              if (nameMatches) {
                const already = found.some(
                  (f) =>
                    (f.med1 === med.name && f.med2 === otherMed.name) ||
                    (f.med1 === otherMed.name && f.med2 === med.name)
                );
                if (!already) {
                  found.push({ med1: med.name, med2: otherMed.name });
                }
              }
            }
          }
        }
      }
      setConflicts(found);
    } catch { /* silent */ }
    setLoading(false);
  }, [userId, setMedicines]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeMeds = medicines.filter((m) => m.isActive);
  const userAllergies = userProfile?.allergies ?? [];

  const medsWithPrecautions = activeMeds.filter(
    (m) => m.precautions || (m.allergies && m.allergies.length > 0) || (m.interactions && m.interactions.length > 0)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Precautions & Interactions</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Conflict alert */}
          {conflicts.length > 0 && (
            <Card style={styles.conflictCard}>
              <Card.Content>
                <Text style={styles.conflictTitle}>⚠️ Potential Interactions Detected</Text>
                {conflicts.map((c, i) => (
                  <Text key={i} style={styles.conflictItem}>
                    • {c.med1} may interact with {c.med2}
                  </Text>
                ))}
                <Text style={styles.conflictNote}>
                  Consult your doctor or pharmacist about these combinations.
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* User allergies */}
          {userAllergies.length > 0 && (
            <Card style={styles.section}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Your Allergies</Text>
                <View style={styles.chipRow}>
                  {userAllergies.map((a, i) => (
                    <View key={i} style={styles.allergyChip}>
                      <Text style={styles.allergyChipText}>⚠️ {a}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Per-medicine precautions */}
          {medsWithPrecautions.length > 0 ? (
            medsWithPrecautions.map((med) => (
              <Card key={med.id} style={styles.section}>
                <Card.Content>
                  <Text style={styles.medName}>💊 {med.name}</Text>
                  <Text style={styles.medDosage}>{med.dosage}</Text>

                  {med.precautions ? (
                    <View style={styles.precautionRow}>
                      <Text style={styles.precautionLabel}>Precautions:</Text>
                      <Text style={styles.precautionText}>{med.precautions}</Text>
                    </View>
                  ) : null}

                  {med.allergies && med.allergies.length > 0 ? (
                    <View style={styles.precautionRow}>
                      <Text style={styles.precautionLabel}>Allergens:</Text>
                      <View style={styles.chipRow}>
                        {med.allergies.map((a, i) => (
                          <View key={i} style={styles.allergyChip}>
                            <Text style={styles.allergyChipText}>{a}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {med.interactions && med.interactions.length > 0 ? (
                    <View style={styles.precautionRow}>
                      <Text style={styles.precautionLabel}>Known Interactions:</Text>
                      <View style={styles.chipRow}>
                        {med.interactions.map((inter, i) => (
                          <View key={i} style={styles.interactionChip}>
                            <Text style={styles.interactionChipText}>{inter}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            ))
          ) : activeMeds.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyTitle}>No active medications</Text>
              <Text style={styles.emptySub}>Add medications to see precautions here</Text>
            </View>
          ) : (
            <Card style={styles.section}>
              <Card.Content>
                <Text style={styles.noPrecautions}>
                  ✅ No precautions recorded for your current {activeMeds.length} medication(s).
                </Text>
                <Text style={styles.noPrecautionsSub}>
                  Add precautions when editing individual medications.
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  loader: { marginTop: 60 },
  content: { padding: 16, paddingBottom: 40 },
  conflictCard: {
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 16,
    elevation: 2,
  },
  conflictTitle: { fontSize: 15, fontWeight: '700', color: '#E65100', marginBottom: 10 },
  conflictItem: { fontSize: 14, color: '#BF360C', marginBottom: 4 },
  conflictNote: { fontSize: 12, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  section: { borderRadius: 14, elevation: 2, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  allergyChip: {
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  allergyChipText: { fontSize: 12, color: colors.error, fontWeight: '600' },
  interactionChip: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.warning + '60',
  },
  interactionChipText: { fontSize: 12, color: '#E65100', fontWeight: '600' },
  medName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  medDosage: { fontSize: 13, color: colors.primary, marginBottom: 10 },
  precautionRow: { marginBottom: 10 },
  precautionLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
  precautionText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  noPrecautions: { fontSize: 14, color: colors.text, fontWeight: '600', marginBottom: 6 },
  noPrecautionsSub: { fontSize: 13, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary },
});
