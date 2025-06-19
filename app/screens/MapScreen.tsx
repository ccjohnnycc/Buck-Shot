import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ImageBackground, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
    const [region, setRegion] = useState<Region | null>(null);
    const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const mapRef = useRef<MapView>(null);

    const goToUserLocation = async () => {
        setLoading(true);
        setError('');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError('Permission to access location was denied.');
            setLoading(false);
            return;
        }
        let location = await Location.getCurrentPositionAsync({});
        const userRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
        };
        setRegion(userRegion);
        setMarker(null);
        mapRef.current?.animateToRegion(userRegion, 1000);
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        setError('');
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search.trim())}`;
            const res = await fetch(url);
            const results = await res.json();
            if (results && results.length > 0) {
                const loc = results[0];
                const searchRegion = {
                    latitude: parseFloat(loc.lat),
                    longitude: parseFloat(loc.lon),
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                };
                setRegion(searchRegion);
                setMarker({
                    latitude: parseFloat(loc.lat),
                    longitude: parseFloat(loc.lon)
                });
                mapRef.current?.animateToRegion(searchRegion, 1000);
            } else {
                setError('No results found.');
            }
        } catch {
            setError('Search failed.');
        }
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied.');
                setLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            });
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <ImageBackground source={require('../../assets/background_image.png')} style={{ flex: 1 }}>
                <View style={styles.overlay} />
                <View style={styles.center}><ActivityIndicator size="large" /></View>
            </ImageBackground>
        );
    }
    if (error) {
        return (
            <ImageBackground source={require('../../assets/background_image.png')} style={{ flex: 1 }}>
                <View style={styles.overlay} />
                <View style={styles.center}>
                    <Text style={{ color: 'white' }}>{error}</Text>
                </View>
            </ImageBackground>
        );
    }
    if (!region) return null;

    return (
        <ImageBackground source={require('../../assets/background_image.png')} style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search for a place"
                    placeholderTextColor="#ccc"
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={{ color: '#fff' }}>Search </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.overlay} />
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                region={region}
                showsUserLocation
                showsMyLocationButton={false}
                onRegionChangeComplete={setRegion}
            >
                {marker && <Marker coordinate={marker} />}
            </MapView>
            <TouchableOpacity style={styles.findMeBtn} onPress={goToUserLocation}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Find Me </Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },

    searchContainer: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 18,
        zIndex: 2,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 8,
        fontSize: 16,
    },
    searchBtn: {
        backgroundColor: '#2f95dc',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    findMeBtn: {
        position: 'absolute',
        bottom: 15,
        right: 10,
        backgroundColor: '#2f95dc',
        borderRadius: 20,
        paddingVertical: 13,
        paddingHorizontal: 26,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        zIndex: 2,
    },
});