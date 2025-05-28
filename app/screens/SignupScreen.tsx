import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

type SignupNavProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<SignupNavProp>();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Please fill out all fields');
      return;
    }

try {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

      await AsyncStorage.setItem('userEmail', user.email || '');
      await setDoc(doc(db, `users/${user.uid}/profile`), {
        name,
        email,
        createdAt: new Date().toISOString()
      });

      await AsyncStorage.setItem('userEmail', user.email || '');
      navigation.navigate('Home');
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('Signup failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 }
});