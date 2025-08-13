import React, { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';
import { AuthBackground } from './AuthBackground';
import BSButton from '../components/BSButton';

type RootStackParamList = {
  Main: undefined;
};

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill out all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      // store profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem('userEmail', user.email || '');
      navigation.navigate('Main');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <AuthBackground>
        <Text style={styles.title}>Sign Up </Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#ccc"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.errorText}>{error} </Text>}

        <BSButton
          label="Sign Up"
          onPress={handleSignup}
          loading={loading}
          style={{ width: '100%', marginTop: 10 }}
        />

        <BSButton
          variant="ghost"
          label="← Back to Login"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 8 }}
        />
      </AuthBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#FFD700', marginBottom: 20 },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: { color: '#FF4C4C', marginBottom: 12 },
  toggleText: { color: '#FFD700', marginTop: 16, fontWeight: '600' },
});