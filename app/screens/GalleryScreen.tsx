import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Button, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const screenWidth = Dimensions.get('window').width;

export default function GalleryScreen() {
  const [imageUris, setImageUris] = useState<string[]>([]);

  const loadImages = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
      const jpgFiles = files.filter(file => file.endsWith('.jpg'));
      const uris = jpgFiles.map(file => FileSystem.documentDirectory + file);
      setImageUris(uris.reverse());
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };
  
  useEffect(() => {
    loadImages();
  }, []);

  const deleteImage = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      Alert.alert("Deleted", "Image removed from device.");
      loadImages(); // refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete image.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUris.length === 0 ? (
        <Text style={styles.message}>No saved images found.</Text>
      ) : (
        imageUris.map((uri, index) => (
            <View key={index} style={styles.imageBlock}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
              />
              <Button
                title="Delete"
                color="red"
                onPress={() => deleteImage(uri)}
              />
            </View>
          ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  image: {
    width: screenWidth * 0.95,
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
  },
  message: {
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  imageBlock: {
    marginVertical: 10,
    alignItems: 'center',
  },
});

