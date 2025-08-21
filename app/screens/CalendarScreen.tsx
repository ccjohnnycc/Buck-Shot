import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Platform,
  StatusBar,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import SunCalc from 'suncalc';
import { auth } from '../services/firebaseconfig';

// Florida season spans
type Season = { start: string; end: string };
const FL_SEASONS: Record<'deer' | 'turkey' | 'dove', Season[]> = {
  deer: [
    { start: '2025-09-20', end: '2025-10-18' },
    { start: '2025-10-19', end: '2026-01-01' },
    { start: '2026-01-02', end: '2026-01-17' },
  ],
  turkey: [{ start: '2026-03-15', end: '2026-04-18' }],
  dove: [
    { start: '2025-09-01', end: '2025-10-13' },
    { start: '2025-11-29', end: '2025-12-20' },
  ],
};

// Map numeric phase [0-1) to name
const getPhaseName = (p: number) => {
  if (p < 0.03 || p > 0.97) return 'New Moon 🌑';
  if (p < 0.25) return 'Waxing Crescent 🌒';
  if (p < 0.27) return 'First Quarter 🌓';
  if (p < 0.47) return 'Waxing Gibbous 🌔';
  if (p < 0.53) return 'Full Moon 🌕';
  if (p < 0.73) return 'Waning Gibbous 🌖';
  if (p < 0.77) return 'Last Quarter 🌗';
  return 'Waning Crescent 🌘';
};

type MarkedDates = Record<
  string,
  {
    marked?: boolean;
    selected?: boolean;
    color?: string;
    textColor?: string;
    startingDay?: boolean;
    endingDay?: boolean;
  }
>;
type MyEntry = { name: string; height: number; day: string; hour: number };
type MySchedule = Record<string, MyEntry[]>;

