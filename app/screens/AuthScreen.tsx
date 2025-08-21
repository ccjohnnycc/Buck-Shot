import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebaseconfig';
import { onAuthStateChanged } from 'firebase/auth';
import BSButton from '../components/BSButton';

type AuthNavProp = NativeStackNavigationProp<RootStackParamList, 'AuthLanding'>;

export default function AuthLandingScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const background = require('../../assets/background_image.png');
  const logo = require('../../assets/title_buck.png');
  const icon = require('../../assets/Buck-Shot_noBack.png');

  // Auto-redirect user if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await AsyncStorage.setItem('userEmail', user.email || '');
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        await AsyncStorage.removeItem('userEmail');
      }
    });
    return unsubscribe;
  }, []);

  return (
    <ImageBackground source={background} style={styles.background}>
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Image source={icon} style={styles.iconImage} resizeMode="contain" />

        <BSButton
          variant="primary"
          label="Sign in"
          onPress={() => navigation.navigate('Login')}
        />

        <Text style={styles.orText}>OR</Text>

        <BSButton
          variant="ghost"
          label="Continue as guest"
          onPress={() => navigation.navigate('Main')}
        />

        <TouchableOpacity>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: '65%',
    maxWidth: 350,
    aspectRatio: 3.5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  guestButton: { marginVertical: 12 },
  guestText: { color: '#fff', fontSize: 16 },
  orText: { color: '#fff', marginVertical: 8 },
  link: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  iconImage: {
    width: 250,
    height: 250,
    marginTop: 20,
    marginBottom: 50,
  },
});