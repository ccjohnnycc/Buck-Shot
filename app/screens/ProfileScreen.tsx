import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Button, ActivityIndicator, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { uploadTestHunt } from '../services/firebaseUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth } from '../services/firebaseConfig';

const ProfileScreen = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [huntCount, setHuntCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(storedEmail => {
      if (storedEmail) {
        setEmail(storedEmail);
        fetchStats(storedEmail);
      }
    });
  }, []);

  const fetchStats = async (userEmail: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const huntSnapshot = await getDocs(collection(db, `users/${user.uid}/hunts`));
    setHuntCount(huntSnapshot.size);

    const journalSnapshot = await getDocs(collection(db, `users/${user.uid}/journalEntries`));
    setJournalCount(journalSnapshot.size);

    const profileDoc = await getDoc(doc(db, `users/${user.uid}/profile`));
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      setName(profileData.name || '');
    }
  };

  const handleUpload = async () => {
    setStatus('Uploading test hunt…');
    setLoading(true);

    const result = await uploadTestHunt();
      if (result.success) {
        setStatus(`Uploaded`);
      if (email) {
        await fetchStats(email);
      } else {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
          await fetchStats(storedEmail);
        }
      }
    } else {
      setStatus('Upload failed. See console.');
    }

    setLoading(false);
  };

  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Feather name="user" size={80} color="#FFD700" />
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.statsBox}>
          <Text style={styles.stat}>Email: {name || email || 'Guest'}</Text>
          <Text style={styles.stat}>Total Hunts: {huntCount}</Text>
          <Text style={styles.stat}>Journal Entries: {journalCount}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('JournalList')}>
            <Text style={styles.buttonText}>View Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Gallery')}>
            <Text style={styles.buttonText}>View Hunt Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomButtons}>
          <Button title="Sync to Cloud" onPress={handleUpload} color="#FFA500" disabled={loading} />
          <View style={{ marginVertical: 8 }} />
          <Button title="Edit Profile" onPress={() => Alert.alert("Coming Soon", "Edit Profile is not available yet.")} />
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {loading && <ActivityIndicator size="large" color="#FFD700" />}
      </View>
    </ImageBackground>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
  statsBox: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    width: '90%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  stat: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 6,
  },
  buttonGroup: {
    width: '90%',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomButtons: {
    marginTop: 10,
    width: '80%',
  },
  status: {
    marginTop: 20,
    color: '#fff',
    fontStyle: 'italic',
  },
});