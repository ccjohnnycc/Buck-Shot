import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MeasureScreen from '../screens/MeasureScreen';
import LoginScreen from '../screens/LoginScreen';
import AuthScreen from '../screens/AuthScreen';
import SignupScreen from '../screens/SignupScreen';
import CalibrationScreen from '../screens/CalibrationScreen';
import GalleryScreen from '../screens/GalleryScreen';
import HuntDetailScreen from '../screens/HuntDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Measure: undefined;
  Login: undefined;
  Signup: undefined;
  AuthLanding: undefined;
  Calibration: undefined;
  Gallery: undefined;
  HuntDetail: { folderName: string };
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
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerBackVisible: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Measure" component={MeasureScreen} />
        <Stack.Screen name="AuthLanding" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Calibration" component={CalibrationScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
       <Stack.Screen name="HuntDetail" component={HuntDetailScreen} options={{ title: 'Hunt Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}