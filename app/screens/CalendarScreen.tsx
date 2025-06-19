import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Button,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';

// Florida season spans
type Season = { start: string; end: string };
const FL_SEASONS: Record<'deer'|'turkey'|'dove', Season[]> = {
  deer: [
    { start: '2025-09-20', end: '2025-10-18' },
    { start: '2025-10-19', end: '2026-01-01' },
    { start: '2026-01-02', end: '2026-01-17' },
  ],
  turkey: [ { start: '2026-03-15', end: '2026-04-18' } ],
  dove: [
    { start: '2025-09-01', end: '2025-10-13' },
    { start: '2025-11-29', end: '2025-12-20' },
  ],
};

// type definitions
type DateData = { dateString: string; day: number; month: number; year: number; timestamp: number };
type MarkedDates = Record<string, { marked?: boolean; selected?: boolean; color?: string; textColor?: string; startingDay?: boolean; endingDay?: boolean }>;
type MyEntry = { name: string; height: number; day: string };
type MySchedule = Record<string, MyEntry[]>;

export default function CalendarScreen() {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const STORAGE_KEY = '@myApp:events';

  // state
  const [items, setItems] = useState<MySchedule>({});
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [selectedAnimal, setSelectedAnimal] = useState<'deer'|'turkey'|'dove'>('deer');
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [newText, setNewText] = useState('');

  // Load/init events
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) setItems(JSON.parse(json)); else initializeEmpty();
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function initializeEmpty() {
    const map: MySchedule = {};
    const base = new Date();
    for (let i=-30; i<=30; i++) {
      const d = new Date(base);
      d.setDate(d.getDate()+i);
      map[d.toISOString().split('T')[0]] = [];
    }
    setItems(map);
  }

  // When user picks a new animal, jump calendar to that season
  useEffect(() => {
    const seasons = FL_SEASONS[selectedAnimal];
    if (seasons.length) {
      const [first] = seasons;
      const [y,m] = first.start.split('-').map(Number);
      setCurrentDate(new Date(y, m-1, 1));
    }
  }, [selectedAnimal]);

  // Add event
  const addEvent = () => {
    if (!newText.trim()) return;
    setItems(prev => ({
      ...prev,
      [selectedDay]: [ ...(prev[selectedDay]||[]), { name:newText.trim(),height:50,day:selectedDay } ],
    }));
    setNewText('');
  };

  // Build markedDates
  const markedDates: MarkedDates = {};
  // events
  Object.entries(items).forEach(([day,evts])=>{ if(evts.length) markedDates[day]={ marked:true }; });
  // selected day
  markedDates[selectedDay] = { ...(markedDates[selectedDay]||{}), selected:true };
  // seasons
  FL_SEASONS[selectedAnimal].forEach(({start,end})=>{
    let d=new Date(start),last=new Date(end);
    while(d<=last) {
      const key=d.toISOString().split('T')[0];
      markedDates[key] = {
        ...(markedDates[key]||{}),
        color:'#a1d99b', textColor:'#000',
        startingDay:key===start, endingDay:key===end
      };
      d.setDate(d.getDate()+1);
    }
  });

  // helpers
  const formatMonthYear = (d:Date) => d.toLocaleString('default',{month:'long',year:'numeric'});
  const currentKey = currentDate.toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Animal filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Hunt:</Text>
          <Picker
            selectedValue={selectedAnimal}
            onValueChange={val=>setSelectedAnimal(val as any)}
            style={styles.picker}
          >
            <Picker.Item label="Deer" value="deer" />
            <Picker.Item label="Turkey" value="turkey" />
            <Picker.Item label="Dove" value="dove" />
          </Picker>
        </View>

        {/* Month header */}
        <Text style={styles.headerText}>{formatMonthYear(currentDate)}</Text>

        {/* Calendar */}
        <Calendar
          current={currentKey}
          onDayPress={({dateString}:DateData)=>setSelectedDay(dateString)}
          onMonthChange={({year,month})=>setCurrentDate(new Date(year,month-1,1))}
          markedDates={markedDates}
          markingType="period"
          theme={{ arrowColor:'#0066cc', todayTextColor:'#cc0000', selectedDayBackgroundColor:'#0066cc', selectedDayTextColor:'#fff' }}
        />

        {/* Add event */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="New event"
            value={newText}
            onChangeText={setNewText}
          />
          <Button title="Add" onPress={addEvent} />
        </View>

        {/* Event list */}
        <FlatList
          data={items[selectedDay]}
          keyExtractor={(_,i)=>String(i)}
          ListEmptyComponent={<Text style={styles.empty}>No events</Text>}
          renderItem={({item})=>(
            <View style={styles.eventItem}><Text style={styles.eventText}>{item.name}</Text></View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, paddingTop: Platform.OS==='android'?StatusBar.currentHeight:0 },
  container: { flex:1, padding:10 },
  filterContainer: { flexDirection:'row',alignItems:'center',marginBottom:8 },
  filterLabel: { fontSize:16,marginRight:8 },
  picker: { flex:1 },
  headerText: { fontSize:20,fontWeight:'600',textAlign:'center',marginVertical:8 },
  addRow: { flexDirection:'row',marginVertical:8 },
  input: { flex:1,borderColor:'#888',borderWidth:1,borderRadius:4,paddingHorizontal:8,marginRight:8 },
  eventItem: { padding:12,marginVertical:4,backgroundColor:'#fafafa',borderLeftWidth:4,borderLeftColor:'#0066cc',borderRadius:6,elevation:2 },
  eventText: { fontSize:16,color:'#333' },
  empty: { textAlign:'center',marginTop:8 },
});
