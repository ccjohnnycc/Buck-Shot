import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MeasureScreen from '../screens/MeasureScreen';
import WeatherScreen from '../screens/WeatherScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabParamList = {
    Measure: undefined;
    Weather: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
    return (
        <Tab.Navigator
            initialRouteName="Measure"
            screenOptions={({ route }) => ({
                headerShown: false, tabBarIcon: ({ color, size }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'help-circle';

                    if (route.name === 'Measure') {
                        iconName = 'scan-outline';
                    } else if (route.name === 'Weather') {
                        iconName = 'rainy-outline';
                    } else if (route.name === 'Profile') {
                        iconName = 'person-circle-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2f95dc',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Measure" component={MeasureScreen} />
            <Tab.Screen name="Weather" component={WeatherScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
