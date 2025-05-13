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
    // Stores the distance from the camera in inches
    const [distanceFromCamera, setDistanceFromCamera] = useState(36);
    const cameraRef = useRef<CameraViewRef | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [calibration, setCalibration] = useState<{ pixelsPerInch: number, calibrationDistance: number } | null>(null);
    const isFocused = useIsFocused();
    const [marker1, setMarker1] = useState<{ x: number; y: number } | null>(null);
    const [marker2, setMarker2] = useState<{ x: number; y: number } | null>(null);


    React.useEffect(() => {
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

    /* CALCULATING DISTANCE */
    const handleRecalibrate = async () => {
        await AsyncStorage.removeItem('calibration');
        navigation.navigate('Calibration');
    };

    const clearPoints = () => {
        setMarker1(null);
        setMarker2(null);
    };

    const renderMeasurement = () => {
        if (marker1 && marker2 && calibration) {
            const pixelDistance = calculatePixelDistance(marker1, marker2);
            const inches = convertPixelsToInches(
                pixelDistance,
                distanceFromCamera,
                calibration.calibrationDistance,
                calibration.pixelsPerInch
            );
            return (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>Measured Distance: {inches.toFixed(2)} inches</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <View style={styles.container}>

            {/* Instruction banner to guide the user */}
            <InstructionBanner message="Drag and drop two markers to measure distance." autoHideDuration={6000} />

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

                {marker1 && (
                    <DraggableCrosshair initialX={marker1.x} initialY={marker1.y} onDragEnd={setMarker1} />
                )}
                {marker2 && (
                    <DraggableCrosshair initialX={marker2.x} initialY={marker2.y} onDragEnd={setMarker2} />
                )}

                {!marker1 && (
                    <DraggableCrosshair initialX={width / 2 - 60} initialY={300} onDragEnd={setMarker1} />
                )}
                {!marker2 && marker1 && (
                    <DraggableCrosshair initialX={width / 2 + 60} initialY={300} onDragEnd={setMarker2} />
                )}

                {/* Restart button */}
                <TouchableOpacity style={styles.restartButton} onPress={clearPoints}>
                    <Text style={styles.restartText}>Restart </Text>
                </TouchableOpacity>
            </View>

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

                {/* capture button */}
                <Button title="Capture Image" onPress={async () => {
                    if (cameraRef.current) {
                        const photo = await cameraRef.current.takePictureAsync();
                        setCapturedUri(photo.uri);
                    }
                }} />

                {/* Show save button after capturing */}
                {capturedUri && (
                    <Button title="Save to Device" onPress={async () => {
                        try {
                            const fileName = `hunt_${Date.now()}.jpg`;
                            const localUri = FileSystem.documentDirectory + fileName;

                            await FileSystem.moveAsync({
                                from: capturedUri,
                                to: localUri,
                            });
                            Alert.alert("Saved!", `Saved locally at:\n${localUri}`);
                            setCapturedUri(null);
                        } catch (err) {
                            console.error("Save error:", err);
                            Alert.alert("Failed to save locally.");
                        }
                    }} />
                )}
            </View>

            {renderMeasurement()}
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
        color: '#000',
        textAlign: 'center',
    },
});