import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useAdherenceStore, useMedicationStore } from '../../store';
import { medicationService } from '../../services';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Card, Header } from '../../components';

const { width } = Dimensions.get('window');

export default function AdherenceScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { stats, setStats, isLoading, setIsLoading } = useAdherenceStore();
  const { medicines } = useMedicationStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadStats = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await medicationService.getAdherenceStats(userId);
      setStats(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [userId, setStats, setIsLoading]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const adherencePct = stats?.adherencePercentage ?? 0;
  const adherenceColor = adherencePct >= 80 ? colors.success : adherencePct >= 50 ? colors.warning : colors.error;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Header title="Health Insights" subtitle="Track your recovery progress" centered />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing health data…</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Main Score Card (Premium Gradient Look) */}
            <View style={styles.scoreCardContainer}>
              <View style={[styles.scoreCard, { borderTopColor: adherenceColor }]}>
                <View style={styles.scoreHeader}>
                  <View>
                    <Text style={styles.scoreTitle}>Overall Adherence</Text>
                    <Text style={styles.scoreSubtitle}>Based on last 30 days</Text>
                  </View>
                  <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color={adherenceColor} />
                </View>

                <View style={styles.scoreCenter}>
                  <View style={[styles.scoreRing, { borderColor: adherenceColor + '15' }]}>
                    <View style={[styles.scoreInnerRing, { borderColor: adherenceColor }]}>
                      <Text style={[styles.scoreValue, { color: adherenceColor }]}>
                        {Math.round(adherencePct)}%
                      </Text>
                      <Text style={styles.scoreLabel}>Health Score</Text>
                    </View>
                  </View>
                  
                  <View style={styles.scoreMeta}>
                    <View style={styles.metaRow}>
                      <View style={[styles.dot, { backgroundColor: colors.success }]} />
                      <Text style={styles.metaText}>{stats?.totalTaken ?? 0} Doses Taken</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <View style={[styles.dot, { backgroundColor: colors.error }]} />
                      <Text style={styles.metaText}>{stats?.totalMissed ?? 0} Doses Missed</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <View style={[styles.dot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.metaText}>{stats?.totalScheduled ?? 0} Total Scheduled</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.statusBanner, { backgroundColor: adherenceColor + '10' }]}>
                  <MaterialCommunityIcons 
                    name={adherencePct >= 80 ? "check-decagram" : "alert-circle"} 
                    size={16} 
                    color={adherenceColor} 
                  />
                  <Text style={[styles.statusText, { color: adherenceColor }]}>
                    {adherencePct >= 80 
                      ? 'Excellent! You are staying very consistent.' 
                      : adherencePct >= 50 
                      ? 'Good progress. Try to minimize missed doses.' 
                      : 'Attention needed. Your consistency is low.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Streak & Milestone */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Activity Milestones</Text>
              <Card style={styles.milestoneCard} variant="flat">
                <View style={styles.milestoneIcon}>
                  <MaterialCommunityIcons name="fire" size={28} color={colors.accent} />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>{stats?.streakDays ?? 0} Day Streak!</Text>
                  <Text style={styles.milestoneSub}>You haven't missed a dose in {stats?.streakDays ?? 0} days.</Text>
                  <View style={styles.streakTrack}>
                    <View style={[styles.streakFill, { width: '70%' }]} />
                  </View>
                </View>
              </Card>
            </View>

            {/* AI Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Smart Recommendations</Text>
              <View style={styles.tipGrid}>
                <TouchableOpacity style={styles.tipCard} activeOpacity={0.8}>
                  <View style={[styles.tipIconBox, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="alarm" size={20} color="#1E40AF" />
                  </View>
                  <Text style={styles.tipTitle}>Morning Sync</Text>
                  <Text style={styles.tipBody}>Most missed doses happen before 10 AM. Set a secondary alarm.</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tipCard} activeOpacity={0.8}>
                  <View style={[styles.tipIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="food-apple" size={20} color="#166534" />
                  </View>
                  <Text style={styles.tipTitle}>Routine Pairing</Text>
                  <Text style={styles.tipBody}>Try taking your meds right after brushing your teeth.</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Summary Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Monthly Summary</Text>
              <View style={styles.statGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats?.totalTaken ?? 0}</Text>
                  <Text style={styles.gridLabel}>On Time</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridItem}>
                  <Text style={styles.gridValue}>{stats?.totalDelayed ?? 0}</Text>
                  <Text style={styles.gridLabel}>Delayed</Text>
                </View>
                <View style={styles.gridDivider} />
                <View style={styles.gridItem}>
                   <Text style={[styles.gridValue, { color: colors.error }]}>{stats?.totalMissed ?? 0}</Text>
                  <Text style={styles.gridLabel}>Missed</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 100 },
  loadingWrap: { height: 400, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodySm, color: colors.textSecondary, marginTop: 12 },

  section: { paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  sectionHeader: { ...typography.h4, color: colors.textTertiary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },

  scoreCardContainer: { padding: spacing.md, marginBottom: spacing.sm },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    borderTopWidth: 4,
  },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  scoreTitle: { ...typography.h3, color: colors.text },
  scoreSubtitle: { ...typography.caption, color: colors.textSecondary },

  scoreCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.xl },
  scoreRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInnerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { ...typography.h1, fontSize: 36, lineHeight: 44 },
  scoreLabel: { ...typography.caption, fontWeight: '800', color: colors.textTertiary, textTransform: 'uppercase' },

  scoreMeta: { flex: 1, gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { ...typography.bodySm, color: colors.textSecondary, fontWeight: '600' },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  statusText: { ...typography.caption, fontWeight: '700', flex: 1 },

  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
  },
  milestoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { ...typography.h3, color: '#92400E' },
  milestoneSub: { ...typography.caption, color: '#B45309', marginBottom: 10 },
  streakTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  streakFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },

  tipGrid: { flexDirection: 'row', gap: spacing.md },
  tipCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  tipIconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tipTitle: { ...typography.h4, fontSize: 14, marginBottom: 4 },
  tipBody: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },

  statGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  gridItem: { flex: 1, alignItems: 'center' },
  gridValue: { ...typography.h2, color: colors.primary },
  gridLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  gridDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },
});
