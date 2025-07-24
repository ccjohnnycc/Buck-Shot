import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, Dimensions, Text, ImageBackground, Alert, Button } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRoute, useNavigation } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function HuntDetailScreen() {
  const { folderName } = useRoute().params as { folderName: string };
  const navigation = useNavigation<any>()
  const [photos, setPhotos] = useState<string[]>([]);

  const handleDeletePhoto = (uriToDelete: string) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?",
      [{ text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(uriToDelete, { idempotent: true });
            setPhotos(prev => prev.filter(uri => uri !== uriToDelete));
            Alert.alert('Deleted', 'Photo removed.');
          } catch (err) {
            console.error('Delete failed:', err);
            Alert.alert('Delete failed');
          }
        }
      }
      ]
    );
  };

  useEffect(() => {
    const loadPhotos = async () => {
      const folderUri = FileSystem.documentDirectory + folderName + '/';
      const files = await FileSystem.readDirectoryAsync(folderUri);
      const jpgs = files.filter(f => f.endsWith('.jpg'));
      setPhotos(jpgs.map(f => folderUri + f));
    };
    loadPhotos();
  }, []);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background_image.png')}
        style={styles.background}
      >
        <View style={styles.overlay} />

        {/* Top Nav Buttons */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>


        <ScrollView contentContainerStyle={styles.container}>
          {photos.map((uri, index) => (
            <Swipeable
              key={index}
              renderRightActions={() => renderRightActions(() => handleDeletePhoto(uri))}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('PhotoViewer', { folderName, startIndex: index })}
                activeOpacity={0.85}
              >
                <View style={styles.photoCard}>
                  <Image source={{ uri }} style={styles.image} />

                  {/* Optional fallback delete button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePhoto(uri)}
                  >
                    <Text style={styles.deleteText}>Delete Photo </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Swipeable>
          ))}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const renderRightActions = (onDelete: () => void) => (
  <View style={styles.swipeDelete}>
    <Button title="Delete" color="#ff4444" onPress={onDelete} />
  </View>
);

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
    paddingVertical: 55,
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
  photoCard: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#000',
    paddingRight: 20,
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    zIndex: 10,
  },

  backText: {
    color: '#FFD700',
    marginLeft: -15,
    marginTop: -35,
    fontSize: 35,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 20,
    zIndex: 10,
    borderRadius: 20,
    padding: 10,
  },
  deleteButton: {
    marginTop: -5,
    backgroundColor: '#ff4444',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});