
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Button, Alert, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InstructionBanner from '../components/InstructionBanner';
import { useIsFocused } from '@react-navigation/native';
import DraggableCrosshair from '../components/DraggableCrosshair';


const { width } = Dimensions.get('window');

export default function CalibrationScreen({ navigation }: any) {
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCalibration, setHasCalibration] = useState(false);
  const knownWidthInches = 3.375;
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const [marker1, setMarker1] = useState<{ x: number, y: number } | null>(null);
  const [marker2, setMarker2] = useState<{ x: number, y: number } | null>(null);

  // Check if calibration already exists in AsyncStorage
  useEffect(() => {
    const checkCalibration = async () => {
      const data = await AsyncStorage.getItem('calibration');
      if (data) setHasCalibration(true);
    };
    checkCalibration();
  }, []);

  if (!permission) return <View style={styles.center}><Text>Requesting permissions... </Text></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Camera permission is required </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  // Calculate distance between two marker points in pixels
  const calculatePixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Save the current calibration settings to AsyncStorage
  const saveCalibration = async () => {
    if (!marker1 || !marker2) {
      Alert.alert("Calibration Incomplete", "Please drag both markers to the ends of your credit card.");
      return;
    }

    const pixelDistance = calculatePixelDistance(marker1, marker2);
    const pixelsPerInch = pixelDistance / knownWidthInches;
    const calibrationDistance = 36;

    await AsyncStorage.setItem('calibration', JSON.stringify({
      pixelsPerInch,
      calibrationDistance
    }));

    Alert.alert("Calibration Saved", "You can now measure objects at different distances.");
    navigation.navigate('Measure');
  };

  // Reset all calibration data
  const handleResetCalibration = async () => {
    await AsyncStorage.removeItem('calibration');
    setHasCalibration(false);
    setMarker1(null);
    setMarker2(null);
    setCapturedUri(null);
    Alert.alert("Calibration Reset", "Calibration data has been cleared.");
  };

  return (
    <View style={styles.container}>

      {/* Banner with instructions */}
      <InstructionBanner message="Drag both crosshairs to the ends of a credit card to calibrate." />
      <View style={styles.camera}>

        {/* Either show captured image or live camera */}
        {capturedUri ? (
          <Image
            source={{ uri: capturedUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          isFocused && (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
            />
          )
        )}

        {/* Render draggable crosshairs for marker1 and marker2 */}
        {marker1 && (
          <DraggableCrosshair
            initialX={marker1.x}
            initialY={marker1.y}
            onDragEnd={setMarker1}
          />
        )}
        {marker2 && (
          <DraggableCrosshair
            initialX={marker2.x}
            initialY={marker2.y}
            onDragEnd={setMarker2}
          />
        )}
        {!marker1 && (
          <DraggableCrosshair
            initialX={width / 2 - 60}
            initialY={200}
            onDragEnd={setMarker1}
          />
        )}
        {!marker2 && marker1 && (
          <DraggableCrosshair
            initialX={width / 2 + 60}
            initialY={200}
            onDragEnd={setMarker2}
          />
        )}

        {/* Controls: only show "Capture" if live view */}
        <View style={styles.buttonOverlay}>
          {!capturedUri && (
            <View style={styles.buttonSpacing}>
              <Button title="Capture Image" onPress={async () => {
                if (cameraRef.current) {
                  const photo = await cameraRef.current.takePictureAsync();
                  setCapturedUri(photo.uri);
                }
              }} />
            </View>
          )}

          {capturedUri && (
            <View style={styles.buttonSpacing}>
              <Button title="Live Camera" onPress={() => setCapturedUri(null)} />
            </View>
          )}

          <View style={styles.buttonSpacing}>
            <Button title="Save Calibration" onPress={saveCalibration} />
          </View>

          {hasCalibration && (
            <View style={styles.buttonSpacing}>
              <Button title="Reset Calibration" color="#ff4444" onPress={handleResetCalibration} />
            </View>
          )}
        </View>

        {/* Restart individual markers */}
        <View style={styles.restartButton}>
          <Button title="Restart" onPress={() => {
            setMarker1(null);
            setMarker2(null);
          }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
  label: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  buttonOverlay: {
    position: 'absolute',
    bottom: 25,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10,
  },
  buttonSpacing: {
    marginBottom: 10,
  },
  restartButton: {
    position: 'absolute',
    marginTop: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
});
