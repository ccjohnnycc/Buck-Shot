import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../services/firebaseconfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Gallery'>;

export default function DeerHarvestLogScreen() {
    const [antlered, setAntlered] = useState(true);
    const [harvestDate, setHarvestDate] = useState(new Date());
    const [sex, setSex] = useState<'Male' | 'Female'>('Male');
    const [antlerPoints, setAntlerPoints] = useState('');
    const [tagNumber, setTagNumber] = useState('');
    const [countyOrWMA, setCountyOrWMA] = useState('');
    const [confirmationNumber, setConfirmationNumber] = useState('');
    const navigation = useNavigation<NavProp>();
    const [showPicker, setShowPicker] = useState(false);

    const handleSubmit = async () => {
        const auth = getAuth(app);
        const db = getFirestore(app);
        const user = auth.currentUser;

        if (!user) return Alert.alert("Not logged in");

        const data = {
            species: 'Deer',
            antlered,
            sex,
            harvestDate: harvestDate.toISOString(),
            antlerPoints: antlered ? Number(antlerPoints) : null,
            tagNumber: tagNumber || null,
            countyOrWMA,
            confirmationNumber,
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, `users/${user.uid}/harvestReports`), data);
            Alert.alert("Saved", "Deer harvest log saved.");
            setAntlerPoints('');
            setTagNumber('');
            setCountyOrWMA('');
            setConfirmationNumber('');
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not save report.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.container, { minHeight: '100%' }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.label}>Antlered or Antlerless?</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setAntlered(true)} style={[styles.option, antlered && styles.selected]}>
                            <Text>Antlered </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAntlered(false)} style={[styles.option, !antlered && styles.selected]}>
                            <Text>Antlerless </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Sex: </Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setSex('Male')} style={[styles.option, sex === 'Male' && styles.selected]}>
                            <Text>Male </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSex('Female')} style={[styles.option, sex === 'Female' && styles.selected]}>
                            <Text>Female </Text>
                        </TouchableOpacity>
                    </View>

                    {antlered && (
                        <>
                            <Text style={styles.label}>Number of Antler Points: </Text>
                            <TextInput
                                value={antlerPoints}
                                onChangeText={setAntlerPoints}
                                style={styles.input}
                                keyboardType="number-pad"
                            />
                        </>
                    )}
                    <Text style={styles.label}>Harvest Date: </Text>
                    <Pressable onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
                        <Text>{harvestDate.toDateString()} </Text>
                    </Pressable>

                    {showPicker && (
                        <DateTimePicker
                            value={harvestDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(e, selectedDate) => {
                                setShowPicker(false);
                                if (selectedDate) setHarvestDate(selectedDate);
                            }}
                        />
                    )}
                    <Text style={styles.label}>County or WMA: </Text>
                    <TextInput value={countyOrWMA} onChangeText={setCountyOrWMA} style={styles.input} />

                    <Text style={styles.label}>Tag Number (optional): </Text>
                    <TextInput value={tagNumber} onChangeText={setTagNumber} style={styles.input} />

                    <Text style={styles.label}>Confirmation # (if already reported): </Text>
                    <TextInput value={confirmationNumber} onChangeText={setConfirmationNumber} style={styles.input} />

                    <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Deer Report </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 20, paddingTop: 60, flexGrow: 1 },
    label: { fontWeight: 'bold', marginTop: 12 },
    input: { borderWidth: 1, padding: 8, borderRadius: 6, marginTop: 4 },
    row: { flexDirection: 'row', marginTop: 8 },
    option: {
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 6,
        marginRight: 10,
    },
    selected: {
        backgroundColor: '#FFD700',
    },
    submit: {
        marginTop: 24,
        backgroundColor: '#2f95dc',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 30,
        left: 10,
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        zIndex: 10,
    },
});