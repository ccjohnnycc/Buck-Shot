
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type InstructionBannerProps = {
  message: string;
};

export default function InstructionBanner({ message }: InstructionBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
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
