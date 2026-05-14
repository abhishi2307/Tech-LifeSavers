import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import dayjs from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useMedicationStore, useAdherenceStore, useFamilyStore } from '../../store';
import { medicationService } from '../../services/medicationService';
import { useStockMonitor } from '../../hooks/useStockMonitor';
import { Medicine } from '../../types';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

// Fallback for LinearGradient if package installation fails
let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  LinearGradient = ({ children, style }: any) => <View style={[style, { backgroundColor: colors.primary }]}>{children}</View>;
}

const { width } = Dimensions.get('window');

type UpcomingReminder = { medicine: Medicine; timing: string; scheduledTime: string };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS = [
  { icon: 'plus', label: 'Add Med', route: '/medications/add', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: 'camera-outline', label: 'Scan Rx', route: '/ocr', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: 'robot-outline', label: 'AI Chat', route: '/chatbot', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: 'account-group-outline', label: 'Family', route: '/(tabs)/family', color: '#10B981', bg: '#F0FDF4' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile, userId } = useAuthStore();
  const { medicines, setMedicines } = useMedicationStore();
  const { stats, setStats } = useAdherenceStore();
  const { members } = useFamilyStore();
  const { lowStockMedicines, expiringMedicines, hasAlerts } = useStockMonitor();

  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [activeMeds, adherenceStats, reminders] = await Promise.all([
        medicationService.getActiveMedicines(userId),
        medicationService.getAdherenceStats(userId),
        medicationService.getUpcomingReminders(userId),
      ]);
      setMedicines(activeMeds);
      setStats(adherenceStats);
      setUpcomingReminders(reminders as UpcomingReminder[]);
    } catch { /* silent */ }
  }, [userId, setMedicines, setStats]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkTaken = async (item: UpcomingReminder) => {
    if (!userId) return;
    try {
      await medicationService.markAsTaken(item.medicine.id, userId, item.timing);
      Toast.show({ 
        type: 'success', 
        text1: 'Dose Recorded', 
        text2: `You've taken your ${item.medicine.name}`,
        visibilityTime: 2500 
      });
      loadData();
    } catch {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Please try again later' });
    }
  };

  const firstName = userProfile?.firstName || 'Aanchal';
  const activeMedCount = medicines.filter((m) => m.isActive).length;
  const adherencePct = stats?.adherencePercentage ?? 0;

  const headerHeight = insets.top + 180;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Dynamic Animated Header Background */}
      <Animated.View 
        style={[
          styles.headerBg, 
          { 
            height: headerHeight,
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [-100, 0, headerHeight],
                outputRange: [50, 0, -headerHeight],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={[colors.primary, '#1D4ED8']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#fff"
            progressViewOffset={insets.top + 20}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile & SOS Row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.nameText}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.sosButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/sos')}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.sosGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="alarm-light" size={18} color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push('/(tabs)/more')}
            >
              <MaterialCommunityIcons name="cog" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="pill" size={20} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.statValue}>{activeMedCount}</Text>
              <Text style={styles.statLabel}>Active Meds</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="chart-donut" size={20} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.statValue}>{Math.round(adherencePct)}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="account-group" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Family</Text>
            </View>
          </View>
        </View>

        {/* Alerts Section (Floating) */}
        {hasAlerts && (
          <TouchableOpacity style={styles.alertsBanner} activeOpacity={0.9}>
            <View style={styles.alertIconBg}>
              <MaterialCommunityIcons name="alert-decagram" size={24} color={colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Health Notifications</Text>
              <Text style={styles.alertSub}>
                {lowStockMedicines.length > 0 ? `${lowStockMedicines.length} meds running low. ` : ''}
                {expiringMedicines.length > 0 ? `${expiringMedicines.length} meds expiring soon.` : ''}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <MaterialCommunityIcons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/medications')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleCard}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : upcomingReminders.length === 0 ? (
              <View style={styles.emptySchedule}>
                <View style={styles.emptyIconBg}>
                  <MaterialCommunityIcons name="check-all" size={40} color={colors.success} />
                </View>
                <Text style={styles.emptyTitle}>You're all set!</Text>
                <Text style={styles.emptySub}>No pending doses for the rest of today.</Text>
              </View>
            ) : (
              upcomingReminders.slice(0, 3).map((item, idx) => (
                <View key={idx} style={[styles.reminderItem, idx !== 0 && styles.reminderBorder]}>
                  <View style={styles.reminderTimeBox}>
                    <Text style={styles.timeText}>{item.timing}</Text>
                    <View style={styles.timeLine} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.medName}>{item.medicine.name}</Text>
                    <Text style={styles.medDosage}>{item.medicine.dosage} · {item.medicine.instructions || 'With water'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.takeButton} 
                    onPress={() => handleMarkTaken(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.takeButtonText}>TAKE</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* AI Health Insight (Premium Feel) */}
        <View style={styles.insightCard}>
          <View style={styles.insightContent}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.insightTitle}>AI Health Insight</Text>
            </View>
            <Text style={styles.insightBody}>
              Your adherence is up by 12% this week! Keep it up, Aanchal. Consistency is key to effective recovery.
            </Text>
          </View>
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...shadows.md,
  },
  scrollContent: { paddingHorizontal: spacing.md },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greetingText: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  nameText: { ...typography.h1, color: '#fff', marginTop: 2 },
  
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sosButton: { borderRadius: radius.full, overflow: 'hidden', ...shadows.sm },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  sosText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { ...typography.h3, color: colors.text, lineHeight: 24 },
  statLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: colors.borderLight },

  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    ...shadows.sm,
  },
  alertIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  alertContent: { flex: 1 },
  alertTitle: { ...typography.body, fontWeight: '700', color: colors.text },
  alertSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  section: { marginBottom: spacing.xl },
  sectionTitleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  sectionHeader: { 
    ...typography.h3, 
    color: colors.text, 
    marginBottom: spacing.md 
  },
  seeAllText: { 
    ...typography.bodySm, 
    color: colors.primary, 
    fontWeight: '700',
    marginBottom: spacing.md 
  },

  actionsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  actionItem: { 
    alignItems: 'center', 
    width: (width - spacing.md * 2) / 4.5 
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...shadows.sm,
  },
  actionText: { 
    ...typography.caption, 
    color: colors.text, 
    fontWeight: '700', 
    textAlign: 'center' 
  },

  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.md,
  },
  emptySchedule: { alignItems: 'center', paddingVertical: 40 },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { ...typography.h4, color: colors.text, marginBottom: 4 },
  emptySub: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  reminderBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reminderTimeBox: {
    width: 65,
    alignItems: 'center',
  },
  timeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  timeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.primary + '30',
    marginTop: 4,
  },
  reminderInfo: { flex: 1, paddingHorizontal: spacing.sm },
  medName: { ...typography.body, fontWeight: '700', color: colors.text },
  medDosage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  takeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  takeButtonText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '800' 
  },

  insightCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.sm,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  insightContent: {
    padding: spacing.lg,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    ...typography.bodySm,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  loader: { paddingVertical: 40 },
});
