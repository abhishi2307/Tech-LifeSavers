import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../constants/theme';
import { useRouter } from 'expo-router';

/**
 * Enhanced Header component for a premium feel
 * Automatically handles safe area insets to prevent status bar overlap
 */
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
  dark?: boolean;
}

export default function Header({ 
  title, 
  subtitle, 
  showBack = false, 
  rightAction,
  centered = false,
  transparent = false,
  dark = false
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Safe area padding with fallback for Android
  const topPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, StatusBar.currentHeight || 0) + spacing.xs
    : insets.top + spacing.xs;

  const textColor = dark ? '#FFFFFF' : colors.text;
  const subtitleColor = dark ? 'rgba(255,255,255,0.7)' : colors.textSecondary;
  const iconColor = dark ? '#FFFFFF' : colors.text;

  return (
    <View style={[
      styles.container, 
      { paddingTop: topPadding },
      transparent ? styles.transparent : styles.solid,
      centered && styles.centeredContainer
    ]}>
      <View style={styles.topRow}>
        {showBack ? (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={iconColor}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={[styles.titleContainer, centered && styles.centeredTitleContainer]}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <IconButton
            icon={rightAction.icon}
            size={24}
            iconColor={iconColor}
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
  solid: {
    backgroundColor: colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
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
