import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Image, TouchableOpacity } from 'react-native';
import { auth } from '../services/firebaseConfig';
import TagInput from '../components/TagInput';
import { useRoute, RouteProp } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RootStackParamList } from '../navigation/AppNavigator';

type EntryRouteProp = RouteProp<RootStackParamList, 'JournalEntryForm'>;

export default function JournalScreen() {
  const [tags, setTags] = useState<string[]>([]);
  const navigation = useNavigation();
  const route = useRoute<EntryRouteProp>();
  const { entryId } = route.params || {};

  const [entry, setEntry] = useState({
    species: '',
    width: '',
    notes: '',
    location: '',
  });

  const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
    const loadEntry = async () => {
      if (!entryId) return;
      const user = auth.currentUser;
      if (!user) return;

      const entryRef = doc(db, `users/${user.uid}/journalEntries`, entryId);
      const snapshot = await getDoc(entryRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setEntry({
          species: data.species || '',
          width: data.width || '',
          notes: data.notes || '',
          location: data.location || '',
        });
        setImageUri(data.imageUri || null);
        setTags(data.tags || []);
      }
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
    Alert.alert("Missing Info", "Please add a species name and photo.");
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in", "Please log in to save journal entries.");
      return;
    }

    const userRef = collection(db, `users/${user.uid}/journalEntries`);
    const payload = {
      ...entry,
      imageUri,
      timestamp: new Date().toISOString(),
      tags,
    };

    if (entryId) {
      await setDoc(doc(userRef, entryId), payload); // update
    } else {
      await addDoc(userRef, payload); // new
    }

    Alert.alert("Success", "Journal entry saved.");
    setEntry({ species: '', width: '', notes: '', location: '' });
    setImageUri(null);
    setTags([]);
    navigation.goBack();
  } catch (err) {
    console.error("Error saving journal:", err);
    Alert.alert("Error", "Failed to save entry.");
  }
};

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hunt Journal</Text>

        <TextInput
          style={styles.input}
          placeholder="Species (e.g. White-tailed Deer)"
          placeholderTextColor="#ccc"
          value={entry.species}
          onChangeText={text => setEntry({ ...entry, species: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Antler Width (in inches)"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
          value={entry.width}
          onChangeText={text => setEntry({ ...entry, width: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Location (manual entry)"
          placeholderTextColor="#ccc"
          value={entry.location}
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

          <TagInput tags={tags} setTags={setTags} placeholder="Add tags like 'rifle' or 'morning'" />
        <Button title="Save Entry" onPress={handleSave} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    padding: 20,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 20,
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
});