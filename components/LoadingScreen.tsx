import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, MD3Colors, Text } from 'react-native-paper';
import { colors } from '../constants/theme';

/**
 * Loading-safe component for displaying loading states
 * Used during navigation transitions and async operations
 */
interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        animating={true}
        color={colors.primary}
        size="large"
        style={styles.indicator}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
