import React from 'react';
import { ImageBackground, View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

type AuthBackgroundProps = React.PropsWithChildren<{}>;

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    width,
    height,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    width: '85%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
  },
});