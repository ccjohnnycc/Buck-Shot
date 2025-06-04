import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, } from '@react-navigation/native-stack';
//import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MeasureScreen from '../screens/MeasureScreen';
import LoginScreen from '../screens/LoginScreen';
import AuthScreen from '../screens/AuthScreen';
import SignupScreen from '../screens/SignupScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import GalleryScreen from '../screens/GalleryScreen';
import HuntDetailScreen from '../screens/HuntDetailScreen';
import JournalListScreen from '../screens/JournalListScreen';
import JournalEntryForm from '../screens/JournalEntryForm';
import MainTabs from './MainTabs';

export type RootStackParamList = {
  Main: undefined;
  //Home: undefined;
  Profile: undefined;
  Measure: undefined;
  Login: undefined;
  Signup: undefined;
  AuthLanding: undefined;
  Calibration: undefined;
  Gallery: { filterTags?: string[] };
  HuntDetail: { folderName: string };
  JournalList: { filterTags?: string[] };
  JournalEntryForm: {
    entryId?: string;
    imageUri?: string;
    measurement?: string;
    coords?: { latitude: number; longitude: number };
    userName?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Shared header styles
const commonHeaderOptions: NativeStackNavigationOptions = {
  headerTransparent: true,
  headerStyle: { backgroundColor: 'transparent' },
  headerTitleStyle: { color: '#fff' },
  headerTitleAlign: 'center',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLanding"
        screenOptions={commonHeaderOptions}>
        {/*<Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />*/}
        <Stack.Screen name="AuthLanding" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Calibration" component={CalibrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Gallery" component={GalleryScreen}/>
        <Stack.Screen name="HuntDetail" component={HuntDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="JournalList" component={JournalListScreen} />
        <Stack.Screen name="JournalEntryForm" component={JournalEntryForm} />
        {/*<Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Measure" component={MeasureScreen} options={{ headerShown: false }} />*/}
      </Stack.Navigator>
    </NavigationContainer>
  );
}