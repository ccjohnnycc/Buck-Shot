import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../services/firebaseconfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'HarvestReports'>;

export default function HarvestReportsScreen() {
    const navigation = useNavigation<NavProp>();
    const [reports, setReports] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReports();
        setRefreshing(false);
    };

    const fetchReports = async () => {
        const auth = getAuth(app);
        const db = getFirestore(app);
        const user = auth.currentUser;
        if (!user) return;

        const ref = collection(db, `users/${user.uid}/harvestReports`);
        const snap = await getDocs(ref);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data.reverse());
    };

    const confirmDelete = (id: string) => {
        Alert.alert(
            "Delete Report",
            "Are you sure you want to delete this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const auth = getAuth(app);
                        const db = getFirestore(app);
                        const user = auth.currentUser;
                        if (!user) return;
                        await deleteDoc(doc(db, `users/${user.uid}/harvestReports`, id));
                        setReports(prev => prev.filter(r => r.id !== id));
                    }
                }
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [])
    );

    return (
        <View style={[styles.container, { flex: 1 }]}>

            <FlatList
                data={reports}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={
                    <>
                        <Text style={styles.title}>Deer Harvest Reports</Text>
                        <TouchableOpacity style={styles.newButton} onPress={() => navigation.navigate('DeerHarvestLog')}>
                            <Text style={styles.newButtonText}>New Deer Harvest Report</Text>
                        </TouchableOpacity>
                    </>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.label}>Date: {new Date(item.harvestDate).toLocaleDateString()}</Text>
                        <Text style={styles.label}>Sex: {item.sex}</Text>
                        <Text style={styles.label}>Antlered: {item.antlered ? 'Yes' : 'No'}</Text>
                        {item.antlerPoints !== null && <Text style={styles.label}>Points: {item.antlerPoints}</Text>}
                        <Text style={styles.label}>County/WMA: {item.countyOrWMA}</Text>
                        <Text style={styles.label}>Tag #: {item.tagNumber || 'N/A'}</Text>
                        <Text style={styles.label}>Confirmation #: {item.confirmationNumber || 'N/A'}</Text>
                        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                            <Text style={{ color: '#ff4444', marginTop: 10 }}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
            >
                <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingTop: 60, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', marginBottom: 20 },
    newButton: {
        backgroundColor: '#2f95dc',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    newButtonText: { color: '#fff', fontWeight: 'bold' },
    card: {
        backgroundColor: '#222',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    label: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 2,
    },
    backButton: {
        position: 'absolute',
        top: 30,
        left: 10,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        zIndex: 10,
    },
});