import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Modal, Button, Alert, ImageBackground, TextInput } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const screenWidth = Dimensions.get('window').width;

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

export default function GalleryScreen() {
  const [huntFolders, setHuntFolders] = useState<Array<{
    title: string;
    folder: string;
    previewUri: string;
    photoCount: number;
    date: string;
  }>>([]);

  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  const navigation = useNavigation<NavProp>();

  // LOAD HUNT FOLDERS
  const loadHuntFolders = async () => {
    try {
      const items = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
      const huntFolders = items.filter(name =>
        name.startsWith('hunt_') && !name.endsWith('.jpg')
      );

      const huntData = await Promise.all(huntFolders.map(async folder => {
        const folderUri = FileSystem.documentDirectory + folder + '/';
        const files = await FileSystem.readDirectoryAsync(folderUri);
        const imageFiles = files.filter(f => f.endsWith('.jpg'));

        let title = "Untitled Hunt";
        try {
          const metadata = await FileSystem.readAsStringAsync(folderUri + 'metadata.json');
          title = JSON.parse(metadata).title;
        } catch (err) {
          console.warn(`No title found for ${folder}`);
        }

        return {
          folder,
          previewUri: folderUri + imageFiles[0],
          photoCount: imageFiles.length,
          date: new Date(Number(folder.split('_')[1])).toLocaleDateString(),
          title,
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

  // HANDLE: RENAME FOLDER
  const handleRename = (folder: string) => {
    setRenamingFolder(folder);
    setShowRenameModal(true);
    setRenameInput('');
  };

  // HANDLE: DELETE FOLDER
  const handleDelete = async (folder: string) => {
    Alert.alert(
      "Delete Hunt",
      "Are you sure you want to delete this hunt and all its photos?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const folderUri = FileSystem.documentDirectory + folder + '/';
              await FileSystem.deleteAsync(folderUri, { idempotent: true });
              loadHuntFolders();
            } catch (err) {
              console.error("Failed to delete folder:", err);
              Alert.alert("Error", "Could not delete the folder.");
            }
          }
        }
      ]
    );
  };

  // UI
  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.title}>Your Hunts</Text>
        </View>

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
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => handleRename(hunt.folder)}>
                    <Text style={[styles.imageLabel, { textDecorationLine: 'underline' }]}>Rename</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(hunt.folder)}>
                    <Text style={[styles.imageLabel, { textDecorationLine: 'underline', color: '#ff4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL: Rename Hunt */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowRenameModal(false);
          setRenameInput('');
          setRenamingFolder(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Hunt</Text>
            <TextInput
              style={styles.input}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Enter new title"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => {
                setShowRenameModal(false);
                setRenameInput('');
                setRenamingFolder(null);
              }} />
              <Button title="Save" onPress={async () => {
                if (renamingFolder && renameInput.trim()) {
                  const folderUri = FileSystem.documentDirectory + renamingFolder + '/';
                  await FileSystem.writeAsStringAsync(folderUri + 'metadata.json', JSON.stringify({ title: renameInput.trim() }));
                  setShowRenameModal(false);
                  setRenamingFolder(null);
                  setRenameInput('');
                  loadHuntFolders();
                }
              }} />
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// STYLES
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    marginTop: 40, 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
