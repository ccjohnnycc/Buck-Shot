import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const [status, setStatus] = useState('Uploading test hunt...');
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    const uploadTestHunt = async () => {
      try {
        const docRef = await addDoc(collection(db, 'hunts'), {
          hunter: 'Josh',
          score: 155,
          timestamp: new Date().toISOString(),
          location: 'Test Spot'
        });
        console.log('Hunt uploaded with ID:', docRef.id);
        setStatus('Test hunt successfully uploaded!');
      } catch (error) {
        console.error('Error uploading hunt:', error);
        setStatus('Upload failed. Check console.');
      }
    };

    uploadTestHunt();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
      {status.includes('Uploading') && <ActivityIndicator size="large" color="#888" />}
      <Button title="Go to Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
});
