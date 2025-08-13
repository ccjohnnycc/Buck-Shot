import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ImageBackground, Alert,
  ScrollView, Image, TouchableOpacity, Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseconfig';
import TagInput from '../components/TagInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';

type EntryRouteProp = RouteProp<RootStackParamList, 'JournalEntryForm'>;

const UNIT = 'in';

export default function JournalScreen() {
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('Guest');

  const navigation = useNavigation();
  const route = useRoute<EntryRouteProp>();
  const {
    entryId,
    imageUri: incomingUri,
    measurementValue,
    measurementLabel,
    measurement,     
    coords,
    userName
  } = route.params || {};

  const [entry, setEntry] = useState({
    species: '',
    width: '', 
    notes: '',
    location: '',
  });

  useEffect(() => {
    const loadEntry = async () => {
      const user = auth.currentUser;
      if (user) setUserEmail(user.email || userName || 'Unknown');

      // Editing an existing entry
      if (entryId && user) {
        const entryRef = doc(db, `users/${user.uid}/journalEntries`, entryId);
        const snapshot = await getDoc(entryRef);
        if (snapshot.exists()) {
          const data: any = snapshot.data();
          const label =
            (data.measurementLabel && String(data.measurementLabel)) ||
            (data.width != null ? `${data.width} ${UNIT}` : '');

          setEntry({
            species: data.species || '',
            width: label,
            notes: data.notes || '',
            location: data.location || '',
          });
          setImageUri(data.imageUri || null);
          setTags(Array.isArray(data.tags) ? data.tags : []);
        }
        setLocLoading(false);
        return;
      }

      // New entry 
      if (incomingUri) setImageUri(incomingUri);

      // location
      if (coords) {
        const loc = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setEntry(prev => ({ ...prev, location: loc }));
      } else {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const current = await Location.getCurrentPositionAsync();
            const loc = `${current.coords.latitude.toFixed(5)}, ${current.coords.longitude.toFixed(5)}`;
            setEntry(prev => ({ ...prev, location: loc }));
          }
        } catch {
        }
      }

      // width from Measure screen
      if (typeof measurementValue === 'number') {
        setEntry(prev => ({ ...prev, width: `${measurementValue} ${UNIT}` }));
      } else if (measurementLabel) {
        setEntry(prev => ({ ...prev, width: String(measurementLabel) })); 
      } else if (measurement != null) {
        setEntry(prev => ({ ...prev, width: `${measurement} ${UNIT}` }));
      }

      setLocLoading(false);
    };

    loadEntry();
  }, [entryId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!entry.species || !imageUri) {
      Alert.alert('Missing Info', 'Please add a species name and photo.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save journal entries.');
      return;
    }

    // ensure TagInput commits last token
    Keyboard.dismiss();
    await new Promise(res => setTimeout(res, 75));

    try {
      const userRef = collection(db, `users/${user.uid}/journalEntries`);

      // extract numeric part 
      const numericWidth = (() => {
        const m = String(entry.width).match(/[\d.]+/);
        return m ? Number(m[0]) : null;
      })();

      const payload: any = {
        ...entry,
        width: numericWidth,                                   
        measurementUnit: UNIT,                              
        measurementLabel: numericWidth != null ? `${numericWidth} ${UNIT}` : '',
        imageUri,
        timestamp: new Date().toISOString(),
        tags,                                                   
      };

      if (entryId) {
        await setDoc(doc(userRef, entryId), payload, { merge: true });
      } else {
        await addDoc(userRef, payload);
      }

      Alert.alert('Success', 'Journal entry saved.');
      setEntry({ species: '', width: '', notes: '', location: '' });
      setImageUri(null);
      setTags([]);
      navigation.goBack();
    } catch (err) {
      console.error('Error saving journal:', err);
      Alert.alert('Error', 'Failed to save entry.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"  
      >
        <Text style={styles.title}>Hunt Journal</Text>

        <Text style={styles.authorLabel}>Logged in as {userEmail}</Text>

        <TextInput
          style={styles.input}
          placeholder="Species (e.g. White-tailed Deer)"
          placeholderTextColor="#ccc"
          value={entry.species}
          onChangeText={text => setEntry({ ...entry, species: text })}
        />

        <TextInput
          style={styles.input}
          placeholder={`Antler Width (e.g., 18.25 ${UNIT})`}
          placeholderTextColor="#ccc"
          value={entry.width}
          onChangeText={text => setEntry({ ...entry, width: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Location (auto-filled)"
          placeholderTextColor="#ccc"
          value={locLoading ? 'Fetching…' : entry.location}
          onChangeText={text => setEntry({ ...entry, location: text })}
        />

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Notes"
          placeholderTextColor="#ccc"
          multiline
          value={entry.notes}
          onChangeText={text => setEntry({ ...entry, notes: text })}
        />

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: '#fff' }}>Tap to add photo of buck</Text>
          )}
        </TouchableOpacity>

        <TagInput
          tags={tags}
          setTags={setTags}
          placeholder="Add tags like 'rifle' or 'morning'"
        />

        <Button title="Save Entry" onPress={handleSave} />
      </ScrollView>
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
    padding: 10,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 45,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 25,
  },
  input: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  imagePicker: {
    width: '90%',
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  authorLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: '5%',
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    zIndex: 10,
  },
});
