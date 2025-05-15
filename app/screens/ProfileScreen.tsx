import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Button, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { uploadTestHunt } from '../services/firebaseUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const ProfileScreen = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(email => {
      setEmail(email || '');
    });
  }, []);

  const handleUpload = async () => {
    setStatus('Uploading test hunt…');
    setLoading(true);

    const result = await uploadTestHunt();
    if (result.success) {
      setStatus(`Uploaded `);
    } else {
      setStatus('Upload failed. See console.');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Feather name="user" size={100} color="#666" style={styles.avatar} />
      <Text style={styles.stat}>Email: {email}</Text>
      <Text style={styles.stat}>Total Hunts: 0</Text>
      <Text style={styles.stat}>Tagged Locations: 0</Text>

      {/* Test‐upload status */}
      {status.length > 0 && <Text style={styles.status}>{status}</Text>}
      {loading && <ActivityIndicator size="large" style={styles.loader} />}

      <View style={styles.buttonContainer}>
        <Button title="Edit Profile" onPress={() => { /* your edit logic */ }} />
      </View>

      {/* Temporary test button */}
      <View style={styles.testButton}>
        <Button title="Upload Test Hunt" onPress={handleUpload} />
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatar: {
    marginBottom: 20,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stat: {
    fontSize: 16,
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 20,
  },
  testButton: {
    marginTop: 30,
    width: '60%',
  },
});