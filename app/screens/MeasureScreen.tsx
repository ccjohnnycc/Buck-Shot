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
    const [activeFolder, setActiveFolder] = useState<string | null>(null);


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

                {/* Show measured distance at the top */}
                {marker1 && marker2 && calibration && (
                    <Text style={styles.resultText}>
                        Distance: {convertPixelsToInches(
                            calculatePixelDistance(marker1, marker2),
                            distanceFromCamera,
                            calibration.calibrationDistance,
                            calibration.pixelsPerInch
                        ).toFixed(2)} inches
                    </Text>
                )}

                <Text style={styles.label}>Distance from Camera: {distanceFromCamera.toFixed(0)} inches</Text>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={12}
                    maximumValue={96}
                    step={1}
                    value={distanceFromCamera}
                    onValueChange={setDistanceFromCamera}
                />

                {/* capture button */}
                <Button title="Capture Image" onPress={async () => {
                    if (cameraRef.current) {
                        const photo = await cameraRef.current.takePictureAsync();
                        setCapturedUri(photo.uri);
                    }
                }} />
            {activeFolder && !capturedUri && (
                <Button title="End Hunt Session" color="#ff4444" onPress={() => { setActiveFolder(null);
                Alert.alert("Hunt ended", "Next photo will start a new folder.");
            }}
            />
            )}

                {/* Show save button after capturing */}
                {capturedUri && (
                    <Button title="Save to Hunt Folder" onPress={async () => {
                        try {
                            // Step 1: Create or reuse active folder
                            let folder = activeFolder;
                            if (!folder) {
                                folder = `hunt_${Date.now()}`;
                                const folderUri = FileSystem.documentDirectory + folder + '/';
                                await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });

                                // Save default metadata
                                await FileSystem.writeAsStringAsync(folderUri + 'metadata.json', JSON.stringify({
                                    title: "Untitled Hunt"
                                }));

                                setActiveFolder(folder);
                            }

                            // Step 2: Save image to folder
                            const folderUri = FileSystem.documentDirectory + folder + '/';
                            const files = await FileSystem.readDirectoryAsync(folderUri);
                            const nextIndex = files.length + 1;
                            const fileName = `${nextIndex}.jpg`;
                            const newUri = folderUri + fileName;

                            await FileSystem.moveAsync({
                                from: capturedUri!,
                                to: newUri,
                            });

                            Alert.alert("Photo Saved", `Saved to: ${folder}`);
                            setCapturedUri(null);
                            setMarker1(null);
                            setMarker2(null);
                        } catch (err) {
                            console.error("Save error:", err);
                            Alert.alert("Failed to save photo");
                        }
                    }} />
                )}

                {/* Back to live view button */}
                {capturedUri && (
                    <View style={styles.buttonSpacing}>
                        <Button title="Return to Live Camera" onPress={() => {
                            setCapturedUri(null);
                            clearPoints();
                        }} />
                    </View>
                )}

                {/* Recalibrate */}
                <View style={styles.buttonSpacing}>
                    <Button title="Recalibrate" color="#ff4444" onPress={handleRecalibrate} />
                </View>
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
    sliderContainer: {
        position: 'absolute',
        bottom: 20,
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
});