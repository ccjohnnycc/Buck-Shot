import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
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
    const loadPhotos = async () => {
      const folderUri = FileSystem.documentDirectory + folderName + '/';
      const files = await FileSystem.readDirectoryAsync(folderUri);
      const jpgs = files.filter(f => f.endsWith('.jpg')).map(f => folderUri + f);
      setPhotos(jpgs);
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