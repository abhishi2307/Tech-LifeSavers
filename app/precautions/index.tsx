import { useEffect, useCallback, useState } from 'react';
import { View, ScrollView, Pressable, StatusBar, Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';
import { useAuthStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services/medicationService';
import { Medicine } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function PrecautionsScreen() {
  const router = useRouter();
  const { colors: c, isDark } = useAppTheme();
  const { userId, userProfile } = useAuthStore();
  const { medicines, setMedicines } = useMedicationStore();
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<Array<{ med1: string; med2: string }>>([]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const active = await medicationService.getActiveMedicines(userId);
      setMedicines(active);

      const found: Array<{ med1: string; med2: string }> = [];
      for (const med of active) {
        if (med.interactions && med.interactions.length > 0) {
          for (const other of active) {
            if (other.id !== med.id) {
              const hit = med.interactions.some((i) => other.name.toLowerCase().includes(i.toLowerCase()));
              if (hit && !found.some((f) => (f.med1 === med.name && f.med2 === other.name) || (f.med1 === other.name && f.med2 === med.name))) {
                found.push({ med1: med.name, med2: other.name });
              }
            }
          }
        }
      }
      setConflicts(found);
    } catch {}
    setLoading(false);
  }, [userId, setMedicines]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeMeds = medicines.filter((m) => m.isActive);
  const userAllergies = userProfile?.allergies ?? [];
  const medsWithPrecautions = activeMeds.filter(
    (m) => m.precautions || (m.allergies && m.allergies.length > 0) || (m.interactions && m.interactions.length > 0)
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'android' ? 44 : 58, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 }}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={c.primary} />
          <Text style={{ fontSize: 16, color: c.primary, fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 32, fontWeight: '800', color: c.text, letterSpacing: -0.8 }}>Precautions</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginTop: 2 }}>Allergies & drug interactions</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        >
          {/* Conflict banner */}
          {conflicts.length > 0 && (
            <View style={{ backgroundColor: '#FF950014', borderRadius: 18, padding: 18, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF9500' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF9500', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="alert" size={20} color="#fff" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#D97706', flex: 1 }}>Interactions Detected</Text>
              </View>
              {conflicts.map((cf, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF9500', marginTop: 7, flexShrink: 0 }} />
                  <Text style={{ fontSize: 14, color: '#B45309', flex: 1 }}>
                    <Text style={{ fontWeight: '700' }}>{cf.med1}</Text> may interact with <Text style={{ fontWeight: '700' }}>{cf.med2}</Text>
                  </Text>
                </View>
              ))}
              <Text style={{ fontSize: 12, color: '#92400E', marginTop: 6 }}>Consult your doctor or pharmacist.</Text>
            </View>
          )}

          {/* User allergies */}
          {userAllergies.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Your Allergies</Text>
              <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {userAllergies.map((a, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FF3B3014', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <MaterialCommunityIcons name="alert-circle" size={13} color="#FF3B30" />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF3B30' }}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Per-med precautions */}
          {medsWithPrecautions.length > 0 ? (
            <>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
                Medication Precautions
              </Text>
              <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
                {medsWithPrecautions.map((med, i) => (
                  <View key={med.id}>
                    {i > 0 && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
                    <View style={{ padding: 16, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF14', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MaterialCommunityIcons name="pill" size={18} color="#007AFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: c.text }}>{med.name}</Text>
                          <Text style={{ fontSize: 12, color: c.primary, marginTop: 1 }}>{med.dosage}</Text>
                        </View>
                      </View>

                      {med.precautions && (
                        <View style={{ marginLeft: 48, backgroundColor: c.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.5, marginBottom: 4 }}>PRECAUTIONS</Text>
                          <Text style={{ fontSize: 14, color: c.textSecondary, lineHeight: 20 }}>{med.precautions}</Text>
                        </View>
                      )}

                      {med.allergies && med.allergies.length > 0 && (
                        <View style={{ marginLeft: 48 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.5, marginBottom: 6 }}>ALLERGENS</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {med.allergies.map((a, ai) => (
                              <View key={ai} style={{ backgroundColor: '#FF3B3014', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF3B30' }}>{a}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {med.interactions && med.interactions.length > 0 && (
                        <View style={{ marginLeft: 48 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.5, marginBottom: 6 }}>INTERACTIONS</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {med.interactions.map((inter, ii) => (
                              <View key={ii} style={{ backgroundColor: '#FF950014', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }}>{inter}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : activeMeds.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 64, gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#007AFF14', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="pill" size={36} color="#007AFF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>No active medications</Text>
              <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>Add medications to see precautions here</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#34C75914', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#15803D' }}>No precautions on file</Text>
                <Text style={{ fontSize: 13, color: '#166534', marginTop: 3 }}>
                  {activeMeds.length} medication{activeMeds.length !== 1 ? 's' : ''} active — all clear
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
