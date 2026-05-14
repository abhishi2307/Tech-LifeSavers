import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing, typography } from '../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  centered?: boolean;
  transparent?: boolean;
}

export default function Header({ 
  title, 
  subtitle, 
  showBack = false, 
  rightAction,
  centered = false,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  
  const topPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, StatusBar.currentHeight || 0) + spacing.xs
    : insets.top + spacing.xs;

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: topPadding,
        backgroundColor: transparent ? 'transparent' : c.surface 
      },
      centered && styles.centeredContainer
    ]}>
      <View style={styles.topRow}>
        {showBack ? (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={c.text}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={[styles.titleContainer, centered && styles.centeredTitleContainer]}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <IconButton
            icon={rightAction.icon}
            size={24}
            iconColor={c.text}
            onPress={rightAction.onPress}
            style={styles.rightButton}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  centeredContainer: {
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  centeredTitleContainer: {
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySm,
    marginTop: 2,
    textAlign: 'center',
  },
  backButton: {
    marginLeft: -8,
  },
  rightButton: {
    marginRight: -8,
  },
  placeholder: {
    width: 48,
  },
});

