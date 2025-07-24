import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ImageBackground, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Keyboard } from 'react-native';
import FloridaBoundariesSimplified from '../../json/FloridaBoundariesSimplified.json';



type HuntPin = {
  id: string;
  title: string;
  tag: 'Tree Stand' | 'Pin' | 'Cam' | 'Feeder';
  latitude: number;
  longitude: number;
};

const iconMap: Record<HuntPin['tag'], any> = {
  'Tree Stand': require('../../assets/Tree-stand.png'),
  'Pin': require('../../assets/Pin.png'),
  'Cam': require('../../assets/Cam.png'),
  'Feeder': require('../../assets/Feeder.png'),
};

type ParsedPolygon = {
  id: string;
  coords: { latitude: number; longitude: number }[];
};


export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pins, setPins] = useState<HuntPin[]>([]);
  const [activePin, setActivePin] = useState<HuntPin | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedStateLandPolygons, setParsedPolygons] = useState<ParsedPolygon[]>([]);
  const [visiblePolygons, setVisiblePolygons] = useState<ParsedPolygon[]>([]);
  const MAX_POLYGONS = 30;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pendingTitle, setPendingTitle] = useState('');
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const [savingDisabled, setSavingDisabled] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);


  const demoPolygons = [
    {
      id: 'miami',
      coords: [
        { latitude: 26.7232, longitude: -80.4610 },
        { latitude: 26.6907, longitude: -79.8892 },
        { latitude: 25.7295, longitude: -80.1358 },
        { latitude: 25.4508, longitude: -80.4776 },
      ],
    },
    {
      id: 'orlando',
      coords: [
        { latitude: 28.4204, longitude: -81.1870 },
        { latitude: 28.4010, longitude: -81.5108 },
        { latitude: 28.6507, longitude: -81.5438 },
        { latitude: 28.6381, longitude: -81.2288 },
      ],
    },
    {
      id: 'tampa',
      coords: [
        { latitude: 27.6590, longitude: -82.8031 },
        { latitude: 28.3697, longitude: -82.8541 },
        { latitude: 28.3572, longitude: -82.0472 },
        { latitude: 27.6213, longitude: -81.9952 },
      ],
    },
    {
      id: 'Jacksonville',
      coords: [
        { latitude: 29.9551, longitude: -81.2531 },
        { latitude: 29.8743, longitude: -81.8668 },
        { latitude: 30.5925, longitude: -81.9911 },
        { latitude: 30.6292, longitude: -81.2881 },
      ],
    },
  ];

  type GeoJson = {
    features: {
      geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: any;
      };
    }[];
  };

  useEffect(() => {
    const checkTooltip = async () => {
      const seen = await AsyncStorage.getItem('seenPinTip');
      if (!filterTag) return;
    };
    checkTooltip();
  }, []);



 useEffect(() => {
  const parsed = (FloridaBoundariesSimplified as GeoJson).features.flatMap((feature, index) => {
    if (!feature.geometry) return [];

    const { type, coordinates } = feature.geometry;

    if (type === 'Polygon') {
      return [{
        id: `polygon-${index}`,
        coords: coordinates[0]
          .slice(0, 200) // LIMIT complexity
          .map(([lng, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          })),
      }];
    }

    if (type === 'MultiPolygon') {
      return coordinates.flatMap((poly: [number, number][][], polyIndex: number) => ({
        id: `multipolygon-${index}-${polyIndex}`,
        coords: poly[0]
          .filter(([lng, lat]) => lng && lat)
          .slice(0, 200)
          .map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          }))
      }));
    }

    return [];
  });

  setParsedPolygons(parsed); 
  console.log('Parsed polygons loaded:', parsed.length);
}, []);

  const saveMapSnapshot = async () => {
    if (!mapRef.current || savingDisabled) return;

    setSavingDisabled(true);

    try {
      const uri = await captureRef(mapRef.current, {
        format: 'jpg',
        quality: 0.9,
      });

      const folderUri = FileSystem.documentDirectory + 'offline_maps/';
      const filename = `map_${Date.now()}.jpg`;
      const destinationUri = folderUri + filename;

      const folderInfo = await FileSystem.getInfoAsync(folderUri);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      }

      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri,
      });

      setSnapshotSaved(true); // show feedback modal
    } catch (err) {
      console.error('Snapshot failed:', err);
      Alert.alert('Error', 'Failed to save map snapshot.');
    }

    setTimeout(() => setSavingDisabled(false), 2000); // re-enable button after 2 seconds
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      filterPolygonsByRegion(newRegion);
    }, 500);
  };

  const getUpdatedRecentSearches = (newSearch: string, existing: string[]): string[] => {
    const updated = [newSearch.trim(), ...existing];
    return [...new Set(updated)].slice(0, 5);
  };


  const goToUserLocation = async () => {
    setIsScreenLoading(true);
    setError('');
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access location was denied.');
      setIsScreenLoading(false);
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
    setIsScreenLoading(false);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);

    setIsScreenLoading(true);
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

        let existing = await AsyncStorage.getItem('recentSearches');
        let updated = getUpdatedRecentSearches(search, existing ? JSON.parse(existing) : []);
        await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);
      } else {
        setMarker(null);
        Alert.alert(
          'No Results',
          'No results found for that search. Try a different location.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setSearch('');
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 200);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch {
      setError('Search failed.');
    }

    setIsScreenLoading(false);
    setSuggestions([]);
  };

  const filterPolygonsByRegion = (region: Region) => {
    const margin = 0.5;
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    const latMin = latitude - latitudeDelta / 2 - margin;
    const latMax = latitude + latitudeDelta / 2 + margin;
    const lonMin = longitude - longitudeDelta / 2 - margin;
    const lonMax = longitude + longitudeDelta / 2 + margin;

    const filtered = parsedStateLandPolygons.filter(polygon =>
      polygon.coords.some(coord =>
        coord.latitude >= latMin &&
        coord.latitude <= latMax &&
        coord.longitude >= lonMin &&
        coord.longitude <= lonMax
      )
    ).slice(0, MAX_POLYGONS
    );
    if (region.latitudeDelta > 1.2 || region.longitudeDelta > 1.2) {
      setVisiblePolygons([]);
      return;
    }

    setVisiblePolygons(filtered);
  };

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('huntPins');
      if (saved) setPins(JSON.parse(saved));

      const recent = await AsyncStorage.getItem('recentSearches');
      if (recent) setRecentSearches(JSON.parse(recent));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setIsScreenLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied.');
        setIsScreenLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const defaultRegion = {
        latitude: 27.9944,
        longitude: -81.7603,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

      setRegion(defaultRegion);
      filterPolygonsByRegion(defaultRegion);
      setIsScreenLoading(false);
    })();
  }, []);

  if (isScreenLoading) {
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
        <View style={{ paddingHorizontal: 18, marginTop: 12, zIndex: 20 }}>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={search}
              onChangeText={(text) => {
                setSearch(text);

                if (text.trim().length === 0) {
                  setSuggestions(recentSearches);
                } else {
                  const filtered = recentSearches.filter((s) =>
                    s.toLowerCase().includes(text.toLowerCase())
                  );
                  setSuggestions(filtered);
                }
              }}
              onFocus={() => {
                if (search.trim() === '') {
                  setSuggestions(recentSearches);
                }
              }}
              onBlur={() => {
                setTimeout(() => setSuggestions([]), 100);
              }}
              placeholder="Search for a place"
              placeholderTextColor="#ccc"
              returnKeyType="search"
              onSubmitEditing={() => {
                handleSearch();
                Keyboard.dismiss();
              }}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={{ color: '#fff' }}>Search</Text>
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && (
            <View style={{
              backgroundColor: '#222',
              borderRadius: 8,
              marginTop: 4,
              elevation: 4
            }}>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSearch(item);
                    setSuggestions([]);
                    handleSearch();
                    Keyboard.dismiss();
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomColor: '#444',
                    borderBottomWidth: i < suggestions.length - 1 ? 1 : 0
                  }}
                >
                  <Text style={{ color: '#fff' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {recentSearches.length > 0 && (
        <View style={{ paddingHorizontal: 18, marginTop: 5 }}>
          <Text style={{ color: '#ccc', marginBottom: 4 }}>Recent Searches:</Text>
          {recentSearches.map((item, i) => (
            <TouchableOpacity key={i} onPress={() => setSearch(item)}>
              <Text style={{ color: '#fff', paddingVertical: 2 }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={async () => {
        await AsyncStorage.removeItem('recentSearches');
        setRecentSearches([]);
      }}>
        <Text style={{ color: '#f66', fontSize: 12 }}>Clear</Text>
      </TouchableOpacity>

      <View style={styles.sidebar}>
        {(['Tree Stand', 'Pin', 'Cam', 'Feeder'] as HuntPin['tag'][]).map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.sidebarButton,
              filterTag === tag && styles.sidebarButtonActive
            ]}
            onPress={() => setFilterTag(filterTag === tag ? null : tag)}
          >
            <Image source={iconMap[tag]} style={styles.sidebarIcon} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.sidebarButton,
            showBoundaries && styles.sidebarButtonActive
          ]}
          onPress={() => setShowBoundaries(prev => !prev)}
        >
          <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
            {showBoundaries ? 'Hide\nBoundaries' : 'Show\nBoundaries'}
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={(e) => {
          if (!filterTag) {
            Alert.alert("No pin type selected", "Please select a pin type from the sidebar before placing a pin.");
            return;
          }

          setPendingCoords(e.nativeEvent.coordinate);
          setPendingTitle('');
          setShowTitleModal(true);
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
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

        {showBoundaries && visiblePolygons.length > 0 &&
          visiblePolygons
            .filter(p => p.coords.length > 2)
            .map(({ id, coords }) => (
              <Polygon
                key={id}
                coordinates={coords}
                strokeColor="orange"
                fillColor="rgba(255,165,0,0.2)"
                strokeWidth={1}
              />
            ))
        }

      </MapView>

      <View style={styles.fabContainer}>
        {fabOpen && (
          <>
            <TouchableOpacity style={styles.fabAction} onPress={() => navigation.navigate('OfflineMaps')}>
              <Text style={styles.fabText}>📁 Saved Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabAction, savingDisabled && { opacity: 0.5 }]}
              onPress={saveMapSnapshot}
              disabled={savingDisabled}
            >
              <Text style={styles.fabText}>💾 Save Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fabAction} onPress={goToUserLocation}>
              <Text style={styles.fabText}>📍 Find Me</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.fabMainButton}
          onPress={() => setFabOpen(prev => !prev)}
        >
          <Text style={styles.fabMainText}>
            {fabOpen ? 'Close Tools' : '⚙️ Map Tools'}
          </Text>
        </TouchableOpacity>
      </View>

      {activePin && (
        <View style={styles.deletePinOverlay}>
          <Text style={styles.deleteText}>Title: {activePin.title}</Text>
          <Text style={styles.deleteText}>Type: {activePin.tag}</Text>

          <Button
            title="Save Title"
            onPress={async () => {
              const updatedPins = pins.map(p =>
                p.id === activePin.id ? { ...p, title: activePin.title } : p
              );
              setPins(updatedPins);
              await AsyncStorage.setItem('huntPins', JSON.stringify(updatedPins));
              setActivePin(null);
            }}
          />

          <Button
            title="Delete Pin"
            color="#ff4444"
            onPress={() => {
              Alert.alert(
                "Delete Pin",
                "Are you sure you want to delete this item?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      const updatedPins = pins.filter(p => p.id !== activePin.id);
                      setPins(updatedPins);
                      await AsyncStorage.setItem('huntPins', JSON.stringify(updatedPins));
                      setActivePin(null);
                    },
                  },
                ]
              );
            }}
          />

          <Button title="Cancel" onPress={() => setActivePin(null)} />
        </View>
      )}

      {showHelpModal && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Map Tips</Text>
          <Text style={{ color: '#fff', marginBottom: 5, }}>
            • Tap and hold the map to place a pin.{'\n'}
            • Select a pin type from the right first (Tree Stand, Cam, etc).{'\n'}
            • You can edit pin titles or delete them by tapping a pin.{'\n'}
            • Use the Find Me" button to center the map on a location.{'\n'}
            • Tap “Save Map” to store the current view for offline use.
          </Text>
          <Button title="Got it" onPress={() => setShowHelpModal(false)} />
        </View>
      )}

      {snapshotSaved && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Map Saved</Text>
          <Text style={{ color: '#fff', marginBottom: 12 }}>
            Map snapshot saved for offline viewing.
          </Text>
          <Button title="View Offline Maps" onPress={() => {
            setSnapshotSaved(false);
            navigation.navigate('OfflineMaps');
          }} />
          <Button title="Close" onPress={() => setSnapshotSaved(false)} />
        </View>
      )}

      {showTitleModal && pendingCoords && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Pin Title</Text>
          <TextInput
            style={{
              backgroundColor: '#222',
              color: '#fff',
              padding: 10,
              borderRadius: 6,
              marginBottom: 12,
            }}
            placeholder={`Optional title for ${filterTag}`}
            placeholderTextColor="#aaa"
            value={pendingTitle}
            onChangeText={setPendingTitle}
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={async () => {
              const count = pins.filter(p => p.tag === filterTag).length + 1;
              const newPin: HuntPin = {
                id: Date.now().toString(),
                title: pendingTitle.trim() || `${filterTag} ${count}`,
                tag: filterTag as HuntPin['tag'],
                latitude: pendingCoords.latitude,
                longitude: pendingCoords.longitude,
              };
              const updatedPins = [...pins, newPin];
              setPins(updatedPins);
              await AsyncStorage.setItem('huntPins', JSON.stringify(updatedPins));

              setShowTitleModal(false);
              setPendingCoords(null);
              setPendingTitle('');
              // Optionally reset filterTag here
            }}
          >
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>

          <Button title="Cancel" onPress={() => {
            setShowTitleModal(false);
            setPendingCoords(null);
            setPendingTitle('');
          }} />
        </View>
      )}

      <TouchableOpacity
        onPress={() => setShowHelpModal(true)}
        style={{
          position: 'absolute',
          bottom: 25,
          left: 15,
          backgroundColor: '#333',
          borderRadius: 20,
          paddingVertical: 8,
          paddingHorizontal: 12,
          zIndex: 10,
        }}
      >
        <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold' }}>?</Text>
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
    paddingHorizontal: 18,
    zIndex: 20,
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
    right: 5,
    top: 120,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
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
    width: 50,
    height: 40,
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

  fabContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'column-reverse',
    alignItems: 'center',
    zIndex: 100,
  },

  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  fabAction: {
    backgroundColor: '#2f95dc',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
  },

  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  fabMainButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },

  fabMainText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});