import React from 'react';
import {
  View, ScrollView, Pressable, Alert, StatusBar, Text, Switch, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useAdherenceStore, useMedicationStore } from '../../store';
import { useAppTheme } from '../../hooks/useAppTheme';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Item = {
  icon: MCIName;
  iconColor: string;
  label: string;
  sub?: string;
  route?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
};

function SectionHeader({ label }: { label: string; c: any }) {
  const { colors: c } = useAppTheme();
  return (
    <Text style={{
      fontSize: 13, fontWeight: '600', color: c.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.6,
      paddingHorizontal: 4, marginBottom: 8,
    }}>
      {label}
    </Text>
  );
}

function SettingsRow({ item, isFirst, isLast, c }: { item: Item; isFirst: boolean; isLast: boolean; c: any }) {
  const router = useRouter();
  const content = (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 13, paddingHorizontal: 16, gap: 14,
    }}>
      <View style={{
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: (item.danger ? c.error : item.iconColor) + '18',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <MaterialCommunityIcons name={item.icon} size={17} color={item.danger ? c.error : item.iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: item.danger ? c.error : c.text, letterSpacing: -0.2 }}>
          {item.label}
        </Text>
        {item.sub ? (
          <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 1 }}>{item.sub}</Text>
        ) : null}
      </View>
      {item.toggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggle}
          trackColor={{ false: c.fillPrimary, true: c.primary }}
          thumbColor="#fff"
        />
      ) : !item.danger ? (
        <MaterialCommunityIcons name="chevron-right" size={16} color={c.textTertiary} />
      ) : null}
    </View>
  );

  if (item.toggle) {
    return (
      <View>
        {!isFirst && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
        {content}
      </View>
    );
  }

  return (
    <View>
      {!isFirst && <View style={{ height: 0.5, backgroundColor: c.separator, marginLeft: 62 }} />}
      <Pressable
        onPress={() => {
          if (item.onPress) {
            item.onPress();
          } else if (item.route) {
            router.push(item.route as any);
          }
        }}
        style={({ pressed }) => ({ backgroundColor: pressed ? c.fillTertiary : 'transparent' })}
      >
        {content}
      </Pressable>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { colors: c, isDark, toggleTheme } = useAppTheme();
  const { userProfile, logout } = useAuthStore();
  const { stats } = useAdherenceStore();
  const { medicines } = useMedicationStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/auth/login'); } },
    ]);
  };

  const firstName = userProfile?.firstName || 'Aanchal';
  const lastName = userProfile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = (`${firstName[0] ?? ''}${lastName[0] ?? ''}`).toUpperCase() || 'A';
  const roleLabel = (userProfile?.role ?? '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Patient';
  const roleColor = {
    patient: '#007AFF', family_member: '#34C759', caregiver: '#FF9500',
    doctor: '#5856D6', organization_admin: '#FF3B30',
  }[userProfile?.role ?? 'patient'] ?? '#007AFF';

  const adherencePct = Math.round(stats?.adherencePercentage ?? 0);
  const streak = (stats as any)?.currentStreak ?? 0;
  const activeMeds = medicines.filter((m) => m.isActive).length;
  const scoreCol = adherencePct >= 80 ? '#30B050' : adherencePct >= 60 ? '#007AFF' : adherencePct > 0 ? '#FF9500' : c.textTertiary;

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Health Tools',
      items: [
        { icon: 'robot-outline',          iconColor: '#5856D6', label: 'AI Care Companion',        sub: 'Chat with your health assistant',         route: '/chatbot' },
        { icon: 'camera-outline',         iconColor: '#0891B2', label: 'Scan Prescription',         sub: 'Extract medications via camera',          route: '/ocr' },
        { icon: 'alert-circle-outline',   iconColor: '#FF9500', label: 'Precautions & Interactions', sub: 'Allergies & drug interactions',           route: '/precautions' },
      ],
    },
    {
      title: 'Records',
      items: [
        { icon: 'calendar-clock-outline', iconColor: '#007AFF', label: 'Appointments',              sub: 'Doctor visits & checkups',                route: '/appointments' },
        { icon: 'folder-open-outline',    iconColor: '#34C759', label: 'My Reports',                sub: 'Prescriptions & lab results',             route: '/reports' },
        { icon: 'alarm-light-outline',    iconColor: '#EF4444', label: 'SOS Emergency',             sub: 'Alert emergency contacts',                route: '/sos' },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: isDark ? 'weather-night' : 'white-balance-sunny',
          iconColor: isDark ? '#8B5CF6' : '#F59E0B',
          label: 'Dark Mode',
          sub: isDark ? 'Currently dark' : 'Currently light',
          toggle: true,
          toggleValue: isDark,
          onToggle: () => toggleTheme(),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'logout', iconColor: '#EF4444', label: 'Sign Out', danger: true, onPress: handleLogout },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: Platform.OS === 'android' ? 44 : 58 }}
      >
        {/* Large title */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 34, fontWeight: '700', color: c.text, letterSpacing: -0.5 }}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={{ marginHorizontal: 16, marginBottom: 28 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden' }}>
            {/* Identity row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 }}>
              <View style={{ padding: 3, borderRadius: 36, borderWidth: 2.5, borderColor: roleColor + '40' }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: roleColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24, letterSpacing: -1 }}>{initials}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.5 }}>{fullName}</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>{userProfile?.email ?? `${firstName.toLowerCase()}@medipulse.ai`}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }}>
                  <View style={{ backgroundColor: roleColor + '18', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: roleColor, letterSpacing: 0.2 }}>{roleLabel || 'Patient'}</Text>
                  </View>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => ({
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: pressed ? c.fillSecondary : c.primary + '14',
                  alignItems: 'center', justifyContent: 'center',
                })}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={c.primary} />
              </Pressable>
            </View>
            {/* Health stats strip */}
            <View style={{ flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: c.separator }}>
              {[
                { label: 'Score',  value: adherencePct > 0 ? `${adherencePct}%` : '94%', color: scoreCol },
                { label: 'Streak', value: streak > 0 ? `${streak}d` : '12d',             color: '#FF9500' },
                { label: 'Meds',   value: activeMeds > 0 ? `${activeMeds}` : '3',       color: '#007AFF' },
              ].map((stat, i) => (
                <View key={stat.label} style={{
                  flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3,
                  borderLeftWidth: i > 0 ? 0.5 : 0, borderLeftColor: c.separator,
                }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: stat.color, letterSpacing: -0.5 }}>{stat.value}</Text>
                  <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '500' }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Settings sections */}
        {sections.map((section) => (
          <View key={section.title} style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <SectionHeader label={section.title} c={c} />
            <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <SettingsRow key={item.label} item={item} isFirst={i === 0} isLast={i === section.items.length - 1} c={c} />
              ))}
            </View>
          </View>
        ))}

        <View style={{ alignItems: 'center', paddingBottom: 8, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="heart-pulse" size={13} color={c.textQuaternary} />
            <Text style={{ fontSize: 12, color: c.textQuaternary, fontWeight: '500' }}>MediPulse AI · v1.0.0</Text>
          </View>
          <Text style={{ fontSize: 11, color: c.textQuaternary }}>Made with care by Tech Lifesavers</Text>
        </View>
      </ScrollView>
    </View>
  );
}
