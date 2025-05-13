
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Button, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InstructionBanner from '../components/InstructionBanner';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function CalibrationScreen({ navigation }: any) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
  const [hasCalibration, setHasCalibration] = useState(false);
  const knownWidthInches = 3.375;
  const isFocused = useIsFocused();

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

  const handleTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    if (points.length === 2) {
      setPoints([{ x: locationX, y: locationY }]);
    } else {
      setPoints([...points, { x: locationX, y: locationY }]);
    }
  };

  const calculatePixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const saveCalibration = async () => {
    if (points.length !== 2) {
      Alert.alert("Calibration Incomplete", "Please tap both ends of the known object.");
      return;
    }

    const pixelDistance = calculatePixelDistance(points[0], points[1]);
    const pixelsPerInch = pixelDistance / knownWidthInches;
    const calibrationDistance = 36;

    await AsyncStorage.setItem('calibration', JSON.stringify({
      pixelsPerInch,
      calibrationDistance
    }));

    Alert.alert("Calibration Saved", "You can now measure objects at different distances.");
    navigation.navigate('Measure');
  };

  const handleResetCalibration = async () => {
    await AsyncStorage.removeItem('calibration');
    Alert.alert("Calibration Reset", "Calibration data has been cleared.");
    setHasCalibration(false);
    setPoints([]);
  };

  return (
    <View style={styles.container}>
      <InstructionBanner message="Tap both edges of a credit card to calibrate." />
      <View style={styles.camera}>
        {isFocused && (
          <CameraView style={StyleSheet.absoluteFill} facing={facing} />
        )}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleTap}
        >
          {points.map((p, i) => (
            <View
              key={i}
              style={[styles.point, { left: p.x - 10, top: p.y - 10 }]}
            />
          ))}
        </TouchableOpacity>

        <View style={styles.bottom}>
          <Text style={styles.label}>Tap both ends of a credit card on screen</Text>
          <Button title="Save Calibration" onPress={saveCalibration} />
          {hasCalibration && (
            <View style={{ marginTop: 10 }}>
              <Button title="Reset Calibration" color="#ff4444" onPress={handleResetCalibration} />
            </View>
          )}
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
  point: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'lime',
    borderWidth: 2,
    borderColor: 'white',
  },
  label: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
  },
  bottom: {
    position: 'absolute',
    bottom: 40,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10,
  }
});
