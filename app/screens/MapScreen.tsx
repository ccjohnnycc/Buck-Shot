import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ImageBackground } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <ImageBackground source={require('../../assets/background_image.png')} style={{flex: 1}}>
        <View style={styles.overlay} />
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      </ImageBackground>
    );
  }
  if (error) {
    return (
      <ImageBackground source={require('../../assets/background_image.png')} style={{flex: 1}}>
        <View style={styles.overlay} />
        <View style={styles.center}>
          <Text style={{color: 'white'}}>{error}</Text>
        </View>
      </ImageBackground>
    );
  }
  if (!region) return null;

  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={{flex: 1}}>
      <View style={styles.overlay} />
      <MapView
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={setRegion}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  }
});