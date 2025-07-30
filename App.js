import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import CameraScreen from './src/screens/CameraScreen';
import ScanResultsScreen from './src/screens/ScanResultsScreen';
import MySightingsScreen from './src/screens/MySightingsScreen';
import BirdDetailScreen from './src/screens/BirdDetailScreen';
import PremiumUpsellScreen from './src/screens/PremiumUpsellScreen';
import CommunityFeedScreen from './src/screens/CommunityFeedScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import providers
import { AuthProvider } from './src/contexts/AuthContext';
import { BirdProvider } from './src/contexts/BirdContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#059669',
    primaryContainer: '#ecfdf5',
    secondary: '#0d9488',
    secondaryContainer: '#f0fdfa',
    tertiary: '#0891b2',
    background: '#ffffff',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',
  },
};

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Camera') {
            iconName = 'camera';
          } else if (route.name === 'MySightings') {
            iconName = 'book-open-variant';
          } else if (route.name === 'Community') {
            iconName = 'account-group';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          title: 'Identify Birds',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="MySightings" 
        component={MySightingsScreen}
        options={{
          title: 'My Sightings',
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityFeedScreen}
        options={{
          title: 'Community Feed',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main App Stack Navigator
function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ScanResults" 
        component={ScanResultsScreen}
        options={{
          title: 'Bird Identification',
          headerStyle: { backgroundColor: '#059669' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="BirdDetail" 
        component={BirdDetailScreen}
        options={{
          title: 'Bird Details',
          headerStyle: { backgroundColor: '#059669' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="PremiumUpsell" 
        component={PremiumUpsellScreen}
        options={{
          title: 'Go Premium',
          headerStyle: { backgroundColor: '#059669' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <BirdProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor="#059669" />
            <AuthStack />
            {/* Will conditionally show AppStack when user is authenticated */}
          </NavigationContainer>
        </BirdProvider>
      </AuthProvider>
    </PaperProvider>
  );
}