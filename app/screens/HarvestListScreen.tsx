import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Alert, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebaseconfig';
import { Feather } from '@expo/vector-icons';

type Harvest = {
    id: string;
    species: string;
    harvestDate?: string;
    countyOrWMA?: string;
    antlered?: boolean;
    sex?: 'Male' | 'Female';
};

export default function HarvestListScreen() {
    const navigation = useNavigation<any>();
    const [items, setItems] = useState<Harvest[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        const user = auth.currentUser;
        if (!user) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, `users/${user.uid}/harvestReports`));
            const data: Harvest[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            data.sort((a, b) => (b.harvestDate || '').localeCompare(a.harvestDate || ''));
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    const confirmDelete = (id: string) => {
        Alert.alert('Delete this harvest?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const user = auth.currentUser;
                    if (!user) return;
                    await deleteDoc(doc(db, `users/${user.uid}/harvestReports`, id));
                    load();
                },
            },
        ]);
    };

    return (
        <ImageBackground source={require('../../assets/background_image.png')} style={styles.background}>
            <View style={styles.overlay} />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            >
                <Text style={styles.title}>Harvests</Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('DeerHarvestLog')}
                >
                    <Text style={styles.primaryBtnText}>+ Create New Harvest</Text>
                </TouchableOpacity>

                {items.length === 0 ? (
                    <Text style={{ color: '#ccc', marginTop: 18 }}>No harvests yet.</Text>
                ) : (
                    items.map((h) => (
                        <Pressable
                            key={h.id}
                            style={styles.card}
                            onPress={() => navigation.navigate('DeerHarvestLog', { harvestId: h.id })}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.species}>{h.species || 'Unknown'}</Text>
                                {!!h.harvestDate && (
                                    <Text style={styles.detail}>Date: {new Date(h.harvestDate).toLocaleDateString()}</Text>
                                )}
                                {!!h.countyOrWMA && <Text style={styles.detail}>County/WMA: {h.countyOrWMA}</Text>}
                                {!!h.sex && <Text style={styles.detail}>Sex: {h.sex}{h.antlered ? ' (Antlered)' : ''}</Text>}
                            </View>

                            <View style={styles.rowRight}>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        confirmDelete(h.id);
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Delete</Text>
                                </TouchableOpacity>

                                <Feather name="chevron-right" size={22} color="#fff" />
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    container: { alignItems: 'center', paddingTop: 70, paddingBottom: 24, paddingHorizontal: 12 },
    title: { fontSize: 36, color: '#FFD700', fontWeight: 'bold', marginBottom: 16 },
    primaryBtn: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 16 },
    primaryBtnText: { color: '#000', fontWeight: 'bold' },
    card: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 14,
        marginVertical: 8,
        width: '92%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    species: { color: '#FFD700', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    detail: { color: '#eee', fontSize: 13, marginTop: 2 },
    actions: { alignItems: 'center', gap: 8 },
    actionBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 },
    deleteBtn: {
        backgroundColor: '#ff4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    chevron: { color: '#888', fontSize: 24, marginTop: 2 },
    backButton: { position: 'absolute', top: 30, left: 10, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, zIndex: 10 },
});
