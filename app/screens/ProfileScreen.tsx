import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Button, ActivityIndicator, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { uploadTestHunt } from '../services/firebaseUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth } from '../services/firebaseconfig';
import { signOut } from 'firebase/auth';
import { registerForPushNotificationsAsync, scheduleSeasonNotifications } from './notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

const ProfileScreen = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [huntCount, setHuntCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

    const huntSnapshot = await getDocs(collection(db, `users/${user.uid}/hunts`));
    setHuntCount(huntSnapshot.size);

    const journalSnapshot = await getDocs(collection(db, `users/${user.uid}/journalEntries`));
    setJournalCount(journalSnapshot.size);
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
    setLoading(true);

    try {
      const result = await uploadTestHunt();
      if (result.success) {
        setStatus(`Uploaded`);
        await fetchStats(email || (await AsyncStorage.getItem('userEmail')) || '');
      } else {
        setStatus('Upload failed. See console.');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    registerForPushNotificationsAsync().then(() => {
      scheduleSeasonNotifications();
    });
  }, []);


  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.container}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require('../../assets/placeholder_user.png') // Add a default icon here
            }
            style={styles.profilePic}
          />
        </TouchableOpacity>
        <Feather name="user" size={80} color="#FFD700" />
        <Text style={styles.title}>My Profile </Text>

        <View style={styles.statsBox}>
          <Text style={styles.stat}>Email: {name || email || 'Guest'}</Text>
          <Text style={styles.stat}>Total Hunts: {huntCount}</Text>
          <Text style={styles.stat}>Journal Entries: {journalCount}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate({ name: 'JournalList', params: {} })}
          >
            <Text style={styles.buttonText}>View Journal </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate({ name: 'Gallery', params: {} })}
          >
            <Text style={styles.buttonText}>View Hunt Gallery </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomButtons}>
          <Button
            title="Sync to Cloud"
            onPress={handleUpload}
            color="#FFA500"
            disabled={loading}
          />

          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#2f95dc' }]}
            onPress={sendTestNotification}
          >
            <Text style={styles.buttonText}>Send Test Notification</Text>
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
        {loading && <ActivityIndicator size="large" color="#FFD700" />}
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DeerHarvestLog')}
      >
        <Text style={styles.buttonText}>Log a Deer Harvest</Text>
      </TouchableOpacity>
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
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 10,
  },
});