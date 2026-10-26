import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface DropdownOption {
  key: string;
  label: string;
}

interface DropdownSelectProps {
  value: string;
  options: (string | DropdownOption)[];
  onChange: (key: string) => void;
  label?: string;
  placeholder?: string;
  menuTitle?: string;
  /** inline = anchored menu (lists) · dialog = centered picker (modals) */
  variant?: 'inline' | 'dialog';
  style?: any;
  /** optional leading icon rendered inside the trigger (e.g. filter-variant) */
  leadingIcon?: string;
  /** lets parents lift their container above later siblings while open */
  onOpenChange?: (open: boolean) => void;
  theme?: 'light' | 'dark';
}

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select',
  menuTitle,
  variant = 'inline',
  style,
  leadingIcon,
  onOpenChange,
  theme = 'light',
}) => {
  const dark = theme === 'dark';
  const [open, setOpenState] = useState(false);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const norm: DropdownOption[] = options.map((o) => (typeof o === 'string' ? { key: o, label: o } : o));
  const selected = norm.find((o) => o.key === value);

  const menu = (
    <View style={[variant === 'dialog' ? styles.dialogMenu : styles.menu, dark && (variant === 'dialog' ? styles.dialogMenuDark : styles.menuDark)]}>
      {!!menuTitle && <Text style={[styles.menuTitle, dark && styles.menuTitleDark]}>{menuTitle}</Text>}
      <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
        {norm.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={styles.item}
            onPress={() => {
              onChange(o.key);
              setOpen(false);
            }}
          >
            <Text numberOfLines={1} style={[styles.itemText, dark && styles.itemTextDark, value === o.key && styles.itemTextActive, dark && value === o.key && styles.itemTextActiveDark]}>
              {o.label}
            </Text>
            {value === o.key && <MaterialCommunityIcons name="check" size={16} color="#1A1B1C" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (variant === 'dialog') {
    return (
      <View style={style}>
        {!!label && <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>}
        <TouchableOpacity style={[styles.select, dark && styles.selectDark]} onPress={() => setOpen(true)}>
          {!!leadingIcon && <MaterialCommunityIcons name={leadingIcon as any} size={16} color={dark ? '#9CA3AF' : '#6B6B6B'} />}
          <Text numberOfLines={1} style={[styles.text, dark && styles.textDark]}>
            {selected?.label || placeholder}
          </Text>
          <MaterialCommunityIcons name="menu-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <TouchableOpacity style={styles.dialogOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
            <View onStartShouldSetResponder={() => true}>{menu}</View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, open && { zIndex: 60 }, style]}>
      {!!label && <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>}
      <View style={styles.control}>
        <TouchableOpacity style={[styles.select, dark && styles.selectDark]} onPress={() => setOpen(!open)}>
          {!!leadingIcon && <MaterialCommunityIcons name={leadingIcon as any} size={16} color={dark ? '#9CA3AF' : '#6B6B6B'} />}
          <Text numberOfLines={1} style={[styles.text, dark && styles.textDark]}>
            {selected?.label || placeholder}
          </Text>
          <MaterialCommunityIcons name={open ? 'menu-up' : 'menu-down'} size={16} color="#9CA3AF" />
        </TouchableOpacity>
        {open && (
          <>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
            {menu}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  control: { position: 'relative' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  text: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1B1C' },
  backdrop: { position: 'absolute', top: -40, left: -400, right: -400, bottom: -2000, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    minWidth: 180,
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 70,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  dialogMenu: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, gap: 8 },
  itemText: { fontSize: 13, color: '#1A1B1C', flexShrink: 1 },
  itemTextActive: { fontWeight: '800' },
  labelDark: { color: '#9CA3AF' },
  selectDark: { backgroundColor: '#171717', borderColor: 'rgba(244,196,48,0.15)' },
  textDark: { color: '#E5E7EB' },
  menuDark: { backgroundColor: '#1F1F1F', borderColor: 'rgba(244,196,48,0.15)' },
  dialogMenuDark: { backgroundColor: '#1F1F1F', borderColor: 'rgba(244,196,48,0.15)' },
  menuTitleDark: { color: '#9CA3AF' },
  itemTextDark: { color: '#E5E7EB' },
  itemTextActiveDark: { color: '#F4C430' },
});
