import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Button,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import InstructionBanner from '../components/InstructionBanner';
import DraggableCrosshair from '../components/DraggableCrosshair';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP_UI_HEIGHT = 60;
const BOTTOM_UI_HEIGHT = 120;

// Known card width for calibration (inches)
const KNOWN_WIDTH_INCHES = 3.375;
// Preset calibration distance (inches)
const CALIBRATION_DISTANCE = 36;

export default function CalibrationScreen({ navigation }: any) {
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasCalibration, setHasCalibration] = useState(false);

  // Measured size of the camera container
  const [cameraSize, setCameraSize] = useState({ width: 0, height: 0 });

  // URI for the captured calibration image
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const isFocused = useIsFocused();

  // Marker positions
  const [marker1, setMarker1] = useState<{ x: number; y: number } | null>(null);
  const [marker2, setMarker2] = useState<{ x: number; y: number } | null>(null);

  // On mount, see if calibration data already exists
  useEffect(() => {
    AsyncStorage.getItem('calibration').then((data) => {
      if (data) setHasCalibration(true);
    });
  }, []);

  // If camera permissions not yet determined…
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting permissions… </Text>
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

  /* Helper to clear everything and go back to live camera */
  const clearAll = () => {
    setCapturedUri(null);
    setMarker1(null);
    setMarker2(null);
  };

  /* Calculate pixel distance between two points */
  const calculatePixelDistance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.hypot(dx, dy);
  };

  /* Save calibration data */
  const saveCalibration = async () => {
    if (!marker1 || !marker2) {
      Alert.alert(
        'Calibration Incomplete',
        'Please drag both markers to the ends of your credit card.'
      );
      return;
    }
    const pixelDistance = calculatePixelDistance(marker1, marker2);
    const pixelsPerInch = pixelDistance / KNOWN_WIDTH_INCHES;

    await AsyncStorage.setItem(
      'calibration',
      JSON.stringify({ pixelsPerInch, calibrationDistance: CALIBRATION_DISTANCE })
    );
    Alert.alert(
      'Calibration Saved',
      'You can now measure objects at different distances.'
    );
    // Navigate back into the Map tab
    navigation.replace('Main', { screen: 'Map' });
  };

  /* Reset stored calibration entirely */
  const handleResetCalibration = async () => {
    await AsyncStorage.removeItem('calibration');
    setHasCalibration(false);
    clearAll();
    Alert.alert('Calibration Reset', 'Calibration data has been cleared.');
  };

  return (
    <View style={styles.container}>
      {/* Instruction banner */}
      <InstructionBanner
        message="Drag both crosshairs to the ends of a credit card to calibrate."
        message2="Hold camera 3 feet (36″) away from your card."
        autoHideDuration={6000}
      />

      {/* Camera / Preview Container */}
      <View
        style={styles.cameraContainer}
        onLayout={(evt) => {
          const { width, height } = evt.nativeEvent.layout;
          setCameraSize({ width, height });
        }}
      >
        {capturedUri ? (
          // Static captured image, sized to cameraSize
          <Image
            source={{ uri: capturedUri }}
            style={{ width: cameraSize.width, height: cameraSize.height }}
            resizeMode="cover"
          />
        ) : (
          // Live camera preview, sized to cameraSize
          isFocused &&
          cameraSize.height > 0 && (
            <CameraView
              ref={cameraRef}
              style={{ width: cameraSize.width, height: cameraSize.height }}
              facing={facing}
            />
          )
        )}

        {/* Only render crosshairs once cameraSize is known */}
        {cameraSize.width > 0 && cameraSize.height > 0 && (
          <>
            {/* Marker 1 */}
            {marker1 ? (
              <DraggableCrosshair
                parentWidth={cameraSize.width}
                parentHeight={cameraSize.height}
                clampTop={TOP_UI_HEIGHT}
                clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                initialX={marker1.x}
                initialY={marker1.y}
                onDragEnd={setMarker1}
                capturedUri={capturedUri}
              />
            ) : (
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

            {/* Marker 2 */}
            {marker2 ? (
              <DraggableCrosshair
                parentWidth={cameraSize.width}
                parentHeight={cameraSize.height}
                clampTop={TOP_UI_HEIGHT}
                clampBottom={cameraSize.height - BOTTOM_UI_HEIGHT}
                initialX={marker2.x}
                initialY={marker2.y}
                onDragEnd={setMarker2}
                capturedUri={capturedUri}
              />
            ) : (
              marker1 && (
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
              )
            )}
          </>
        )}

        {/* Bottom button overlay */}
        <View style={styles.buttonOverlay}>
          {!capturedUri && (
            <View style={styles.buttonSpacing}>
              <Button
                title="Capture Image"
                onPress={async () => {
                  if (cameraRef.current) {
                    const photo = await cameraRef.current.takePictureAsync();
                    setCapturedUri(photo.uri);
                  }
                }}
              />
            </View>
          )}

          <View style={styles.buttonSpacing}>
            <Button title="Save Calibration" onPress={saveCalibration} />
          </View>

          {hasCalibration && (
            <View style={styles.buttonSpacing}>
              <Button
                title="Reset Calibration"
                color="#ff4444"
                onPress={handleResetCalibration}
              />
            </View>
          )}
        </View>

        {/* “Restart” button (above the camera) */}
        <TouchableOpacity style={styles.restartButton} onPress={clearAll}>
          <Text style={styles.restartText}>Restart </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
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
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  buttonOverlay: {
    position: 'absolute',
    bottom: 10, // leave a small gap above the bottom UI if needed
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
});
