import React, { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { app } from '../services/firebaseconfig';
import { AuthBackground } from './AuthBackground';
import BSButton from '../components/BSButton';

type RootStackParamList = { Main: undefined };

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Create account and set optional display name
  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth(app);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(userCred.user, { displayName: name });

      Alert.alert('Account Created', 'Your account was successfully created!');
      navigation.navigate('Main');
    } catch (err: any) {
      let message = 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/email-already-in-use') message = 'That email is already in use.';
      else if (err.code === 'auth/invalid-email') message = 'Invalid email address.';
      else if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      Alert.alert('Signup Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
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

        <BSButton label="Sign Up" onPress={handleSignup} loading={loading} style={{ width: '100%', marginTop: 10 }} />

        <BSButton variant="ghost" label="← Back to Login" onPress={() => navigation.goBack()} style={{ marginTop: 8 }} />
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
});