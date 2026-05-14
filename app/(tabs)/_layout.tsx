import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks/useAppTheme';
import { UserRole } from '../../types';

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabConfig = { label: string; icon: MCIName; activeIcon: MCIName };
type RoleTabs = { tab2: TabConfig; tab3: TabConfig; tab4: TabConfig };

const ROLE_TABS: Record<UserRole, RoleTabs> = {
  patient: {
    tab2: { label: 'Medicines',  icon: 'pill',                    activeIcon: 'pill' },
    tab3: { label: 'Adherence',  icon: 'chart-line',              activeIcon: 'chart-line' },
    tab4: { label: 'Family',     icon: 'account-group-outline',   activeIcon: 'account-group' },
  },
  family_member: {
    tab2: { label: 'Family Hub', icon: 'heart-outline',           activeIcon: 'heart' },
    tab3: { label: 'Alerts',     icon: 'bell-outline',            activeIcon: 'bell' },
    tab4: { label: 'Reports',    icon: 'chart-box-outline',       activeIcon: 'chart-box' },
  },
  caregiver: {
    tab2: { label: 'Patients',   icon: 'account-group-outline',   activeIcon: 'account-group' },
    tab3: { label: 'Schedule',   icon: 'calendar-clock-outline',  activeIcon: 'calendar-clock' },
    tab4: { label: 'Reports',    icon: 'chart-box-outline',       activeIcon: 'chart-box' },
  },
  doctor: {
    tab2: { label: 'Patients',   icon: 'account-group-outline',   activeIcon: 'account-group' },
    tab3: { label: 'Appts',      icon: 'calendar-plus-outline',   activeIcon: 'calendar-plus' },
    tab4: { label: 'Records',    icon: 'folder-open-outline',     activeIcon: 'folder-open' },
  },
  organization_admin: {
    tab2: { label: 'Team',       icon: 'account-group-outline',   activeIcon: 'account-group' },
    tab3: { label: 'Analytics',  icon: 'chart-box-outline',       activeIcon: 'chart-box' },
    tab4: { label: 'Reports',    icon: 'chart-box-outline',       activeIcon: 'chart-box' },
  },
};

function TabIcon({ name, focused, activeIcon, color, primary }: {
  name: MCIName; focused: boolean; activeIcon: MCIName; color: string; primary: string;
}) {
  return (
    <View style={{
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: focused ? primary + '18' : 'transparent',
    }}>
      <MaterialCommunityIcons
        name={focused ? activeIcon : name}
        size={23}
        color={color}
      />
    </View>
  );
}

export default function TabLayout() {
  const { userProfile } = useAuthStore();
  const { colors: c, isDark } = useAppTheme();
  const role: UserRole = userProfile?.role ?? 'patient';
  const tabs = ROLE_TABS[role];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2C2C2E' : 'rgba(60,60,67,0.12)',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          position: 'relative',
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        } as any,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: 1,
          marginBottom: 8,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="view-dashboard-outline" activeIcon="view-dashboard" focused={focused} color={color} primary={c.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: tabs.tab2.label,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={tabs.tab2.icon} activeIcon={tabs.tab2.activeIcon} focused={focused} color={color} primary={c.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="adherence"
        options={{
          title: tabs.tab3.label,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={tabs.tab3.icon} activeIcon={tabs.tab3.activeIcon} focused={focused} color={color} primary={c.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: tabs.tab4.label,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={tabs.tab4.icon} activeIcon={tabs.tab4.activeIcon} focused={focused} color={color} primary={c.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="dots-horizontal-circle-outline" activeIcon="dots-horizontal-circle" focused={focused} color={color} primary={c.primary} />
          ),
        }}
      />
    </Tabs>
  );
}
