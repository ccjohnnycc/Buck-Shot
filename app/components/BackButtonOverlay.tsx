import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BackButtonOverlay({ top = 30, left = 10 }: { top?: number; left?: number }) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={[styles.btn, { top, left }]}
      hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
    >
      <Feather name="arrow-left" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 999,
  },
});