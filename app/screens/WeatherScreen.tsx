import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ImageBackground } from 'react-native';
import * as Location from 'expo-location';


const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
};

type WeatherData = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    is_day?: number;
    precipitation?: number;
    relative_humidity_2m?: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    rain: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    wind_direction_10m: number[];
    cloud_cover: number[];
    relative_humidity_2m: number[];
  };
   daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
   };
};

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getWeather = async () => {
    setLoading(true);
    setError('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location denied');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const url ='https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=-81.3392&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=temperature_2m,apparent_temperature,precipitation_probability,rain,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,relative_humidity_2m&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day,precipitation,relative_humidity_2m&timezone=auto&wind_speed_unit=kn&temperature_unit=fahrenheit&precipitation_unit=inch';

      const response = await fetch(url);
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError('Could not fetch weather');
    }
    setLoading(false);
  };

  useEffect(() => {
    getWeather();
  }, []);

  const getWeatherDesc = (code?: number) => {
    if (code == null) return { label: 'Unknown', icon: '❔' };
    return weatherCodeMap[code] || { label: 'Unknown', icon: '❔' };
  };

  const current = weather?.current || {};
  const { label, icon } = getWeatherDesc(current.weather_code);

  // For hourly data, get nearest hour
  const getCurrentHourIndex = () => {
    if (!weather || !weather.hourly) return 0;
    const now = new Date();
    const hours = weather.hourly.time;
    return hours.findIndex(h => h.startsWith(now.toISOString().slice(0, 13))) || 0;
  };
  const hourIdx = getCurrentHourIndex();
  const hourly = weather?.hourly;

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        {loading && <ActivityIndicator size="large" />}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* Current Weather */}
        {weather && weather.current && (
          <View style={styles.card}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.temp}>{Math.round(current.temperature_2m ?? 0)}°F</Text>
            <Text style={styles.feels}>Feels like {Math.round(current.apparent_temperature ?? 0)}°F</Text>
            <Text style={styles.desc}>{label}</Text>

            {weather?.daily && (
              <Text style={styles.details}>
                High: {Math.round(weather.daily.temperature_2m_max?.[0] ?? 0)}°F | Low: {Math.round(weather.daily.temperature_2m_min?.[0] ?? 0)}°F
              </Text>
            )}

            {weather?.daily && (
              <Text style={styles.details}>
                Sunrise: {weather.daily.sunrise?.[0]?.slice(11, 16)} | Sunset: {weather.daily.sunset?.[0]?.slice(11, 16)}
              </Text>
            )}

            <Text style={styles.details}>
              Wind: {current.wind_speed_10m} knots {current.wind_direction_10m !== undefined ? `(${current.wind_direction_10m}°)` : ''}
            </Text>
            <Text style={styles.details}>
              Gusts: {current.wind_gusts_10m} knots
            </Text>
            <Text style={styles.details}>
              Precipitation: {current.precipitation ?? 0} in
            </Text>
            <Text style={styles.details}>
              Humidity: {current.relative_humidity_2m ?? '--'}%
            </Text>
          </View>
        )}

        { }
        {hourly && (
          <View style={styles.hourlyCard}>
            <Text style={styles.hourlyTitle}>Next Hour</Text>
            <Text style={styles.details}>
              Chance of rain: {hourly.precipitation_probability?.[hourIdx] ?? 0}%
            </Text>
            <Text style={styles.details}>
              Humidity: {hourly.relative_humidity_2m?.[hourIdx] ?? 0}%
            </Text>
            <Text style={styles.details}>
              Clouds: {hourly.cloud_cover?.[hourIdx] ?? 0}%
            </Text>
            <Text style={styles.details}>
              Temp: {Math.round(hourly.temperature_2m?.[hourIdx] ?? 0)}°F
            </Text>
            <Text style={styles.details}>
              Rain: {hourly.rain?.[hourIdx] ?? 0} in
            </Text>
          </View>
        )}

        <Button title="Refresh" onPress={getWeather} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: 'rgba(30,30,30,0.8)',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 24,
    width: 320,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
  },
  hourlyCard: {
    backgroundColor: 'rgba(30,30,30,0.7)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'flex-start',
    marginBottom: 22,
    width: 320,
    maxWidth: '100%',
  },
  icon: {
    fontSize: 64,
    marginBottom: 12,
  },
  temp: {
    fontSize: 38,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  feels: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 2,
  },
  desc: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 12,
  },
  details: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  hourlyTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  error: { color: 'red', marginBottom: 10 },
});