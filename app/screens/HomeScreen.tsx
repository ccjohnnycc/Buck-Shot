import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const homeScreenImage = require('../../assets/background_image.png');
    const homeTitle = require('../../assets/title_buck.png');
    const navigation = useNavigation<HomeNavProp>();

    return (
        <ImageBackground
            source={homeScreenImage}
            style={styles.background}
            resizeMode="cover"
        >
        <Image
            source={homeTitle}
            style={styles.titleImage}
            resizeMode="contain"
        />
            {/* tint overlay */}
            <View style={styles.overlay} />
            <SafeAreaView style={styles.container}>

                <View style={styles.buttonGroup}>
                    <View style={styles.button}>
                        <Button title="Sign Up" onPress={() => {/* navigate to SignUp */ }} />
                    </View>
                    <View style={styles.button}>
                        <Button title="Sign In" onPress={() => {/* navigate to SignIn */ }} />
                    </View>
                    <View style={styles.button}>
                        <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
                    </View>
                    <View style={styles.button}>
                        <Button title="Capture Measurement" onPress={() => {/* navigate to Measure */ }} />
                    </View>
                    <View style={styles.button}>
                        <Button title="Continue as Guest" onPress={() => {/* guest flow */ }} />
                    </View>
                    <View style={styles.button}>
                        <Button title="Weather" onPress={() => {/* navigate to Weather */ }} />
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    titleImage: {
        position: 'absolute',
        top: 60,
        width: '60%',
        aspectRatio: 3,
        alignSelf: 'center',
    },
    buttonGroup: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        width: '80%',
        marginVertical: 8,
    },
});
