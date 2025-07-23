import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Map weather codes to labels, emojis, and gradients (tuple for TS)
const weatherCodeMap: Record<number, { label: string; emoji: string; gradient: [string, string] }> = {
  0: { label: 'Clear ', emoji: '☀️', gradient: ['#6190E8', '#A7BFE8'] },
  1: { label: 'Mostly Clear ', emoji: '🌤️', gradient: ['#6190E8', '#A7BFE8'] },
  2: { label: 'Partly Cloudy ', emoji: '⛅', gradient: ['#6190E8', '#A7BFE8'] },
  3: { label: 'Overcast ', emoji: '☁️', gradient: ['#6190E8', '#A7BFE8'] },
  45: { label: 'Fog ', emoji: '🌫️', gradient: ['#3E5151', '#DECBA4'] },
  48: { label: 'Rime Fog ', emoji: '🌫️', gradient: ['#616161', '#9BC5C3'] },
  51: { label: 'Light Drizzle ', emoji: '🌦️', gradient: ['#4DA0B0', '#D39D38'] },
  53: { label: 'Drizzle ', emoji: '🌦️', gradient: ['#3A7BD5', '#3A6073'] },
  55: { label: 'Dense Drizzle ', emoji: '🌧️', gradient: ['#2C3E50', '#4CA1AF'] },
  61: { label: 'Rain ', emoji: '🌧️', gradient: ['#00C6FB', '#005BEA'] },
  63: { label: 'Moderate Rain ', emoji: '🌧️', gradient: ['#005BEA', '#00C6FB'] },
  65: { label: 'Heavy Rain ', emoji: '🌧️', gradient: ['#000046', '#1CB5E0'] },
  71: { label: 'Light Snow ', emoji: '🌨️', gradient: ['#83A4D4', '#B6FBFF'] },
  73: { label: 'Snow ', emoji: '❄️', gradient: ['#2980B9', '#6DD5FA'] },
  75: { label: 'Heavy Snow ', emoji: '❄️', gradient: ['#000428', '#004E92'] },
  80: { label: 'Showers ', emoji: '🌦️', gradient: ['#373B44', '#4286F4'] },
  95: { label: 'Thunderstorm ', emoji: '⛈️', gradient: ['#0F2027', '#203A43'] },
};

