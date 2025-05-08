import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Button, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePixelDistance, convertPixelsToInches } from '../utils/measurement';

const { width } = Dimensions.get('window');

export default function MeasureScreen({ navigation }: any) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    // Stores the two user-selected tap points on the camera screen
    const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
    const [distanceFromCamera, setDistanceFromCamera] = useState(36);
    const [calibration, setCalibration] = useState<{
        pixelsPerInch: number,
        calibrationDistance: number
    } | null>(null);

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

    /*// Calculate distance between two points in pixels
    const calculatePixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Converts pixel distance to inches
    const convertPixelsToInches = (pixelDistance: number, distanceFromCamera: number, screenWidth: number) => {

        // Convert 60 degrees to radians for the field of view calculation
        // Assuming a 60-degree field of view for the camera
        const fovRadians = (60 * Math.PI) / 180;

        // Calculate the real world width at the distance from the camera
        const realWorldWidthAtDistance = 2 * distanceFromCamera * Math.tan(fovRadians / 2);
        const pixelsPerInch = screenWidth / realWorldWidthAtDistance;
        return pixelDistance / pixelsPerInch;
    };*/



    return (
        <View style={styles.container}>

            {/* Container for the camera preview and tap overlay */}
            <View style={styles.camera}>

                {/* Live camera feed */}
                <CameraView key={Date.now()} style={StyleSheet.absoluteFill} facing={facing} />

                {/* Transparent overlay to detect tap events */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleTap}
                >
                    {/* Render red markers at each selected point */}
                    {points.map((p, i) => (
                        <View
                            key={i}
                            style={[
                                styles.point,
                                { left: p.x - 10, top: p.y - 10 }
                            ]}
                        />
                    ))}
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
});