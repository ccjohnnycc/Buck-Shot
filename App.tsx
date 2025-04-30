import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
