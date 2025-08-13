import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../services/firebaseconfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import BSButton from '../components/BSButton';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'HarvestReports'>;

export default function HarvestReportsScreen() {
  const navigation = useNavigation<NavProp>();
  const [reports, setReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (!auth.currentUser) return;
    const reportsRef = collection(db, 'users', auth.currentUser.uid, 'harvestReports');
    const snapshot = await getDocs(reportsRef);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setReports(list);
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const deleteReport = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const auth = getAuth(app);
          const db = getFirestore(app);
          if (!auth.currentUser) return;
          await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'harvestReports', id));
          fetchReports();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.reportItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reportText}>Date: {item.date}</Text>
        <Text style={styles.reportText}>Location: {item.location}</Text>
      </View>
      <Feather
        name="trash"
        size={20}
        color="red"
        onPress={() => deleteReport(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <BSButton
        variant="primary"
        label="New Deer Harvest Report"
        onPress={() => navigation.navigate('DeerHarvestLog')}
        style={{ marginBottom: 40, top: 20 }}
      />

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No harvest reports found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  reportText: { color: '#fff' },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 },
});