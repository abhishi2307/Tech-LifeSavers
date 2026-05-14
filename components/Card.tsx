import { Card as PaperCard } from 'react-native-paper';
import { StyleSheet, ViewProps } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Custom Card component with healthcare theme
 * Provides consistent card styling across the app
 */
interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ children, style, ...props }: CardProps) {
  return (
    <PaperCard style={[styles.card, style]} {...props}>
      {children}
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
