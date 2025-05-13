import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Modal, Button, Alert, ImageBackground } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const screenWidth = Dimensions.get('window').width;

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

export default function GalleryScreen() {
  const [huntFolders, setHuntFolders] = useState<Array<{
    folder: string;
    previewUri: string;
    photoCount: number;
    date: string;
  }>>([]);

  const navigation = useNavigation<NavProp>();
  
 const loadHuntFolders = async () => {
    try {
      const items = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
      const huntFolders = items.filter(name => name.startsWith('hunt_'));

      const huntData = await Promise.all(huntFolders.map(async folder => {
        const folderUri = FileSystem.documentDirectory + folder + '/';
        const files = await FileSystem.readDirectoryAsync(folderUri);
        const imageFiles = files.filter(f => f.endsWith('.jpg'));

        return {
          folder,
          previewUri: folderUri + imageFiles[0],  // show first image as preview
          photoCount: imageFiles.length,
          date: new Date(Number(folder.split('_')[1])).toLocaleDateString(),
        };
      }));

      setHuntFolders(huntData.reverse()); // newest first
    } catch (error) {
      console.error('Failed to load hunts:', error);
    }
  };

  useEffect(() => {
    loadHuntFolders();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Hunts</Text>

        {huntFolders.length === 0 ? (
          <Text style={styles.message}>No saved hunts found.</Text>
        ) : (
          huntFolders.map((hunt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageCard}
              onPress={() => navigation.navigate('HuntDetail', { folderName: hunt.folder })}
            >
              <Image source={{ uri: hunt.previewUri }} style={styles.image} />
              <View style={styles.infoPanel}>
                <Text style={styles.imageLabel}>{hunt.date}</Text>
                <Text style={styles.imageLabel}>{hunt.photoCount} photos</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 40,
  },
  imageCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    width: screenWidth * 0.9,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    backgroundColor: '#1f1f1f',
  },
  image: {
    width: '100%',
    height: 280,
  },
  infoPanel: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageLabel: {
    color: '#fff',
    fontSize: 14,
  },
});
