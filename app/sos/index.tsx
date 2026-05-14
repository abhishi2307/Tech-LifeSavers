import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore, useFamilyStore } from '../../store';
import { sosService } from '../../services/sosService';
import { FamilyMember } from '../../types';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Header, Card } from '../../components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SOSScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const { members } = useFamilyStore();

  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosSent, setSosSent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const clearTimers = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handlePressIn = () => {
    if (sosSent) return;
    setIsHolding(true);
    setCountdown(3);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    holdTimerRef.current = setTimeout(async () => {
      clearTimers();
      setIsHolding(false);
      try {
        const name = userProfile
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : 'MediPulse User';
        await sosService.sendSOSAlert(name, members);
        setSosSent(true);
        Toast.show({ type: 'success', text1: 'SOS Sent', text2: 'Emergency contacts notified' });
      } catch {
        Toast.show({ type: 'error', text1: 'SOS Failed', text2: 'Could not send alert' });
      }
    }, 3000);
  };

  const handlePressOut = () => {
    if (sosSent) return;
    clearTimers();
    setIsHolding(false);
    setCountdown(3);
  };

  const emergencyContacts = members
    .filter((m) => m.phoneNumber)
    .sort((a, b) => (b.emergencyPriority ?? 0) - (a.emergencyPriority ?? 0));

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Header 
        title="Emergency SOS" 
        subtitle="Hold to notify contacts" 
        showBack 
        dark 
        transparent 
        centered
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sosCenter}>
          <Animated.View style={[styles.sosRing, { transform: [{ scale: pulseAnim }] }]} />
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
            style={[styles.sosButton, sosSent && styles.sosSent]}
          >
            <MaterialCommunityIcons 
              name={sosSent ? "check-circle" : "alarm-light"} 
              size={64} 
              color="#fff" 
            />
            <Text style={styles.sosLabel}>
              {sosSent ? 'SENT' : 'SOS'}
            </Text>
          </TouchableOpacity>
        </View>

        {isHolding && (
          <View style={styles.countdown}>
            <Text style={styles.countdownText}>Sending in {countdown}...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => sosService.callEmergencyServices()}
        >
          <MaterialCommunityIcons name="phone-plus" size={24} color="#fff" />
          <Text style={styles.emergencyBtnText}>Call Emergency (112)</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {emergencyContacts.length === 0 ? (
          <Card style={styles.noContactCard}>
            <Text style={styles.noContactText}>No emergency contacts found.</Text>
            <Text style={styles.noContactSub}>Add them in the Family tab.</Text>
          </Card>
        ) : (
          emergencyContacts.map((m) => (
            <Card key={m.id} style={styles.contactCard}>
              <View style={styles.contactInner}>
                <View style={styles.contactAvatar}>
                   <Text style={styles.contactInitial}>{m.name[0]}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{m.name}</Text>
                  <Text style={styles.contactRel}>{m.relationship}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => Linking.openURL(`tel:${m.phoneNumber}`)}
                >
                  <MaterialCommunityIcons name="phone" size={22} color={colors.success} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: spacing.lg, alignItems: 'center' },
  sosCenter: { 
    width: 240, 
    height: 240, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 40,
  },
  sosRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.error + '20',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    shadowColor: colors.error,
  },
  sosSent: { backgroundColor: colors.success },
  sosLabel: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 8 },
  countdown: { marginBottom: 24 },
  countdownText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emergencyBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingVertical: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emergencyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { alignSelf: 'flex-start', color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginBottom: 16 },
  noContactCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, alignItems: 'center' },
  noContactText: { color: '#fff', fontWeight: '600' },
  noContactSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  contactCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12, padding: 0 },
  contactInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInitial: { color: colors.error, fontWeight: '800', fontSize: 18 },
  contactInfo: { flex: 1 },
  contactName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  contactRel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  callIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
