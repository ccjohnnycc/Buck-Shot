import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ImageBackground, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const homeScreenImage = require('../../assets/background_image.png');
    const homeTitle = require('../../assets/title_buck.png');
    const navigation = useNavigation<HomeNavProp>();

    return (
        <ImageBackground source={homeScreenImage} style={styles.background}>
            <View style={styles.overlay} />

            <SafeAreaView style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Image
                        source={homeTitle}
                        style={styles.titleImage}
                        resizeMode="contain"
                    />
                </View>

                {/* BODY */}
                <View style={styles.body}>
                    <View style={styles.button}>
                        <Button
                            title="Profile"
                            onPress={() => navigation.navigate('Profile')}
                        />
                    </View>
                    <View style={styles.button}>
                     <Button 
                     title="View Gallery" 
                     onPress={() => navigation.navigate('Gallery')} 
                     />
                    </View>
                    <View style={styles.button}>
                        <Button 
                        title="Capture Measurement" 
                        onPress={() => navigation.navigate('Measure')} 
                        />
                    </View>
                    <View style={styles.button}>
                        <Button title="Weather" onPress={() => { }} />
                    </View>
                    <View style={styles.button}>
                    <Button title="Journal" onPress={() => navigation.navigate('JournalList')} />
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
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    container: {
        flex: 1,
    },
    header: {
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleImage: {
        width: '60%',
        maxWidth: 240,
        aspectRatio: 3,
    },
    body: {
        flex: 2.8,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    button: {
        width: '60%',
        marginVertical: 8,
    },
});
