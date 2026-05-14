import { useState, useEffect, useRef } from 'react';
import { View, Animated, Pressable, ScrollView, Linking, StatusBar, Platform, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore, useFamilyStore } from '../../store';
import { sosService } from '../../services/sosService';

const BG = '#0C0A1D';
const RED = '#FF3B30';
const GREEN = '#34C759';

export default function SOSScreen() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const { members } = useFamilyStore();

  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosSent, setSosSent] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.8)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    const ring = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.4, duration: 1400, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.8, duration: 1400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    ring.start();
    return () => { pulse.stop(); ring.stop(); };
  }, [pulseAnim, ringAnim]);

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
        const name = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'MediPulse User';
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
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'android' ? 44 : 58, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 }}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="rgba(255,255,255,0.6)" />
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff', flex: 2, textAlign: 'center' }}>Emergency SOS</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Instruction */}
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 16, marginBottom: 40, textAlign: 'center' }}>
          Hold the button for 3 seconds to alert your emergency contacts
        </Text>

        {/* SOS button area */}
        <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          {/* Outer pulse ring */}
          <Animated.View style={{
            position: 'absolute', width: 260, height: 260, borderRadius: 130,
            backgroundColor: sosSent ? GREEN + '15' : RED + '12',
            transform: [{ scale: ringAnim }],
          }} />
          {/* Inner ring */}
          <Animated.View style={{
            position: 'absolute', width: 220, height: 220, borderRadius: 110,
            backgroundColor: sosSent ? GREEN + '20' : RED + '20',
            transform: [{ scale: pulseAnim }],
          }} />
          {/* Button */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.88}
            style={{
              width: 180, height: 180, borderRadius: 90,
              backgroundColor: sosSent ? GREEN : isHolding ? '#CC2A22' : RED,
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <MaterialCommunityIcons
              name={sosSent ? 'check-circle-outline' : 'alarm-light'}
              size={60} color="#fff"
            />
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 }}>
              {sosSent ? 'SENT' : isHolding ? `${countdown}s` : 'SOS'}
            </Text>
          </TouchableOpacity>
        </View>

        {isHolding && (
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '700', marginBottom: 24 }}>
            Sending in {countdown}…
          </Text>
        )}

        {/* Call 112 button */}
        <Pressable
          onPress={() => sosService.callEmergencyServices()}
          style={({ pressed }) => ({
            width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 12, backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
            borderRadius: 16, paddingVertical: 17, marginBottom: 36,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
          })}
        >
          <MaterialCommunityIcons name="phone-plus" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Call Emergency Services (112)</Text>
        </Pressable>

        {/* Emergency contacts */}
        <View style={{ width: '100%' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 12 }}>
            Emergency Contacts
          </Text>

          {emergencyContacts.length === 0 ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="account-group-outline" size={32} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600', textAlign: 'center' }}>No emergency contacts</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' }}>Add them in the Family tab</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
              {emergencyContacts.map((m, i) => (
                <View key={m.id}>
                  {i > 0 && <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 68 }} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: RED + '25', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ color: RED, fontWeight: '800', fontSize: 18 }}>{m.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{m.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 }}>{m.relationship}</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${m.phoneNumber}`)}
                      style={({ pressed }) => ({
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: pressed ? GREEN + '30' : GREEN + '18',
                        alignItems: 'center', justifyContent: 'center',
                      })}
                    >
                      <MaterialCommunityIcons name="phone" size={22} color={GREEN} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
