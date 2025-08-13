import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { folderName, startIndex = 0 } = route.params || {};
  const [photos, setPhotos] = useState<string[]>([]);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (!folderName) {
      Alert.alert('No Folder', 'Could not open photos for this item.');
      navigation.goBack();
      return;
    }

    const loadPhotos = async () => {
      try {
        const folderUri = FileSystem.documentDirectory + folderName + '/';
        const files = await FileSystem.readDirectoryAsync(folderUri);
        const jpgs = files.filter(f => f.endsWith('.jpg')).map(f => folderUri + f);
        if (jpgs.length === 0) {
          Alert.alert('No Photos', 'This folder is empty.');
          navigation.goBack();
          return;
        }
        setPhotos(jpgs);
      } catch (err) {
        Alert.alert('Error', 'Failed to load photos for this folder.');
        navigation.goBack();
      }
    };
    loadPhotos();
  }, [folderName]);

  if (!photos.length) return null;


  return (
    <View style={styles.container}>
      <Image source={{ uri: photos[index] }} style={styles.fullImage} resizeMode="contain" />
      {/* Left arrow */}
      {index > 0 && (
        <TouchableOpacity style={styles.left} onPress={() => setIndex(index - 1)}>
          <Text style={styles.arrow}>{'‹'}</Text>
        </TouchableOpacity>
      )}
      {/* Right arrow */}
      {index < photos.length - 1 && (
        <TouchableOpacity style={styles.right} onPress={() => setIndex(index + 1)}>
          <Text style={styles.arrow}>{'›'}</Text>
        </TouchableOpacity>
      )}
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.closeButton, { right: 80 }]}
        onPress={() => {
          Alert.alert(
            "Delete Photo",
            "Are you sure you want to delete this item?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await FileSystem.deleteAsync(photos[index]);
                    const updatedPhotos = photos.filter((_, i) => i !== index);
                    setPhotos(updatedPhotos);
                    setIndex(Math.max(index - 1, 0));
                  } catch (err) {
                    Alert.alert("Error", "Failed to delete photo.");
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.closeText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: width, height: height, flex: 1 },
  arrow: { fontSize: 60, color: '#FFD700', fontWeight: 'bold', opacity: 0.8 },
  left: { position: 'absolute', left: 20, top: '50%', zIndex: 2 },
  right: { position: 'absolute', right: 20, top: '50%', zIndex: 2 },
  closeButton: { position: 'absolute', top: 48, right: 30, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  closeText: { color: '#FFD700', fontSize: 32, fontWeight: 'bold' },
});