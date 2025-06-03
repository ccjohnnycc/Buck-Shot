import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

type AuthNavProp = NativeStackNavigationProp<RootStackParamList, 'AuthLanding'>;

export default function AuthLandingScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const background = require('../../assets/background_image.png'); // forest-style image
  const logo = require('../../assets/title_buck.png'); // buck logo
  const icon = require('../../assets/Buck-Shot_noBack.png'); // buck shot icon

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('Auth state changed: Logged in as', user.email);
      await AsyncStorage.setItem('userEmail', user.email || '');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else {
      console.log('Auth state changed: Not logged in');
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

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR </Text>

        <TouchableOpacity style={styles.guestButton} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.guestText}>Continue as guest </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.link}>Privacy Policy </Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
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
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  guestButton: {
    marginVertical: 12,
  },
  guestText: {
    color: '#fff',
    fontSize: 16,
  },
  orText: {
    color: '#fff',
    marginVertical: 8,
  },
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