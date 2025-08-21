import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity } from 'react-native';
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
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            const auth = getAuth(app);
            const db = getFirestore(app);
            if (!auth.currentUser) return;

            const reportsRef = collection(db, 'users', auth.currentUser.uid, 'harvestReports');
            const snapshot = await getDocs(reportsRef);
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));


            list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            setReports(list);
        } catch (err) {
            console.error('fetchReports failed:', err);
            Alert.alert('Error', 'Could not load reports. Pull to refresh to retry.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReports().finally(() => setRefreshing(false));
    };

    const deleteReport = async (id: string) => {
        if (deletingId) return; // simple debounce
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this report?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setDeletingId(id);
                        const auth = getAuth(app);
                        const db = getFirestore(app);
                        if (!auth.currentUser) return;
                        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'harvestReports', id));
                        await fetchReports();
                    } catch (err) {
                        console.error('deleteReport failed:', err);
                        Alert.alert('Error', 'Failed to delete the report. Try again.');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.reportItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.reportText}>
                    Date: {item.harvestDate ? new Date(item.harvestDate).toLocaleDateString() : '—'}
                </Text>
                <Text style={styles.reportText}>County/WMA: {item.countyOrWMA || '—'}</Text>
                <Text style={styles.reportText}>
                    Sex: {item.sex || '—'} {item.antlered ? '(Antlered)' : '(Antlerless)'}
                </Text>
                {item.antlered ? (
                    <Text style={styles.reportText}>Antler Points: {item.antlerPoints ?? '—'}</Text>
                ) : null}
                {item.tagNumber ? <Text style={styles.reportText}>Tag: {item.tagNumber}</Text> : null}
                {item.confirmationNumber ? (
                    <Text style={styles.reportText}>Confirmation #: {item.confirmationNumber}</Text>
                ) : null}
            </View>
            <Feather
                name="trash"
                size={20}
                color={deletingId === item.id ? '#888' : 'red'}
                onPress={() => (deletingId ? null : deleteReport(item.id))}
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                  </TouchableOpacity>
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
    
    backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    zIndex: 10,
  },
});