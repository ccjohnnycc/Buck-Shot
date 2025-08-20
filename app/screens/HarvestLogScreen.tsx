import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Pressable, ImageBackground
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../services/firebaseconfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type DeerHarvestRoute = RouteProp<RootStackParamList, 'DeerHarvestLog'>;

export default function DeerHarvestLogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<DeerHarvestRoute>();
  const harvestId = params?.harvestId;

  const [antlered, setAntlered] = useState(true);
  const [harvestDate, setHarvestDate] = useState(new Date());
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [antlerPoints, setAntlerPoints] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [countyOrWMA, setCountyOrWMA] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(!!harvestId);

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Load existing doc if editing
  useEffect(() => {
    if (!harvestId) return;
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const ref = doc(db, `users/${user.uid}/harvestReports`, harvestId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d: any = snap.data();
          setAntlered(Boolean(d.antlered));
          setSex(d.sex === 'Female' ? 'Female' : 'Male');
          setAntlerPoints(d.antlerPoints != null ? String(d.antlerPoints) : '');
          setTagNumber(d.tagNumber ?? '');
          setCountyOrWMA(d.countyOrWMA ?? '');
          setConfirmationNumber(d.confirmationNumber ?? '');
          // harvestDate might be ISO string or Firestore Timestamp
          if (d.harvestDate?.toDate) setHarvestDate(d.harvestDate.toDate());
          else if (typeof d.harvestDate === 'string') setHarvestDate(new Date(d.harvestDate));
        }
      } catch (e) {
        console.error('Failed to load harvest', e);
        Alert.alert('Error', 'Could not load harvest.');
      } finally {
        setLoading(false);
      }
    })();
  }, [harvestId]);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Not logged in');

    const payload = {
      species: 'Deer',
      antlered,
      sex,
      harvestDate: harvestDate.toISOString(),
      antlerPoints: antlered && antlerPoints ? Number(antlerPoints) : null,
      tagNumber: tagNumber || null,
      countyOrWMA,
      confirmationNumber,
      timestamp: serverTimestamp(),
    };

    try {
      if (harvestId) {
        await setDoc(doc(db, `users/${user.uid}/harvestReports`, harvestId), payload, { merge: true });
        Alert.alert('Updated', 'Harvest log updated.', [
          { text: 'OK', onPress: () => navigation.replace('HarvestList') },
        ]);
      } else {
        await addDoc(collection(db, `users/${user.uid}/harvestReports`), payload);
        Alert.alert('Saved', 'Deer harvest log saved.', [
          { text: 'OK', onPress: () => navigation.replace('HarvestList') },
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save report.');
    }
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user || !harvestId) return;
    Alert.alert('Delete Harvest', 'Are you sure you want to delete this harvest?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/harvestReports`, harvestId));
            Alert.alert('Deleted', 'Harvest removed.', [
              { text: 'OK', onPress: () => navigation.replace('HarvestList') },
            ]);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <ImageBackground source={require('../../assets/background_image.png')} style={{ flex: 1 }}>
      <View style={styles.overlay} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.container, { minHeight: '100%' }]}>
          <Text style={styles.title}>{harvestId ? 'Edit Harvest' : 'New Harvest'} </Text>

          {/* Antlered/Antlerless */}
          <Text style={styles.label}>Antlered or Antlerless? </Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setAntlered(true)} style={[styles.option, antlered && styles.selected]}>
              <Text style={styles.optionText}>Antlered </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAntlered(false)} style={[styles.option, !antlered && styles.selected]}>
              <Text style={styles.optionText}>Antlerless </Text>
            </TouchableOpacity>
          </View>

          {/* Sex */}
          <Text style={styles.label}>Sex: </Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => setSex('Male')} style={[styles.option, sex === 'Male' && styles.selected]}>
              <Text style={styles.optionText}>Male </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSex('Female')} style={[styles.option, sex === 'Female' && styles.selected]}>
              <Text style={styles.optionText}>Female </Text>
            </TouchableOpacity>
          </View>

          {/* Antler points if antlered */}
          {antlered && (
            <>
              <Text style={styles.label}>Number of Antler Points: </Text>
              <TextInput
                value={antlerPoints}
                onChangeText={setAntlerPoints}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="e.g. 8"
                placeholderTextColor="#aaa"
              />
            </>
          )}

          {/* Date */}
          <Text style={styles.label}>Harvest Date: </Text>
          <Pressable onPress={() => setShowPicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
            <Text style={{ color: '#fff' }}>{harvestDate.toDateString()}</Text>
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

          {/* County/WMA */}
          <Text style={styles.label}>County or WMA: </Text>
          <TextInput
            value={countyOrWMA}
            onChangeText={setCountyOrWMA}
            style={styles.input}
            placeholder="e.g. Osceola"
            placeholderTextColor="#aaa"
          />

          {/* Tag + Confirmation */}
          <Text style={styles.label}>Tag Number (optional): </Text>
          <TextInput
            value={tagNumber}
            onChangeText={setTagNumber}
            style={styles.input}
            placeholder="Tag #"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Confirmation # (if already reported): </Text>
          <TextInput
            value={confirmationNumber}
            onChangeText={setConfirmationNumber}
            style={styles.input}
            placeholder="Confirmation #"
            placeholderTextColor="#aaa"
          />

          {/* Save / Update */}
          <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={loading}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>
              {harvestId ? 'Update Harvest' : 'Save Deer Report'}
            </Text>
          </TouchableOpacity>

          {/* Delete if editing */}
          {harvestId ? (
            <TouchableOpacity
              style={[styles.submit, { backgroundColor: '#ff4444', marginTop: 12 }]}
              onPress={handleDelete}
              disabled={loading}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete Harvest </Text>
            </TouchableOpacity>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  container: { padding: 20, paddingTop: 70 },
  title: { fontSize: 24, color: '#FFD700', fontWeight: 'bold', marginBottom: 14, textAlign: 'center' },
  label: { color: '#fff', fontWeight: 'bold', marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#555', padding: 10, borderRadius: 8, marginTop: 6, color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  row: { flexDirection: 'row', marginTop: 8 },
  option: {
    paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#444', borderRadius: 8, marginRight: 10,
  },
  optionText: { color: '#fff' },
  selected: { backgroundColor: '#FFD700' },
  submit: {
    marginTop: 20, backgroundColor: '#FFD700', padding: 14, borderRadius: 10, alignItems: 'center',
  },
  backButton: {
    position: 'absolute', top: 30, left: 10, paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 20, zIndex: 10,
  },
});
