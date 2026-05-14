import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { notificationService } from '../services/notificationService';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'reminder' | 'alert' | 'system';
  isRead: boolean;
};

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Time for your Amoxicillin',
    message: 'Please take 1 pill (500mg) after your meal.',
    time: '10 mins ago',
    type: 'reminder',
    isRead: false,
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    message: 'You have only 3 days left of Vitamin D3. Time to refill.',
    time: '2 hours ago',
    type: 'alert',
    isRead: false,
  },
  {
    id: '3',
    title: 'Profile Updated',
    message: 'Your emergency contact information was successfully updated.',
    time: 'Yesterday',
    type: 'system',
    isRead: true,
  },
  {
    id: '4',
    title: 'Weekly Report Ready',
    message: 'Your adherence score is 88%. Keep up the great work!',
    time: 'Monday',
    type: 'system',
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const { colors: c } = useAppTheme();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial permission status safely
    notificationService.checkPermissions().then(granted => {
      setHasPermission(granted);
    });
  }, []);

  const handleRequestPermission = async () => {
    try {
      const granted = await notificationService.initialize();
      setHasPermission(granted);
      Toast.show({
        type: granted ? 'success' : 'error',
        text1: granted ? 'Permissions Granted' : 'Permissions Denied',
        text2: granted ? 'You will now receive reminders.' : 'Please enable in device settings.',
      });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error requesting permissions' });
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.triggerTestNotification();
      Toast.show({
        type: 'success',
        text1: 'Test Triggered',
        text2: 'If you have permissions, a local push will appear shortly.',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Trigger Failed',
      });
    }
  };

  const getIconData = (type: string, isRead: boolean) => {
    switch (type) {
      case 'reminder': return { name: 'pill', color: '#007AFF', bg: '#007AFF15' };
      case 'alert': return { name: 'alert-circle', color: '#FF3B30', bg: '#FF3B3015' };
      case 'system': return { name: 'information', color: isRead ? '#8E8E93' : '#34C759', bg: isRead ? '#8E8E9315' : '#34C75915' };
      default: return { name: 'bell', color: '#8E8E93', bg: '#8E8E9315' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false, // Hide default header to use clean layout
        }}
      />

      <View style={[styles.header, { backgroundColor: c.background }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 8, marginLeft: -8 }]}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Actions Row */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {/* Request Permission Action */}
          <Pressable
            onPress={handleRequestPermission}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed ? c.fillSecondary : c.surface,
                borderWidth: 1,
                borderColor: hasPermission ? c.primary + '30' : '#FF950050',
              },
            ]}
          >
            <View style={[styles.actionIconBg, { backgroundColor: hasPermission ? c.primary + '15' : '#FF950015' }]}>
              <MaterialCommunityIcons name={hasPermission ? "check-decagram" : "bell-alert"} size={20} color={hasPermission ? c.primary : "#FF9500"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionButtonTitle, { color: c.text }]}>
                {hasPermission ? 'Notifications Enabled' : 'Enable Notifications'}
              </Text>
              <Text style={[styles.actionButtonSub, { color: c.textSecondary }]}>
                {hasPermission ? 'You are ready to receive alerts' : 'Tap to grant access'}
              </Text>
            </View>
          </Pressable>

          {/* Test Notification Action */}
          <Pressable
            onPress={handleTestNotification}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed ? c.primary + 'E6' : c.primary,
                borderColor: c.primary,
                borderWidth: 1,
              },
            ]}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name="bell-ring" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionButtonTitle, { color: '#fff' }]}>Trigger Test Notification</Text>
              <Text style={[styles.actionButtonSub, { color: 'rgba(255,255,255,0.8)' }]}>Simulates a medicine reminder</Text>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent</Text>

        {/* Dummy Notifications */}
        <View style={{ gap: 16 }}>
          {DUMMY_NOTIFICATIONS.map((notif) => {
            const iconConfig = getIconData(notif.type, notif.isRead);
            return (
              <Pressable
                key={notif.id}
                style={({ pressed }) => [
                  styles.notifCard,
                  { backgroundColor: pressed ? c.fillSecondary : c.surface },
                  !notif.isRead && { borderWidth: 1, borderColor: c.primary + '30' }
                ]}
              >
                {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />}
                
                <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                  <MaterialCommunityIcons name={iconConfig.name as any} size={24} color={iconConfig.color} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={[styles.notifTitle, { color: c.text }]}>{notif.title}</Text>
                    <Text style={[styles.notifTime, { color: c.textTertiary }]}>{notif.time}</Text>
                  </View>
                  <Text style={[styles.notifMessage, { color: c.textSecondary }]}>{notif.message}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionButtonSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});
