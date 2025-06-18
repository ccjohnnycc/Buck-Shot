import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OfflineMapsScreen() {
  const [images, setImages] = useState<string[]>([]);
  const navigation = useNavigation();

  const loadImages = async () => {
    try {
      const folderUri = FileSystem.documentDirectory + 'offline_maps/';
      const dirInfo = await FileSystem.getInfoAsync(folderUri);

      if (!dirInfo.exists) {
        setImages([]);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(folderUri);
      const jpgs = files.filter(file => file.endsWith('.jpg')).map(f => folderUri + f);
      setImages(jpgs.reverse()); // Newest first
    } catch (err) {
      console.error('Failed to load offline maps:', err);
    }
  };

  const deleteImage = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri);
      await loadImages();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete image.');
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onLongPress={() =>
        Alert.alert('Delete?', 'Do you want to delete this map?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteImage(item),
          },
        ])
      }
    >
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Maps</Text>
      {images.length === 0 ? (
        <Text style={styles.message}>No saved maps found.</Text>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
        />
      )}
            <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 30,
          left: 10,
          padding: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          zIndex: 10,
        }}
      >
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: {
    fontSize: 24,
    color: '#FFD700',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
    top: 15,
  },
  message: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  list: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  image: {
    width: width * 0.9,
    height: 220,
    marginVertical: 10,
    borderRadius: 12,
  },
});