import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    Button,
    SafeAreaView
} from 'react-native';
import { Calendar } from 'react-native-calendars';

// 1) Re-declare the shape of the day object
type DateData = {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
};

// 2) Define a MarkedDates map whose values allow both flags
type MarkedDates = {
    [date: string]: {
        marked?: boolean;
        selected?: boolean;
    };
};

type MyEntry = { name: string; height: number; day: string };
type MySchedule = Record<string, MyEntry[]>;

export default function CalendarScreen() {
    // --- state ---
    const today = new Date().toISOString().split('T')[0];
    const [items, setItems] = useState<MySchedule>({});
    const [selectedDay, setSelectedDay] = useState<string>(today);
    const [newText, setNewText] = useState('');

    // --- initialize ±30 days so that every key exists once ---
    useEffect(() => {
        const map: MySchedule = {};
        const base = new Date();
        for (let i = -30; i <= 30; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() + i);
            map[d.toISOString().split('T')[0]] = [];
        }
        setItems(map);
    }, []);

    // --- add a new event ---
    const addEvent = () => {
        if (!newText.trim()) return;
        setItems(prev => ({
            ...prev,
            [selectedDay]: [
                ...(prev[selectedDay] || []),
                { name: newText.trim(), height: 50, day: selectedDay },
            ],
        }));
        setNewText('');
    };

    // --- build the markedDates object ---
    const markedDates: MarkedDates = {};
    Object.entries(items).forEach(([day, evts]) => {
        if (evts.length) {
            markedDates[day] = { marked: true };
        }
    });
    // highlight the selected day (even if no events)
    markedDates[selectedDay] = {
        ...(markedDates[selectedDay] || {}),
        selected: true,
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 10 }}>
                <Calendar
                    style={{ marginTop: 32 }}
                    current={today}
                    onDayPress={(day: DateData) => setSelectedDay(day.dateString)}
                    markedDates={markedDates}
                />

                <View style={{ flexDirection: 'row', marginVertical: 8 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="New event"
                        value={newText}
                        onChangeText={setNewText}
                    />
                    <Button title="Add" onPress={addEvent} />
                </View>

                <FlatList
                    data={items[selectedDay]}
                    keyExtractor={(_, i) => String(i)}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center' }}>No events</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.eventItem}>
                            <Text>{item.name}</Text>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    input: {
        flex: 1,
        borderColor: '#888',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
    },
    eventItem: {
        padding: 12,
        marginVertical: 4,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
    },
});
