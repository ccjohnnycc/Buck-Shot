import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Button } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

export default function MeasureScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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
    
    /*useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (permission === null) {
        return <View style={styles.center}><Text>Requesting camera permission... </Text></View>;
    }
    if (!permission.granted) {
        return <View style={styles.center}><Text>No access to camera </Text></View>;
    }*/
    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
            />

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
});