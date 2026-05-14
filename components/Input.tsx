import { TextInput as PaperInput, TextInputProps as PaperInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Custom Input component with healthcare theme
 * Provides consistent styling across the app
 */
interface InputProps extends PaperInputProps {
  error?: boolean;
}

export default function Input({ error, style, ...props }: InputProps) {
  return (
    <PaperInput
      mode="outlined"
      outlineColor={error ? colors.error : colors.border}
      activeOutlineColor={error ? colors.error : colors.primary}
      style={[styles.input, style]}
      contentStyle={styles.content}
      theme={{
        colors: {
          placeholder: colors.textSecondary,
          text: colors.text,
          background: colors.surface,
        },
      }}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  content: {
    minHeight: 52,
  },
});
