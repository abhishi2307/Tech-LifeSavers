import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, Button, FAB, Portal, Modal } from 'react-native-paper';
import { useAuthStore } from '../../store';
import { colors } from '../../constants/theme';

/**
 * Dashboard screen - Main hub for MediPulse AI
 * Displays medication reminders, family members, and quick actions
 */
export default function DashboardScreen() {
  const router = useRouter();
  const { userProfile, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {userProfile?.firstName || 'User'} 👋
          </Text>
          <Text style={styles.subtitle}>
            Your health companion
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Active Medications</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Family Members</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Upcoming Reminders */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
            
            <View style={styles.reminderItem}>
              <View style={styles.reminderIcon}>
                <Text style={styles.reminderIconText}>💊</Text>
              </View>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>Amoxicillin</Text>
                <Text style={styles.reminderTime}>Today, 9:00 AM</Text>
              </View>
              <Button mode="contained" compact style={styles.reminderButton}>
                Take
              </Button>
            </View>

            <View style={styles.reminderItem}>
              <View style={styles.reminderIcon}>
                <Text style={styles.reminderIconText}>💊</Text>
              </View>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>Vitamin D</Text>
                <Text style={styles.reminderTime}>Today, 12:00 PM</Text>
              </View>
              <Button mode="outlined" compact style={styles.reminderButton}>
                Pending
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <Card style={styles.actionCard} onPress={() => {}}>
            <Card.Content style={styles.actionContent}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Add Medication</Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => {}}>
            <Card.Content style={styles.actionContent}>
              <Text style={styles.actionIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.actionLabel}>Family</Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => {}}>
            <Card.Content style={styles.actionContent}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionLabel}>Scan Prescription</Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => {}}>
            <Card.Content style={styles.actionContent}>
              <Text style={styles.actionIcon}>🤖</Text>
              <Text style={styles.actionLabel}>AI Assistant</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
        label="Add"
      />
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 24,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderIconText: {
    fontSize: 20,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reminderButton: {
    borderRadius: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    elevation: 2,
    borderRadius: 12,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  logoutButton: {
    borderColor: colors.error,
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: colors.primary,
  },
});
