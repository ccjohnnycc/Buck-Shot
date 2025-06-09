import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Button,
  Alert,
  Image,
  Modal,
  Switch,
  findNodeHandle,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { convertPixelsToInches } from '../utils/measurement';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import type { CameraView as CameraViewRef } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import InstructionBanner from '../components/InstructionBanner';
import DraggableCrosshair from '../components/DraggableCrosshair';
import * as Location from 'expo-location';
import { auth } from '../services/firebaseConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARKER_SIZE = 40;

// You’ll need to tweak these two constants to exactly match your UI’s sizes:
//InstructionBanner
const TOP_UI_HEIGHT = 56; 
//the slider + buttons at bottom
const BOTTOM_UI_HEIGHT = 250;  

export default function MeasureScreen({ navigation }: any) {
  const [hasSaved, setHasSaved] = useState(false);
  const [cameraSize, setCameraSize] = useState({ width: 0, height: 0 });

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [distanceFromCamera, setDistanceFromCamera] = useState(36);
  const cameraRef = useRef<CameraViewRef | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<{ pixelsPerInch: number; calibrationDistance: number } | null>(null);
  const isFocused = useIsFocused();
  const [marker1, setMarker1] = useState<{ x: number; y: number } | null>(null);
  const [marker2, setMarker2] = useState<{ x: number; y: number } | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [saveRaw, setSaveRaw] = useState(true);
  const [saveUX, setSaveUX] = useState(false);
  const [saveJournal, setSaveJournal] = useState(false);
  const containerRef = useRef<View>(null);

  // When screen regains focus, clear everything if there was a previous photo/markers
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (capturedUri || marker1 || marker2 || hasSaved) {
        clearAll();
      }
    });
    return unsubscribe;
  }, [navigation, capturedUri, marker1, marker2, hasSaved]);

  // Load calibration or force user to calibrate
  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      const data = await AsyncStorage.getItem('calibration');
      if (data) setCalibration(JSON.parse(data));
      else {
        Alert.alert(
          'Calibration Required',
          'Please calibrate before measuring.',
          [
            {
              text: 'Go to Calibrate',
              onPress: () => navigation.navigate('Calibration'),
            },
          ]
        );
      }
    })();
  }, [isFocused, navigation]);

  // If camera perms aren’t loaded ye
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Loading camera permissions… </Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Camera permission is required </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  // Clears markers, capturedUri, modal toggles, etc.
  const clearAll = () => {
    setMarker1(null);
    setMarker2(null);
    setCapturedUri(null);
    setHasSaved(false);
    setSaveRaw(true);
    setSaveUX(false);
    setSaveJournal(false);
  };

  // Called when user taps “Recalibrate”
  const handleRecalibrate = async () => {
    await AsyncStorage.removeItem('calibration');
    navigation.navigate('Calibration');
  };

  // Prep measurements for annotation
  let dx = 0,
    dy = 0,
    length = 0,
    angle = 0,
    midX = 0,
    midY = 0,
    inches = 0;
  const hasBoth = marker1 && marker2 && calibration;
  if (hasBoth) {
    dx = marker2.x - marker1.x;
    dy = marker2.y - marker1.y;
    length = Math.hypot(dx, dy);
    angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    midX = marker1.x + MARKER_SIZE / 2 + dx / 2;
    midY = marker1.y + MARKER_SIZE / 2 + dy / 2;

    if (length > 0 && distanceFromCamera > 0 && calibration!.pixelsPerInch > 0) {
      inches = convertPixelsToInches(
        length,
        distanceFromCamera,
        calibration!.calibrationDistance,
        calibration!.pixelsPerInch
      );
    } else {
      inches = 0;
    }
  }

  // perp unit vector for label offset
  const perpX = -dy / (length || 1);
  const perpY = dx / (length || 1);
  const LABEL_OFFSET = 12;

  // Ensure (or create) hunt folder
  const ensureFolder = async () => {
    let folder = activeFolder;
    if (!folder) {
      folder = `hunt_${Date.now()}`;
      const folderUri = FileSystem.documentDirectory + folder + '/';
      await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
      await FileSystem.writeAsStringAsync(
        folderUri + 'metadata.json',
        JSON.stringify({ title: 'Untitled Hunt' })
      );
      setActiveFolder(folder);
    }
    return folder;
  };

  // Save logic
  const handleConfirmSave = async () => {
    if (hasSaved) return;
    setHasSaved(true);
    try {
      const folder = await ensureFolder();
      const folderUri = FileSystem.documentDirectory + folder + '/';
      let rawUri: string | null = null;
      let uxSnapshotUri: string | null = null;

      // Save raw photo if selected
      if (saveRaw && capturedUri) {
        const files = await FileSystem.readDirectoryAsync(folderUri);
        const rawIndex = files.length + 1;
        const dest = `${folderUri}${rawIndex}.jpg`;
        try {
          await FileSystem.moveAsync({ from: capturedUri, to: dest });
        } catch {
          await FileSystem.copyAsync({ from: capturedUri, to: dest });
        }
        rawUri = dest;
      }

      // Save annotated photo if selected
      if (saveUX && capturedUri) {
        const target = findNodeHandle(containerRef.current)!;
        const snapshot = await captureRef(target, { format: 'jpg', quality: 1 });
        const files2 = await FileSystem.readDirectoryAsync(folderUri);
        const uxIndex = files2.length + 1;
        const dest2 = `${folderUri}${uxIndex}.jpg`;
        try {
          await FileSystem.moveAsync({ from: snapshot, to: dest2 });
        } catch {
          await FileSystem.copyAsync({ from: snapshot, to: dest2 });
        }
        uxSnapshotUri = dest2;
      }

      // If “Create Journal Entry” is toggled, navigate
      if (saveJournal) {
        let coords = null;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const { coords: c } = await Location.getCurrentPositionAsync({});
          coords = { latitude: c.latitude, longitude: c.longitude };
        }
        const measurement = inches.toFixed(2);
        const userName =
          auth.currentUser?.displayName ?? auth.currentUser?.email ?? 'Unknown';
        navigation.navigate('JournalEntryForm', {
          imageUri: saveUX ? uxSnapshotUri : rawUri,
          measurement,
          coords,
          userName,
        });
        return;
      }

      Alert.alert('Saved', 'Your photo has been saved to the hunt.');
      setModalVisible(false);
      clearAll();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Failed to save photo');
    }
  };

  return (
    <View style={styles.container}>
      <InstructionBanner
        message="Drag and drop two markers to measure distance."
        message2="Adjust slider to match your distance to the object being measured."
        autoHideDuration={6000}
      />

      {/* Camera + Markers Container */}
      <View
        style={styles.camera}
        ref={containerRef}
        collapsable={false}
        onLayout={(evt) => {
          const { width, height } = evt.nativeEvent.layout;
          setCameraSize({ width, height });
        }}
      >
        {/* 1) Static image or live camera preview, sized to cameraSize */}
        {capturedUri ? (
          <Image
            source={{ uri: capturedUri }}
            style={{ width: cameraSize.width, height: cameraSize.height }}
            resizeMode="cover"
          />
        ) : (
          isFocused &&
          cameraSize.height > 0 && (
            <CameraView
              ref={cameraRef}
              style={{ width: cameraSize.width, height: cameraSize.height }}
              facing={facing}
            />
          )
        )}

        {/* 2) Crosshairs (only once cameraSize is known) */}
        {cameraSize.width > 0 &&
          cameraSize.height > 0 &&
          (
            <>
              {marker1 && (
                <DraggableCrosshair
                  parentWidth={cameraSize.width}
                  parentHeight={cameraSize.height}
                  clampTop={TOP_UI_HEIGHT}
                  clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                  key={`marker1-${marker1.x}-${marker1.y}`}
                  initialX={marker1.x}
                  initialY={marker1.y}
                  onDragEnd={setMarker1}
                  capturedUri={capturedUri}
                />
              )}
              {marker2 && (
                <DraggableCrosshair
                  parentWidth={cameraSize.width}
                  parentHeight={cameraSize.height}
                  clampTop={TOP_UI_HEIGHT}
                  clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                  key={`marker2-${marker2.x}-${marker2.y}`}
                  initialX={marker2.x}
                  initialY={marker2.y}
                  onDragEnd={setMarker2}
                  capturedUri={capturedUri}
                />
              )}

              {!marker1 && (
                <DraggableCrosshair
                  parentWidth={cameraSize.width}
                  parentHeight={cameraSize.height}
                  clampTop={TOP_UI_HEIGHT}
                  clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                  initialX={cameraSize.width / 2 - 60}
                  initialY={cameraSize.height / 2}
                  onDragEnd={setMarker1}
                  capturedUri={capturedUri}
                />
              )}
              {!marker2 && marker1 && (
                <DraggableCrosshair
                  parentWidth={cameraSize.width}
                  parentHeight={cameraSize.height}
                  clampTop={TOP_UI_HEIGHT}
                  clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                  initialX={cameraSize.width / 2 + 60}
                  initialY={cameraSize.height / 2}
                  onDragEnd={setMarker2}
                  capturedUri={capturedUri}
                />
              )}
            </>
          )}

        {/* 3) Dotted line & distance label */}
        {hasBoth && (
          <>
            <View
              style={{
                position: 'absolute',
                left: midX - length / 2,
                top: midY,
                width: length,
                height: 0,
                borderStyle: 'dotted',
                borderBottomWidth: 2,
                borderColor: 'white',
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
            <Text
              style={{
                position: 'absolute',
                left: midX + perpX * LABEL_OFFSET - 15,
                top: midY + perpY * LABEL_OFFSET,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {`${inches.toFixed(2)}"`}
            </Text>
          </>
        )}

        {/* 4) Restart button */}
        <TouchableOpacity style={styles.restartButton} onPress={clearAll}>
          <Text style={styles.restartText}>Restart </Text>
        </TouchableOpacity>
      </View>

      {/* Slider + Buttons */}
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>
          Distance from Camera: {distanceFromCamera.toFixed(0)}"
        </Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={12}
          maximumValue={96}
          step={1}
          value={distanceFromCamera}
          onValueChange={setDistanceFromCamera}
        />

        {!capturedUri && (
          <View style={styles.buttonSpacing}>
            <Button
              title="Capture Image"
              onPress={async () => {
                if (cameraRef.current) {
                  // Reset modal + toggles
                  setHasSaved(false);
                  setSaveRaw(true);
                  setSaveUX(false);
                  setSaveJournal(false);

                  const photo = await cameraRef.current.takePictureAsync();
                  setCapturedUri(photo.uri);
                }
              }}
            />
          </View>
        )}

        {activeFolder && !capturedUri && (
          <View style={styles.buttonSpacing}>
            <Button
              title="End Hunt Session"
              color="#ff4444"
              onPress={() => {
                setActiveFolder(null);
                Alert.alert('Hunt ended', 'Next photo will start a new folder.');
              }}
            />
          </View>
        )}

        {capturedUri && (
          <View style={styles.buttonSpacing}>
            <Button title="Save to Hunt Folder" onPress={() => setModalVisible(true)} />
          </View>
        )}

        <View style={styles.buttonSpacing}>
          <Button title="Recalibrate" color="#ff4444" onPress={handleRecalibrate} />
        </View>
      </View>

      {/* Save Options Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Options </Text>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Raw Photo </Text>
              <Switch value={saveRaw} onValueChange={setSaveRaw} />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Photo + Markers </Text>
              <Switch value={saveUX} onValueChange={setSaveUX} />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Create Journal Entry </Text>
              <Switch value={saveJournal} onValueChange={setSaveJournal} />
            </View>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              {hasSaved ? (
                <Button title="Done" onPress={() => setModalVisible(false)} />
              ) : (
                <Button title="Save" onPress={handleConfirmSave} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1, 
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    margin: 10,
  },
  sliderContainer: {
    position: 'absolute',
    bottom: 20,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  restartButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
  restartText: {
    color: '#fff',
    textAlign: 'center',
  },
  buttonSpacing: {
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