type WeatherData = {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

function degToCompass(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

export default function WeatherScreen() {
  const navigation = useNavigation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // compute local date & hour keys
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60000; // in ms
  const localDateKey = new Date(now.getTime() - localOffset).toISOString().split('T')[0];

  function getFilteredDailyTime(apiDates: string[]): string[] {
    const todayIndex = apiDates.findIndex(d => d === localDateKey);
    return todayIndex >= 0 ? apiDates.slice(todayIndex) : apiDates;
  }



  const localHourKey = `${localDateKey}T${String(now.getHours()).padStart(2, '0')}:00`;

  // selected day state, initial to today
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(localDateKey);

  // reset to today when screen focused
  useFocusEffect(
    useCallback(() => {
      setSelectedDailyDate(localDateKey);
    }, [localDateKey])
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Location permission denied');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}` +
          `&current_weather=true&hourly=temperature_2m,precipitation_probability` +
          `&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(tz)}` +
          `&temperature_unit=fahrenheit&precipitation_unit=inch`;
        const res = await fetch(url);
        const data = await res.json();
        setWeather(data);
        const filteredTime = getFilteredDailyTime(data.daily.time);
        setSelectedDailyDate(filteredTime[0]);
        console.log('Local date:', localDateKey);
        console.log('API daily time:', data.daily.time);

      } catch {
        setError('Could not fetch weather');
      }
      setLoading(false);

    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFD700" />;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error} </Text></View>;
  if (!weather) return null;

  const { current_weather: cw, hourly, daily } = weather;
  const wc = weatherCodeMap[cw.weathercode] || weatherCodeMap[0];

  // find index for selectedDailyDate
  const filteredDailyTime = getFilteredDailyTime(daily.time);


  const validDailyIndex = filteredDailyTime.indexOf(selectedDailyDate);


  // hourlyIndices for date
  const dayIndices = hourly.time
    .map((t, i) => t.startsWith(selectedDailyDate) ? i : -1)
    .filter(i => i >= 0);
  let startPos = 0;
  if (selectedDailyDate === localDateKey) {
    const pos = dayIndices.indexOf(hourly.time.indexOf(localHourKey));
    startPos = pos >= 0 ? pos : 0;
  }
  const hourlyIndices = dayIndices.slice(startPos, startPos + 12);

  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={styles.background}>
      <LinearGradient colors={wc.gradient} style={styles.overlay} start={[0, 0]} end={[1, 1]} />
      <View style={styles.container}>

        {/* Current Weather Card */}
        <View style={styles.currentCard} >
          <Text style={styles.emoji}>{wc.emoji} </Text>
          <Text style={styles.temp}>{Math.round(cw.temperature)}°F </Text>
          <Text style={styles.desc}>{wc.label} </Text>
          <Text style={styles.detail} >
            High {Math.round(weather.daily.temperature_2m_max[validDailyIndex])}° / Low {Math.round(weather.daily.temperature_2m_min[validDailyIndex])}° </Text>
          <Text style={styles.wind}> 💨 {cw.windspeed} mph  {degToCompass(cw.winddirection)} </Text>
        </View>

        {/* Hourly */}
        <FlatList
          data={hourlyIndices}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyList}
          keyExtractor={i => String(i)}
          renderItem={({ item: i }) => {
            const hr = new Date(hourly.time[i]).getHours();
            return (
              <View style={styles.hourItem}>
                <Text style={styles.hourText}>{hr}:00 </Text>
                <Text style={styles.hourEmoji}>{wc.emoji} </Text>
                <Text style={styles.hourTemp}>{Math.round(hourly.temperature_2m[i])}° </Text>
                <Text style={styles.hourDetail}>{hourly.precipitation_probability[i]}% </Text>
              </View>
            );
          }}
        />

        {/* Daily */}
        <FlatList
          data={filteredDailyTime} horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dailyList}
          keyExtractor={d => d}
          renderItem={({ item: dateStr }) => {
            const idx = daily.time.indexOf(dateStr);
            const [year, month, day] = dateStr.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            const dayLabel = localDate.toLocaleDateString('en-US', { weekday: 'short' });

            const isSel = dateStr === selectedDailyDate;
            return (
              <TouchableOpacity onPress={() => setSelectedDailyDate(dateStr)} >
                <View style={[styles.dailyItem, isSel && styles.dailySelected]} >
                  <Text style={styles.dayText}>{dayLabel} </Text>
                  <Text style={styles.dailyTemp}>{Math.round(daily.temperature_2m_max[idx])}° </Text>
                  <Text style={styles.dailyMin}>{Math.round(daily.temperature_2m_min[idx])}° </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  container: { flex: 1, paddingTop: 50, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red' },
  currentCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 24, width: width * 0.9, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emoji: { fontSize: 64, marginBottom: 12 },
  temp: { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  desc: { fontSize: 24, color: '#fff', marginVertical: 4 },
  detail: { fontSize: 16, color: '#fff' },
  wind: { fontSize: 16, color: '#fff', marginTop: 4 },
  hourlyList: { paddingHorizontal: 10 },
  hourItem: { alignItems: 'center', marginRight: 12 },
  hourText: { color: '#fff' },
  hourEmoji: { fontSize: 24 },
  hourTemp: { color: '#fff', fontWeight: '600' },
  hourDetail: { color: '#fff', fontSize: 12 },
  dailyList: { paddingHorizontal: 10, marginTop: 20 },
  dailyItem: { alignItems: 'center', marginRight: 16, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  dailySelected: { borderColor: '#FFD700', borderWidth: 2 },
  dayText: { color: '#fff', marginBottom: 4 },
  dailyTemp: { color: '#FFD700', fontWeight: 'bold' },
  dailyMin: { color: '#fff' },
});
