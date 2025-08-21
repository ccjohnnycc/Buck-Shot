import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions,
  Alert, Modal, TextInput, ScrollView
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type Meta = { description?: string; tags?: string[] };

// Map a JPG path to its sidecar JSON metadata file
const metaPath = (jpgUri: string) => jpgUri.replace(/\.jpg$/i, '.json');

export default function OfflineMapsScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [metas, setMetas] = useState<Record<string, Meta>>({});
  const navigation = useNavigation();
  const flatRef = useRef<FlatList<string>>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [editUri, setEditUri] = useState<string | null>(null);
  const [descInput, setDescInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Load snapshots + sidecar metadata (newest first)
  const loadImages = async () => {
    try {
      const folderUri = FileSystem.documentDirectory + 'offline_maps/';
      const dirInfo = await FileSystem.getInfoAsync(folderUri);

      if (!dirInfo.exists) {
        setImages([]);
        setMetas({});
        return;
      }

      const files = await FileSystem.readDirectoryAsync(folderUri);
      const jpgs = files.filter((file) => file.endsWith('.jpg')).map((f) => folderUri + f);
      const newestFirst = jpgs.sort((a, b) => {
        const aTime = parseInt(a.match(/(\d+)/)?.[0] || '0', 10);
        const bTime = parseInt(b.match(/(\d+)/)?.[0] || '0', 10);
        return bTime - aTime;
      });
      setImages(newestFirst);

      const metaEntries: [string, Meta][] = [];
      for (const jpg of newestFirst) {
        try {
          const mp = metaPath(jpg);
          const info = await FileSystem.getInfoAsync(mp);
          if (info.exists) {
            const raw = await FileSystem.readAsStringAsync(mp);
            try {
              metaEntries.push([jpg, JSON.parse(raw)]);
            } catch {
              /* ignore bad/corrupt meta and continue */
            }
          }
        } catch {
          /* ignore meta read errors and continue */
        }
      }
      setMetas(Object.fromEntries(metaEntries));

      requestAnimationFrame(() => {
        flatRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch {
      Alert.alert('Error', 'Could not load offline maps.');
    }
  };

  const deleteImage = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      try {
        await FileSystem.deleteAsync(metaPath(uri), { idempotent: true });
      } catch {}
      await loadImages();
      setViewerUri(null);
    } catch {
      Alert.alert('Error', 'Failed to delete image.');
    }
  };

  // Save/overwrite sidecar JSON for one image
  const saveMeta = async (uri: string, meta: Meta) => {
    try {
      await FileSystem.writeAsStringAsync(metaPath(uri), JSON.stringify(meta));
      setMetas((prev) => ({ ...prev, [uri]: meta }));
    } catch {
      Alert.alert('Error', 'Failed to save details.');
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const openEdit = (uri: string) => {
    const m = metas[uri] || {};
    setDescInput(m.description || '');
    setTagsInput((m.tags || []).join(', '));
    setEditUri(uri);
  };

  const renderItem = ({ item }: { item: string }) => {
    const m = metas[item];
    return (
      <TouchableOpacity
        onPress={() => item && setViewerUri(item)}
        onLongPress={() =>
          Alert.alert('Delete Map', 'Are you sure you want to delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteImage(item) },
          ])
        }
        style={styles.card}
      >
        <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
        {(m?.description || (m?.tags && m.tags.length > 0)) && (
          <View style={styles.metaBar}>
            {m.description ? <Text style={styles.metaText}>{m.description}</Text> : null}
            {m.tags && m.tags.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {m.tags.map((t, i) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
        )}
        <TouchableOpacity style={styles.editPill} onPress={() => openEdit(item)}>
          <Text style={styles.editPillText}>Edit</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Maps</Text>

      {images.length === 0 ? (
        <Text style={styles.message}>No saved maps found.</Text>
      ) : (
        <FlatList
          ref={flatRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          initialNumToRender={8} // smoother first paint
        />
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Fullscreen viewer */}
      <Modal visible={!!viewerUri} transparent animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <View style={styles.viewerWrap}>
          {viewerUri ? (
            <>
              <Image source={{ uri: viewerUri }} style={styles.fullImage} resizeMode="contain" />
              <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerUri(null)}>
                <Text style={styles.viewerCloseText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.viewerActions}>
                <TouchableOpacity style={styles.viewerBtn} onPress={() => openEdit(viewerUri)}>
                  <Text style={styles.viewerBtnText}>Edit Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewerBtn, { backgroundColor: '#ff4444' }]}
                  onPress={() => {
                    Alert.alert('Delete Map', 'Delete this image?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteImage(viewerUri) },
                    ]);
                  }}
                >
                  <Text style={styles.viewerBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </Modal>

      {/* Edit description/tags */}
      <Modal visible={!!editUri} transparent animationType="fade" onRequestClose={() => setEditUri(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Map Details</Text>
            <TextInput
              placeholder="Description"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={descInput}
              onChangeText={setDescInput}
            />
            <TextInput
              placeholder="Tags (comma separated)"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={tagsInput}
              onChangeText={setTagsInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#555' }]} onPress={() => setEditUri(null)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={async () => {
                  if (!editUri) return;
                  const cleanedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
                  await saveMeta(editUri, { description: descInput.trim() || undefined, tags: cleanedTags });
                  setEditUri(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  message: { color: '#aaa', textAlign: 'center', marginTop: 50, fontSize: 16 },
  list: { alignItems: 'center', paddingBottom: 20 },
  card: { width: width * 0.9, marginVertical: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' },
  image: { width: '100%', height: 220 },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  // meta / tags row under image
  metaBar: { padding: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  metaText: { color: '#fff', marginBottom: 6 },
  tagChip: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6 },
  tagText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  editPill: { position: 'absolute', right: 10, top: 10, backgroundColor: '#2f95dc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  editPillText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // viewer
  viewerWrap: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width, height, flex: 1 },
  viewerClose: { position: 'absolute', top: 48, right: 30, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  viewerCloseText: { color: '#FFD700', fontSize: 32, fontWeight: 'bold' },
  viewerActions: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  viewerBtn: { backgroundColor: '#2f95dc', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginHorizontal: 6 },
  viewerBtnText: { color: '#fff', fontWeight: 'bold' },

  // edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  editCard: { width: '85%', backgroundColor: '#222', borderRadius: 10, padding: 16 },
  editTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  modalBtn: { backgroundColor: '#FFD700', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});