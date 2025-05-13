import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Button, Alert, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePixelDistance, convertPixelsToInches } from '../utils/measurement';
import * as FileSystem from 'expo-file-system';
import type { CameraView as CameraViewRef } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import InstructionBanner from '../components/InstructionBanner';
import DraggableCrosshair from '../components/DraggableCrosshair';



const { width } = Dimensions.get('window');

export default function MeasureScreen({ navigation }: any) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    // Stores the two user-selected tap points on the camera screen
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
    // Stores the distance from the camera in inches
    const [distanceFromCamera, setDistanceFromCamera] = useState(36);
    const cameraRef = useRef<CameraViewRef | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [calibration, setCalibration] = useState<{ pixelsPerInch: number, calibrationDistance: number } | null>(null);
    const isFocused = useIsFocused();


    useEffect(() => {
        const loadCalibration = async () => {
            const data = await AsyncStorage.getItem('calibration');
            if (data) {
                setCalibration(JSON.parse(data));
            } else {
                Alert.alert("Calibration Required", "Please calibrate before measuring.", [
                    { text: "Go to Calibrate", onPress: () => navigation.navigate('Calibration') }
                ]);
            }
        };
        loadCalibration();
    }, []);

    /* CAMERA PERMISSION */
    if (!permission) {
        return (
            <View style={styles.center}>
                <Text style={styles.label}>Loading camera permissions... </Text>
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

    /* SELECTING POINTS */
    // alled when the user taps on the screen.
    const handleTap = (event: any) => {
        const { locationX, locationY } = event.nativeEvent;

        // If already two points selected, start over
        if (points.length === 2) {
            setPoints([{ x: locationX, y: locationY }]);
        } else {
            // add the new tap to the array
            setPoints([...points, { x: locationX, y: locationY }]);
        }
    };

    /* CALCULATING DISTANCE */
    const handleRecalibrate = async () => {
        await AsyncStorage.removeItem('calibration');
        navigation.navigate('Calibration');
    };

    return (
        <View style={styles.container}>

            {/* Instruction banner to guide the user */}
            <InstructionBanner message="Tap two points to measure." autoHideDuration={6000} />

            {/* Container for the camera preview and tap overlay */}
            <View style={styles.camera}>

                {/* Live camera feed */}
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


                {/* Transparent overlay to detect tap events */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleTap}
                >
                    {/* Render red markers at each selected point */}
                    <DraggableCrosshair
                        initialX={width / 2 - 60}
                        initialY={200}
                        onDragEnd={(pos) => {
                            const newPoints = [...points, pos];
                            if (newPoints.length > 2) return;
                            setPoints(newPoints);
                        }}
                    />
                    {points.length >= 1 && (
                        <DraggableCrosshair
                            initialX={width / 2 + 60}
                            initialY={200}
                            onDragEnd={(pos) => {
                                const newPoints = [...points];
                                newPoints[1] = pos;
                                setPoints(newPoints);
                            }}
                        />
                    )}

                </TouchableOpacity>

                {/* Display the calculated distance in inches if two points are selected */}
                <View style={styles.sliderContainer}>
                    <Text style={styles.label}>Distance from Camera: {distanceFromCamera.toFixed(0)} inches</Text>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={12}
                        maximumValue={96}
                        step={1}
                        value={distanceFromCamera}
                        onValueChange={setDistanceFromCamera}
                    />
                    <Button title="Recalibrate" color="#ff4444" onPress={handleRecalibrate} />
                </View>
                {points.length === 2 && calibration && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>
                            Measured Distance: {convertPixelsToInches(
                                calculatePixelDistance(points[0], points[1]),
                                distanceFromCamera,
                                calibration.calibrationDistance,
                                calibration.pixelsPerInch
                            ).toFixed(2)} inches
                        </Text>
                    </View>
                )}
                {/* capture button */}
                <View style={styles.captureButton}>
                    <Button title="Capture Image" onPress={async () => {
                        if (cameraRef.current) {
                            const photo = await cameraRef.current.takePictureAsync();
                            setCapturedUri(photo.uri);
                        }
                    }} />
                </View>

                {/* reset buttons */}
                <TouchableOpacity
                    style={styles.restartButton}
                    onPress={() => setPoints([])}
                >
                    <Text style={styles.restartText}>Restart </Text>
                </TouchableOpacity>

                {/* Show save button after capturing */}
                {capturedUri && (
                    <View style={styles.saveButton}>
                        <Button title="Save to Device" onPress={async () => {
                            try {
                                const fileName = `hunt_${Date.now()}.jpg`;
                                const localUri = FileSystem.documentDirectory + fileName;

                                await FileSystem.moveAsync({
                                    from: capturedUri,
                                    to: localUri,
                                });
                                setCapturedUri(null);

                                Alert.alert("Saved!", `Saved locally at:\n${localUri}`);
                                setCapturedUri(null);
                            } catch (err) {
                                console.error("Save error:", err);
                                Alert.alert("Failed to save locally.");
                            }
                        }} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    camera: {
        width: '100%',
        height: '100%'
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
    point: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'red',
        borderWidth: 2,
        borderColor: 'white',
    },
    sliderContainer: {
        position: 'absolute',
        bottom: 100,
        width: '90%',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    resultContainer: {
        position: 'absolute',
        bottom: 50,
        width: '90%',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    resultText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    captureButton: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    saveButton: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
    },
    restartButton: {
        position: 'absolute',
        marginTop: 60,
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 10,
        borderRadius: 5,
    },
    restartText: {
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
    },
});