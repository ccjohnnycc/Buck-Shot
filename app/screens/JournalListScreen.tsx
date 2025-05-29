import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { deleteDoc, doc } from 'firebase/firestore';
import { Image } from 'react-native';
import { RefreshControl } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { useRoute, RouteProp } from '@react-navigation/native';

type JournalNavProp = NativeStackNavigationProp<RootStackParamList, 'JournalList'>;

export default function JournalListScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const navigation = useNavigation<JournalNavProp>();
  const [refreshing, setRefreshing] = useState(false);
  type JournalRouteProp = RouteProp<RootStackParamList, 'JournalList'>;
  const route = useRoute<JournalRouteProp>();
  const { filterTags } = route.params || {};

  const fetchEntries = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

const baseRef = collection(db, `users/${user.uid}/journalEntries`);
const userRef = Array.isArray(filterTags) && filterTags.length > 0
  ? query(baseRef, where('tags', 'array-contains-any', filterTags))
  : baseRef;

const snapshot = await getDocs(userRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEntries(data.reverse()); // newest first
  } catch (err) {
    console.error("Failed to fetch entries", err);
  }
};

  useEffect(() => {
    fetchEntries();
  }, [filterTags]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser?.uid}/journalEntries`, id));
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert("Error", "Failed to delete entry.");
    }
  };

  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={styles.background}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.container} refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Journal Entries</Text>
        <View style={styles.buttonWrapper}>
          <Button title="New Entry" onPress={() => navigation.navigate('JournalEntryForm', { entryId: undefined })} />
        </View>

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No entries found.</Text>
        ) : (
          entries.map((entry, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{entry.species}</Text>
                  <Text style={styles.details}>Width: {entry.width}"</Text>
                  <Text style={styles.details}>Location: {entry.location}</Text>
                  <Text style={styles.details}>Notes: {entry.notes}</Text>
                  <Text style={styles.details}>Date: {new Date(entry.timestamp).toLocaleDateString()}</Text>
                  <View style={styles.actionRow}>
                    <View style={styles.actionButton}>
                      <Button title="Edit" onPress={() => navigation.navigate('JournalEntryForm', { entryId: entry.id })} />
                    </View>
                    <View style={styles.actionButton}>
                      <Button title="Delete" color="#ff4444" onPress={() => deleteEntry(entry.id)} />
                    </View>
                  </View>
                </View>
                {entry.imageUri && (
                  <Image
                    source={{ uri: entry.imageUri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                )}
              </View>

            </View>
          ))
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
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
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '90%',
  },
  label: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#eee',
    marginBottom: 2,
  },
  buttonWrapper: {
    width: '80%',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: '#222',
  },
  actionRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
actionButton: {
  flex: 1,
  marginHorizontal: 2
}
});