import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function JournalScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute();
  const {
    imageUri: defaultImageUri,
    measurement,
    coords,
    userName
  } = (params as any) || {};

  // default coords if not provided
  const [entry, setEntry] = useState({
    species: '',
    width: measurement ?? '',
    notes: '',
    location: coords
      ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
      : ''
  });

  // default image URI if provided
  const [imageUri, setImageUri] = useState<string | null>(defaultImageUri || null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Cannot auto-fill location without permission.');
        setLocLoading(false);
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      // round to 5 decimals:
      const locString = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      setEntry(e => ({ ...e, location: locString }));
      setLocLoading(false);
    })();
  }, []);


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

      //const userRef = collection(db, `users/${user.uid}/journalEntries`);
      await addDoc(
        collection(db, 'users', user.uid, 'journalEntries'),
        {
          species: entry.species,
          width: entry.width,
          notes: entry.notes,
          location: entry.location,
          imageUri,
          timestamp: new Date().toISOString(),
          author: userName
        }
      );
      Alert.alert("Success", "Journal entry saved.");
      // go right back to Measure
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'Measure' },
        ],
      });
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
        <Text style={styles.title}>Hunt Journal </Text>

        <Text style={styles.authorLabel}>Logged in as {userName}</Text>

        <TextInput
          style={styles.input}
          placeholder="Species (e.g. White-tailed Deer)"
          placeholderTextColor="#ccc"
          value={entry.species}
          onChangeText={text => setEntry({ ...entry, species: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Measurement (inches)"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
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
            <Text style={{ color: '#fff' }}>Tap to add photo of buck </Text>
          )}
        </TouchableOpacity>

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
});