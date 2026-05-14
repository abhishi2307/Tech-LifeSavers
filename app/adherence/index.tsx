import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useAdherenceStore } from '../../store';
import { medicationService } from '../../services';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Header, Card } from '../../components';

export default function AdherenceDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { stats, setStats, isLoading, setIsLoading } = useAdherenceStore();

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await medicationService.getAdherenceStats(userId);
      setStats(data);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [userId, setStats, setIsLoading]);

  useEffect(() => { loadData(); }, [loadData]);

  const adherencePct = stats?.adherencePercentage ?? 0;
  const adherenceColor = adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Header title="Adherence Report" subtitle="Your health consistency tracking" showBack centered />

      <ScrollView 
        style={styles.flex} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            <Card style={styles.mainCard} variant="elevated">
              <View style={styles.statsRow}>
                <View style={[styles.ring, { borderColor: adherenceColor + '20' }]}>
                   <View style={[styles.innerRing, { borderColor: adherenceColor }]}>
                     <Text style={[styles.pct, { color: adherenceColor }]}>{Math.round(adherencePct)}%</Text>
                   </View>
                </View>
                <View style={styles.statsInfo}>
                   <Text style={styles.statLabel}>Monthly Score</Text>
                   <Text style={styles.statStatus}>
                     {adherencePct >= 80 ? 'Excellent' : adherencePct >= 50 ? 'Good' : 'Needs Review'}
                   </Text>
                   <Text style={styles.statDesc}>
                     {stats?.totalTaken ?? 0} doses taken this month
                   </Text>
                </View>
              </View>
            </Card>

            <View style={styles.grid}>
              <Card style={styles.gridItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                <Text style={styles.gridVal}>{stats?.totalTaken ?? 0}</Text>
                <Text style={styles.gridLabel}>Taken</Text>
              </Card>
              <Card style={styles.gridItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
                <Text style={styles.gridVal}>{stats?.totalMissed ?? 0}</Text>
                <Text style={styles.gridLabel}>Missed</Text>
              </Card>
            </View>

            <Card style={styles.streakCard} variant="flat">
               <MaterialCommunityIcons name="fire" size={32} color={colors.accent} />
               <View>
                 <Text style={styles.streakTitle}>{stats?.streakDays ?? 0} Day Streak</Text>
                 <Text style={styles.streakSub}>Keep up the great work!</Text>
               </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { padding: spacing.md },
  mainCard: { padding: 24, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  ring: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pct: { ...typography.h1, fontSize: 24 },
  statsInfo: { flex: 1 },
  statLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  statStatus: { ...typography.h3, marginVertical: 4 },
  statDesc: { ...typography.bodySm, color: colors.textTertiary },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridItem: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  gridVal: { ...typography.h2, marginTop: 8 },
  gridLabel: { ...typography.caption, color: colors.textSecondary },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: colors.accent + '10' },
  streakTitle: { ...typography.h4 },
  streakSub: { ...typography.caption, color: colors.textSecondary },
});
