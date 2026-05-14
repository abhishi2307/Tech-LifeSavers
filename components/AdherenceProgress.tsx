import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { colors } from '../constants/theme';

/**
 * Reusable adherence progress component
 * Displays adherence percentage with visual progress bar
 */
interface AdherenceProgressProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function AdherenceProgress({
  percentage,
  showLabel = true,
  size = 'medium',
}: AdherenceProgressProps) {
  const getColor = () => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: 24, barHeight: 4 };
      case 'large':
        return { fontSize: 48, barHeight: 12 };
      default:
        return { fontSize: 32, barHeight: 8 };
    }
  };

  const { fontSize, barHeight } = getSize();
  const color = getColor();

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={[styles.percentage, { color, fontSize }]}>
          {percentage}%
        </Text>
      )}
      <ProgressBar
        progress={percentage / 100}
        color={color}
        style={[styles.progressBar, { height: barHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  percentage: {
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    borderRadius: 4,
  },
});
