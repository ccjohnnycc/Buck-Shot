
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type InstructionBannerProps = {
  message: string;
  autoHideDuration?: number;
};

export default function InstructionBanner({ message, autoHideDuration = 5000 }: InstructionBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => setVisible(false), autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={() => setVisible(false)}>
      <Text style={styles.text}>{message}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    marginTop: 100,
    top: 40,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 10,
    zIndex: 10,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
