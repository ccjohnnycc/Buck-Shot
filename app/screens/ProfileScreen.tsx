import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadTestHunt } from '../services/firebaseUtils';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const [email, setEmail] = useState<string>('');
  const [huntCount, setHuntCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch both counts
  const fetchStats = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoadingStats(true);
    try {
      setEmail(user.email || '');
      const huntsnap = await getDocs(collection(db, `users/${user.uid}/hunts`));
      setHuntCount(huntsnap.size);

      const journalsnap = await getDocs(
        collection(db, `users/${user.uid}/journalEntries`)
      );
      setJournalCount(journalsnap.size);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load stats.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Reload stats on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userEmail');
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthLanding' }],
      });
    } catch (err: any) {
      Alert.alert('Logout failed', err.message);
    }
  };

  const handleUpload = async () => {
    setStatus('Uploading test hunt…');
    setUploading(true);
    try {
      const result = await uploadTestHunt();
      if (result.success) {
        setStatus('Upload complete');
        await fetchStats();
      } else {
        setStatus('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Feather name="user" size={80} color="#FFD700" />
        <Text style={styles.title}>My Profile</Text>

        {loadingStats ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : (
          <View style={styles.statsBox}>
            <Text style={styles.stat}>Email: {email || 'Guest'}</Text>
            <Text style={styles.stat}>Total Hunts: {huntCount}</Text>
            <Text style={styles.stat}>Journal Entries: {journalCount}</Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('JournalList', { filterTags: undefined })}
          >
            <Text style={styles.buttonText}>View Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Gallery', { filterTags: undefined })}
          >
            <Text style={styles.buttonText}>View Hunt Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomButtons}>
          <Button
            title="Sync to Cloud"
            onPress={handleUpload}
            color="#FFA500"
            disabled={uploading}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Edit Profile not available yet.')}
          />
          <View style={{ height: 8 }} />
          <Button title="Logout" onPress={handleLogout} color="#ff4444" />
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>
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
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
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
    width: '80%',
  },
  status: {
    marginTop: 20,
    color: '#fff',
    fontStyle: 'italic',
  },
});
