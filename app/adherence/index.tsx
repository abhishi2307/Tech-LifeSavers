import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ProgressBar } from 'react-native-paper';
import { Button, Header, Card } from '../../components';
import { useAuthStore, useAdherenceStore } from '../../store';
import { medicationService } from '../../services';
import { AdherenceStats, Medicine } from '../../types';
import { colors } from '../../constants/theme';

/**
 * Adherence dashboard screen
 * Shows adherence statistics, today's schedule, and upcoming reminders
 */
export default function AdherenceDashboardScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { stats, setStats, logs, setLogs } = useAdherenceStore();

  const [loading, setLoading] = useState(false);
  const [todayMedicines, setTodayMedicines] = useState<Medicine[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  useEffect(() => {
    loadAdherenceData();
  }, [userId]);

  const loadAdherenceData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [adherenceStats, todayLogs, medicines, reminders] = await Promise.all([
        medicationService.getAdherenceStats(userId),
        medicationService.getTodayLogs(userId),
        medicationService.getActiveMedicines(userId),
        medicationService.getUpcomingReminders(userId),
      ]);

      setStats(adherenceStats);
      setLogs(todayLogs);
      setTodayMedicines(medicines);
      setUpcomingReminders(reminders);
    } catch (error) {
      console.error('Failed to load adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToMedications = () => {
    router.push('/medications/index');
  };

  const handleMarkTaken = async (medicine: Medicine, scheduledTime: string) => {
    try {
      await medicationService.markAsTaken(medicine.id, scheduledTime);
      await loadAdherenceData();
    } catch (error) {
      console.error('Failed to mark as taken:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const adherenceColor = stats?.adherencePercentage && stats.adherencePercentage >= 80 
    ? colors.success 
    : stats?.adherencePercentage && stats.adherencePercentage >= 50 
    ? colors.warning 
    : colors.error;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Header
          title="Adherence Dashboard"
          subtitle="Track your medication adherence"
        />

        {stats && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Overall Adherence</Text>
            <View style={styles.progressContainer}>
              <Text style={[styles.percentageText, { color: adherenceColor }]}>
                {stats.adherencePercentage}%
              </Text>
              <ProgressBar
                progress={stats.adherencePercentage / 100}
                color={adherenceColor}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalTaken}</Text>
                <Text style={styles.statLabel}>Taken</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.error }]}>{stats.totalMissed}</Text>
                <Text style={styles.statLabel}>Missed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{stats.totalDelayed}</Text>
                <Text style={styles.statLabel}>Delayed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stats.streakDays}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </Card>
        )}

        {stats && (
          <Card style={styles.todayCard}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <View style={styles.todayStats}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatValue}>{stats.todayTaken}</Text>
                <Text style={styles.todayStatLabel}>Taken</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={[styles.todayStatValue, { color: colors.error }]}>{stats.todayMissed}</Text>
                <Text style={styles.todayStatLabel}>Missed</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={[styles.todayStatValue, { color: colors.textSecondary }]}>{stats.todayPending}</Text>
                <Text style={styles.todayStatLabel}>Pending</Text>
              </View>
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        {upcomingReminders.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No upcoming reminders today</Text>
          </Card>
        ) : (
          upcomingReminders.map((reminder, index) => (
            <Card key={index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderMedicine}>{reminder.medicine.name}</Text>
                  <Text style={styles.reminderDosage}>{reminder.medicine.dosage}</Text>
                </View>
                <Text style={styles.reminderTime}>{reminder.timing}</Text>
              </View>
              <TouchableOpacity
                style={styles.takeButton}
                onPress={() => handleMarkTaken(reminder.medicine, reminder.scheduledTime)}
              >
                <Text style={styles.takeButtonText}>Mark as Taken</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <Button
            mode="contained"
            onPress={handleNavigateToMedications}
            style={styles.actionButton}
          >
            Manage Medications
          </Button>
          <Button
            mode="outlined"
            onPress={loadAdherenceData}
            style={styles.actionButton}
          >
            Refresh
          </Button>
        </Card>
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
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  todayCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  todayStat: {
    alignItems: 'center',
  },
  todayStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  todayStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  reminderCard: {
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderMedicine: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reminderDosage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reminderTime: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  takeButton: {
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionButton: {
    marginTop: 8,
  },
});