export default function CalendarScreen() {
  const user = auth.currentUser;
  if (!user) return null;

  // SunCalc location (Central FL approx)
  const LAT = 28.5383,
    LON = -81.3792;

  // Per-user local storage key
  const STORAGE_KEY = `@myApp:events_${user.uid}`;
  const todayKey = new Date().toISOString().split('T')[0];

  // state
  const [items, setItems] = useState<MySchedule>({});
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [selectedAnimal, setSelectedAnimal] = useState<'deer' | 'turkey' | 'dove'>('deer');
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Moon & feeding info
  const [moonPhase, setMoonPhase] = useState<string>('');
  const [illumination, setIllumination] = useState<number>(0);
  const [feedAM, setFeedAM] = useState<[string, string]>(['', '']);
  const [feedPM, setFeedPM] = useState<[string, string]>(['', '']);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalHour, setModalHour] = useState<number | null>(null);
  const [modalText, setModalText] = useState('');

  // Init: load or seed a +/-30 day window
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) setItems(JSON.parse(json));
      else initializeEmpty();
    });
  }, [user?.uid]);

  // Persist changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function initializeEmpty() {
    const map: MySchedule = {};
    const base = new Date();
    for (let i = -30; i <= 30; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      map[d.toISOString().split('T')[0]] = [];
    }
    setItems(map);
  }

  // When animal changes, jump to first month of that season
  useEffect(() => {
    const seasons = FL_SEASONS[selectedAnimal];
    if (seasons.length) {
      const [first] = seasons;
      const [y, m] = first.start.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, 1));
    }
  }, [selectedAnimal]);

  // Recompute moon/feeding for selected day
  useEffect(() => {
    const d = new Date(selectedDay + 'T12:00:00');
    const illum = SunCalc.getMoonIllumination(d);
    setIllumination(illum.fraction);
    setMoonPhase(getPhaseName(illum.phase));
    const { sunrise, sunset } = SunCalc.getTimes(d, LAT, LON);
    const fmt = (date: Date) =>
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeedAM([fmt(new Date(sunrise.getTime() - 3600000)), fmt(sunrise)]);
    setFeedPM([fmt(sunset), fmt(new Date(sunset.getTime() + 3600000))]);
  }, [selectedDay]);

  // Add event at specific hour
  function addEventAtHour(hour: number, name: string) {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to set reminders.');
      return;
    }
    Keyboard.dismiss();
    setItems((prev) => ({
      ...prev,
      [selectedDay]: [
        ...(prev[selectedDay] || []),
        { name, height: 50, day: selectedDay, hour },
      ],
    }));
  }

  // Build markedDates: (1) seasons, (2) user dots, (3) selected day
  const markedDates: MarkedDates = {};
  FL_SEASONS[selectedAnimal].forEach(({ start, end }) => {
    let d = new Date(start),
      last = new Date(end);
    while (d <= last) {
      const key = d.toISOString().split('T')[0];
      markedDates[key] = {
        ...(markedDates[key] || {}),
        color: '#a1d99b',
        textColor: '#000',
        startingDay: key === start,
        endingDay: key === end,
      };
      d.setDate(d.getDate() + 1);
    }
  });
  Object.entries(items).forEach(([day, evts]) => {
    if (evts.length) {
      markedDates[day] = {
        ...(markedDates[day] || {}),
        marked: true,
      };
    }
  });
  markedDates[selectedDay] = {
    ...(markedDates[selectedDay] || {}),
    selected: true,
  };

  const currentKey = currentDate.toISOString().split('T')[0];

  return (
    <ImageBackground
      source={require('../../assets/background_image.png')}
      style={styles.background}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Animal filter */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Hunt: </Text>
            <Picker
              selectedValue={selectedAnimal}
              onValueChange={(val) => setSelectedAnimal(val as any)}
              style={styles.picker}
              itemStyle={{ color: '#FFD700' }}
              dropdownIconColor="#FFD700"
            >
              <Picker.Item label="Deer" value="deer" />
              <Picker.Item label="Turkey" value="turkey" />
              <Picker.Item label="Dove" value="dove" />
            </Picker>
          </View>

          {/* Calendar */}
          <Calendar
            current={currentKey}
            onDayPress={({ dateString }) => setSelectedDay(dateString)}
            onMonthChange={({ year, month }) => setCurrentDate(new Date(year, month - 1, 1))}
            markingType="period"
            markedDates={markedDates}
            theme={{
              calendarBackground: 'transparent',
              monthTextColor: '#FFD700',
              arrowColor: '#FFD700',
              textSectionTitleColor: '#FFD700',
              dayTextColor: '#fff',
              todayTextColor: '#FFD700',
              selectedDayBackgroundColor: '#FFD700',
              selectedDayTextColor: '#000',
            }}
          />

          {/* Hourly list w/ quick-add modal */}
          <ScrollView style={{ maxHeight: 240, marginVertical: 12 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <TouchableOpacity
                key={h}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,215,0,0.3)',
                }}
                onPress={() => {
                  setModalHour(h);
                  setModalText(' ');
                  setModalVisible(true);
                }}
              >
                <Text style={{ width: 60, color: '#FFD700', fontWeight: '600' }}>
                  {String(h).padStart(2, '0')}:00
                </Text>
                {(items[selectedDay] || [])
                  .filter((e) => e.hour === h)
                  .map((e, i) => (
                    <Text key={i} style={{ marginLeft: 8, color: '#fff' }}>
                      {e.name}
                    </Text>
                  ))}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Add event at {String(modalHour).padStart(2, '0')}:00
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Event description"
                  placeholderTextColor="#999"
                  value={modalText}
                  onChangeText={setModalText}
                />
                <View style={styles.modalButtons}>
                  <Button title="Cancel" onPress={() => setModalVisible(false)} />
                  <Button
                    title="Save"
                    onPress={() => {
                      if (modalHour !== null && modalText.trim()) {
                        addEventAtHour(modalHour, modalText.trim());
                      }
                      setModalVisible(false);
                    }}
                    color="#FFD700"
                  />
                </View>
              </View>
            </View>
          </Modal>

          {/* Moon & feeding info */}
          <View style={styles.moonInfo}>
            <Text style={styles.moonText}>Phase: {moonPhase}</Text>
            <Text style={styles.moonText}>
              Illumination: {(illumination * 100).toFixed(0)}%
            </Text>
            <Text style={styles.moonText}>
              AM Feeding: {feedAM[0]}–{feedAM[1]}
            </Text>
            <Text style={styles.moonText}>
              PM Feeding: {feedPM[0]}–{feedPM[1]}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: {
    flex: 1,
    marginTop: -55,
    marginBottom: -10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    margin: 8,
    borderRadius: 12,
  },
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontSize: 18, color: '#fff', marginRight: 8 },
  picker: { flex: 1, color: '#fff' },
  moonInfo: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    marginTop: 12,
  },
  moonText: { fontSize: 14, color: '#fff', marginBottom: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '80%', backgroundColor: '#222', padding: 20, borderRadius: 8 },
  modalTitle: { fontSize: 18, color: '#fff', marginBottom: 12, textAlign: 'center' },
  modalInput: { backgroundColor: '#333', color: '#fff', borderRadius: 4, padding: 8, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
});