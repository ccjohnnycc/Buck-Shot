import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, Dimensions, Text, ImageBackground } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRoute } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

export default function HuntDetailScreen() {
  const { folderName } = useRoute().params as { folderName: string };
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const loadPhotos = async () => {
      const folderUri = FileSystem.documentDirectory + folderName + '/';
      const files = await FileSystem.readDirectoryAsync(folderUri);
      const jpgs = files.filter(f => f.endsWith('.jpg'));
      setPhotos(jpgs.map(f => folderUri + f));
    };
    loadPhotos();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hunt Details</Text>
        {photos.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: screenWidth * 0.9,
    height: 280,
    borderRadius: 10,
    marginBottom: 15,
  },
});