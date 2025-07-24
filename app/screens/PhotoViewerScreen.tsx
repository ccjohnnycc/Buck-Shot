import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PhotoViewerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { folderName, startIndex = 0 } = route.params || {};
  const [photos, setPhotos] = useState<string[]>([]);
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });

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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Image source={{ uri: photos[index] }} style={styles.fullImage} resizeMode="contain" />

        {/* Back Arrow */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullImage: {
    width: width,
    height: height,
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    zIndex: 10,
  },
});