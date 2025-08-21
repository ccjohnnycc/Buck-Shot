
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { uploadTestHunt } from '../services/firebaseUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { signOut } from 'firebase/auth';
import { registerForPushNotificationsAsync, scheduleSeasonNotifications } from './notifications';
import * as ImagePicker from 'expo-image-picker';
import BSButton from '../components/BSButton';

const ProfileScreen = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [huntCount, setHuntCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState<string>(''); // reserved for future profile names
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load cached email/avatar, then fetch counts
  useEffect(() => {
    AsyncStorage.getItem('userEmail').then((storedEmail) => {
      if (storedEmail) {
        setEmail(storedEmail);
        fetchStats(storedEmail);
      }
      AsyncStorage.getItem('profileImage').then((uri) => {
        if (uri) setProfileImage(uri);
      });
    });
  }, []);

  // Query Firestore for simple stats
  const fetchStats = async (_userEmail: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const huntSnapshot = await getDocs(collection(db, `users/${user.uid}/hunts`));
    setHuntCount(huntSnapshot.size);

    const journalSnapshot = await getDocs(collection(db, `users/${user.uid}/journalEntries`));
    setJournalCount(journalSnapshot.size);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userEmail');
      navigation.reset({ index: 0, routes: [{ name: 'AuthLanding' }] });
    } catch (err: any) {
      Alert.alert('Logout failed', err.message);
    }
  };

  // Pick local avatar and cache URI
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

  // Test cloud sync; refresh counts
  const handleUpload = async () => {
    setStatus('Uploading test hunt…');
    setLoading(true);
    try {
      const result = await uploadTestHunt();
      if (result.success) {
        setStatus('Uploaded');
        await fetchStats(email || (await AsyncStorage.getItem('userEmail')) || '');
      } else {
        setStatus('Upload failed.');
      }
    } catch {
      setStatus('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Register for push + schedule season reminders
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
            source={profileImage ? { uri: profileImage } : require('../../assets/placeholder_user.png')}
            style={styles.profilePic}
          />
        </TouchableOpacity>

        <Feather name="user" size={80} color="#FFD700" />
        <Text style={styles.title}>My Profile</Text>

        <View style={styles.statsBox}>
          <Text style={styles.stat}>Email: {name || email || 'Guest'}</Text>
          <Text style={styles.stat}>Total Hunts: {huntCount}</Text>
          <Text style={styles.stat}>Journal Entries: {journalCount}</Text>
        </View>

        {/* Navigation */}
        <View style={styles.buttonGroup}>
          <BSButton
            label="View Journal"
            onPress={() => navigation.navigate({ name: 'JournalList', params: {} })}
            style={{ width: '100%', marginBottom: 12 }}
          />
          <BSButton
            label="View Hunt Gallery"
            onPress={() => navigation.navigate({ name: 'Gallery', params: {} })}
            style={{ width: '100%' }}
          />
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomButtons}>
          <BSButton
            label="Sync to Cloud"
            onPress={handleUpload}
            loading={loading}
            variant="secondary"
            style={{ width: '100%' }}
          />

          <View style={{ marginVertical: 8 }} />
          <BSButton label="Logout" onPress={handleLogout} variant="danger" style={{ width: '100%' }} />
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {loading && <ActivityIndicator size="large" color="#FFD700" />}
      </View>

      {/* Shortcut to harvest reports */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <BSButton label="Deer Harvest Reports" onPress={() => navigation.navigate('HarvestReports')} style={{ width: '100%' }} />
      </View>
    </ImageBackground>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 },
  title: { fontSize: 24, color: '#FFD700', fontWeight: 'bold', marginTop: 10, marginBottom: 20 },
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
  stat: { color: '#fff', fontSize: 16, marginBottom: 6 },
  buttonGroup: { width: '90%', marginBottom: 20 },
  bottomButtons: { marginTop: 10, width: '80%' },
  status: { marginTop: 20, color: '#fff', fontStyle: 'italic' },
  profilePic: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#FFD700', marginBottom: 10 },
});