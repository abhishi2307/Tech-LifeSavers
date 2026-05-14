import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Header, Card } from '../../components';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type MenuItem = {
  icon: MCIName;
  label: string;
  subtitle?: string;
  route?: string;
  onPress?: () => void;
  danger?: boolean;
  iconColor?: string;
  iconBg?: string;
};

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => { logout(); router.replace('/auth/login'); },
      },
    ]);
  };

  const sections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Health Tools',
      items: [
        { icon: 'robot-outline', label: 'AI Care Companion', subtitle: 'Chat with your health assistant', route: '/chatbot', iconColor: '#7C3AED', iconBg: '#F5F3FF' },
        { icon: 'camera-outline', label: 'Scan Prescription', subtitle: 'Extract meds from prescriptions', route: '/ocr', iconColor: '#0891B2', iconBg: '#ECFEFF' },
        { icon: 'alert-circle-outline', label: 'Precautions', subtitle: 'Allergies & drug interactions', route: '/precautions', iconColor: '#C2410C', iconBg: '#FFF7ED' },
      ],
    },
    {
      title: 'Records',
      items: [
        { icon: 'calendar-clock-outline', label: 'Appointments', subtitle: 'Doctor visits & checkups', route: '/appointments', iconColor: '#1565C0', iconBg: '#EFF6FF' },
        { icon: 'folder-open-outline', label: 'My Reports', subtitle: 'Prescriptions & lab results', route: '/reports', iconColor: '#15803D', iconBg: '#F0FDF4' },
      ],
    },
    {
      title: 'Emergency',
      items: [
        { icon: 'alarm-light-outline', label: 'SOS Emergency', subtitle: 'Alert your emergency contacts', route: '/sos', iconColor: '#DC2626', iconBg: '#FEF2F2' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'logout', label: 'Sign Out', danger: true, onPress: handleLogout, iconColor: '#DC2626', iconBg: '#FEF2F2' },
      ],
    },
  ];

  const firstName = userProfile?.firstName || 'Aanchal';
  const lastName = userProfile?.lastName || '';
  const initials = firstName[0]?.toUpperCase() || 'A';
  const role = userProfile?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Header title="Settings" subtitle="Manage your profile & preferences" centered />
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email ?? ''}</Text>
            {role ? (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{role}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard} variant="flat">
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={item.onPress ?? (() => item.route && router.push(item.route as any))}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg ?? colors.surfaceVariant }]}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={item.iconColor ?? colors.primary}
                      />
                    </View>
                    <View style={styles.menuText}>
                      <Text style={[styles.menuLabel, item.danger && { color: colors.error }]}>
                        {item.label}
                      </Text>
                      {item.subtitle ? <Text style={styles.menuSub}>{item.subtitle}</Text> : null}
                    </View>
                    {!item.danger && (
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    )}
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Text style={styles.versionText}>MediPulse AI v1.0.0 · Tech Lifesavers</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h4, color: colors.text, marginBottom: 2 },
  profileEmail: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
  rolePill: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  rolePillText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  sectionCard: { padding: 0, backgroundColor: colors.surface },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: { flex: 1 },
  menuLabel: { ...typography.bodySm, fontWeight: '600', color: colors.text },
  menuSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 68 },
  versionText: { textAlign: 'center', ...typography.caption, color: colors.textTertiary, marginTop: 12 },
});
