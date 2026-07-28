import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, StyleProp } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  iconName,
  containerStyle,
  style,
  placeholder,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {iconName && (
          <MaterialCommunityIcons
            name={iconName}
            size={18}
            color={error ? Colors.light.danger : Colors.light.primary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          accessibilityLabel={label || placeholder}
          accessibilityHint={error || helperText}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    height: 48,
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: 11,
    color: Colors.light.danger,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: Colors.light.muted,
  },
});
