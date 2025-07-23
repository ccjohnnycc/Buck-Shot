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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { uploadTestHunt } from '../services/firebaseUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../services/FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { signOut } from 'firebase/auth';
import { registerForPushNotificationsAsync, scheduleSeasonNotifications } from './notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string>('');
  const [huntCount, setHuntCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem('userEmail').then(storedEmail => {
      if (storedEmail) {
        setEmail(storedEmail);
        fetchStats(storedEmail);
      }
      AsyncStorage.getItem('profileImage').then(uri => {
        if (uri) setProfileImage(uri);
      });
    });
  }, []);

  const fetchStats = async (userEmail: string) => {
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
  };

  const sendTestNotification = async () => {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      if (!token) {
        Alert.alert('No push token found', 'Please enable notifications first.');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Buck Shot!',
          data: { test: 'data' },
        },
        trigger: null,
      });

      Alert.alert('Notification sent', 'Check your device for the test notification.');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Error sending notification', message);
    }
  };


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
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Enable photo access in settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem('profileImage', uri);
    }
  };


  const handleUpload = async () => {
    setStatus('Uploading test hunt…');
    setUploading(true);
    try {
      const result = await uploadTestHunt();
      if (result.success) {
        setStatus('Upload complete');
        await fetchStats(email);
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

  useEffect(() => {
    registerForPushNotificationsAsync().then(() => {
      scheduleSeasonNotifications();
    });
  }, []);


  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../assets/placeholder_user.png')
            }
            style={styles.profilePic}
          />
        </TouchableOpacity>
        <Feather name="user" size={80} color="#FFD700" />
        <Text style={styles.title}>My Profile </Text>

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
            <Text style={styles.buttonText}>View Hunt Gallery </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomButtons}>
          <Button
            title="Sync to Cloud"
            onPress={handleUpload}
            color="#FFA500"
            disabled={uploading}
          />

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#2f95dc' }]}
            onPress={sendTestNotification}
          >
            <Text style={styles.buttonText}>Send Test Notification </Text>
          </TouchableOpacity>
          <View style={{ marginVertical: 8 }} />
          <View style={{ marginVertical: 8 }} />
          <Button
            title="Logout"
            onPress={handleLogout}
            color="#ff4444"
          />
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DeerHarvestLog')}
      >
        <Text style={styles.buttonText}>Log a Deer Harvest </Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
  },
  statsBox: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  stat: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  menuButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomButtons: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  status: {
    marginTop: 16,
    color: '#FFA500',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

