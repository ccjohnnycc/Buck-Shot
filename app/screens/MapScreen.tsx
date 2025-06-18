import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ImageBackground, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';

type HuntPin = {
  id: string;
  title: string;
  tag: 'Tree Stand' | 'Pin' | 'Cam' | 'Feeder';
  latitude: number;
  longitude: number;
};

const iconMap = {
  'Tree Stand': require('../../assets/Tree-stand.png'),
  'Pin': require('../../assets/Pin.png'),
  'Cam': require('../../assets/Cam.png'),
  'Feeder': require('../../assets/Feeder.png'),
};
export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pins, setPins] = useState<HuntPin[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [activePin, setActivePin] = useState<HuntPin | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  const saveMapSnapshot = async () => {
    if (!mapRef.current) return;

    try {
      const uri = await captureRef(mapRef.current, {
        format: 'jpg',
        quality: 0.9,
      });

      const folderUri = FileSystem.documentDirectory + 'offline_maps/';
      const filename = `map_${Date.now()}.jpg`;
      const destinationUri = folderUri + filename;

      // ✅ Ensure the folder exists
      const folderInfo = await FileSystem.getInfoAsync(folderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      }

      // ✅ Use copyAsync instead of moveAsync (move often fails on iOS temp files)
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      Alert.alert('Saved', 'Map snapshot saved for offline viewing!');
    } catch (err) {
      console.error('Snapshot failed:', err);
      Alert.alert('Error', 'Failed to save map snapshot.');
    }
  };

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
      const saved = await AsyncStorage.getItem('huntPins');
      if (saved) setPins(JSON.parse(saved));
    })();
  }, []);

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
          <Text style={{ color: '#fff' }}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sidebar}>
        {(['Tree Stand', 'Pin', 'Cam', 'Feeder'] as (keyof typeof iconMap)[]).map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.sidebarButton,
              filterTag === tag && styles.sidebarButtonActive
            ]}
            onPress={() => setFilterTag(filterTag === tag ? null : tag)} // toggle
          >
            <Image source={iconMap[tag]} style={styles.sidebarIcon} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.overlay} />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
        onLongPress={(e) => {
          const coords = e.nativeEvent.coordinate;
          setSelectedCoords({ lat: coords.latitude, lon: coords.longitude });
        }}
      >
        {pins
          .filter(pin => !filterTag || pin.tag === filterTag)
          .map((pin) => (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              title={pin.title}
              image={iconMap[pin.tag]}
              onPress={() => setActivePin(pin)}
            />
          ))}
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {activePin && (
        <View style={styles.deletePinOverlay}>
          <Text style={styles.deleteText}>Title: {activePin.title}</Text>
          <Text style={styles.deleteText}>Type: {activePin.tag}</Text>
          <Button
            title="Delete Pin"
            color="#ff4444"
            onPress={async () => {
              const updatedPins = pins.filter(p => p.id !== activePin.id);
              setPins(updatedPins);
              await AsyncStorage.setItem('huntPins', JSON.stringify(updatedPins));
              setActivePin(null);
            }}
          />
          <Button title="Cancel" onPress={() => setActivePin(null)} />
        </View>
      )}

      <View style={styles.buttonStack}>
        <TouchableOpacity style={[styles.mapButton, styles.findBtn]} onPress={goToUserLocation}>
          <Text style={styles.mapButtonText}>Find Me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mapButton, styles.viewBtn]} onPress={() => navigation.navigate('OfflineMaps')}>
          <Text style={styles.mapButtonText}>View Saved Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mapButton, styles.saveBtn]} onPress={saveMapSnapshot}>
          <Text style={styles.mapButtonTextDark}>Save Map</Text>
        </TouchableOpacity>
      </View>
      {selectedCoords && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Tag this location</Text>
          <TextInput
            style={{
              backgroundColor: '#222',
              color: '#fff',
              padding: 10,
              borderRadius: 6,
              marginBottom: 12,
            }}
            placeholder="Optional pin title (e.g. North Feeder)"
            placeholderTextColor="#aaa"
            value={customTitle}
            onChangeText={setCustomTitle}
          />
          {['Tree Stand', 'Pin', 'Cam', 'Feeder'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.modalButton}
              onPress={async () => {
                const newPin: HuntPin = {
                  id: Date.now().toString(),
                  title: customTitle.trim() || type,
                  tag: type as HuntPin['tag'],
                  latitude: selectedCoords.lat,
                  longitude: selectedCoords.lon,
                };
                const updatedPins = [...pins, newPin];
                setPins(updatedPins);
                await AsyncStorage.setItem('huntPins', JSON.stringify(updatedPins));
                setSelectedCoords(null);
                setCustomTitle('');
              }}
            >
              <Text style={styles.modalButtonText}>{type}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Cancel" onPress={() => setSelectedCoords(null)} />
        </View>
      )}
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
  modal: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    zIndex: 10,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center'
  },
  modalButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  deletePinOverlay: {
    position: 'absolute',
    bottom: 20,
    top: 'auto',
    left: '20%',
    right: '20%',
    backgroundColor: '#222',
    padding: 5,
    borderRadius: 10,
    zIndex: 5,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  sidebar: {
    position: 'absolute',
    right: 10,
    top: 150,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingVertical: 10,
    zIndex: 10,
  },
  sidebarButton: {
    padding: 5,
    alignItems: 'center',
  },
  sidebarButtonActive: {
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  sidebarIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  buttonStack: {
    position: 'absolute',
    right: 15,
    bottom: 25,
    zIndex: 10,
    alignItems: 'flex-end',
  },

  mapButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  viewBtn: {
    backgroundColor: '#2f95dc',
    top: 30,
  },

  saveBtn: {
    backgroundColor: '#FFD700',
    position: 'absolute',
  },

  findBtn: {
    backgroundColor: '#FF0000',
    top: 40,
  },

  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  mapButtonTextDark: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});