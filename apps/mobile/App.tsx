import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MatchingScreen from './src/screens/MatchingScreen';
import DriverDashboardScreen from './src/screens/DriverDashboardScreen';
import PassengerWaitScreen from './src/screens/PassengerWaitScreen';
import ManualLocationScreen from './src/screens/ManualLocationScreen';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Apple SD Gothic Neo fonts
          'AppleSDGothicNeo-Thin': require('./assets/fonts/AppleSDGothicNeoT.ttf'),
          'AppleSDGothicNeo-UltraLight': require('./assets/fonts/AppleSDGothicNeoUL.ttf'),
          'AppleSDGothicNeo-Light': require('./assets/fonts/AppleSDGothicNeoL.ttf'),
          'AppleSDGothicNeo-Regular': require('./assets/fonts/AppleSDGothicNeoR.ttf'),
          'AppleSDGothicNeo-Medium': require('./assets/fonts/AppleSDGothicNeoM.ttf'),
          'AppleSDGothicNeo-SemiBold': require('./assets/fonts/AppleSDGothicNeoSB.ttf'),
          'AppleSDGothicNeo-Bold': require('./assets/fonts/AppleSDGothicNeoB.ttf'),
          'AppleSDGothicNeo-ExtraBold': require('./assets/fonts/AppleSDGothicNeoEB.ttf'),
          'AppleSDGothicNeo-Heavy': require('./assets/fonts/AppleSDGothicNeoH.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail
      }
    }
    loadFonts();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Show nothing while loading
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FFFFFF',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E8EB',
              },
              headerTintColor: '#191F28',
              headerTitleStyle: {
                fontFamily: 'AppleSDGothicNeo-SemiBold',
                fontSize: 17,
              },
              headerBackTitleVisible: false,
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: '회원가입' }}
            />
            <Stack.Screen
              name="Matching"
              component={MatchingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DriverDashboard"
              component={DriverDashboardScreen}
              options={{ title: '기사 대시보드', headerLeft: () => null }}
            />
            <Stack.Screen
              name="PassengerWait"
              component={PassengerWaitScreen}
              options={{ title: '안내 대기', headerLeft: () => null }}
            />
            <Stack.Screen
              name="ManualLocation"
              component={ManualLocationScreen}
              options={{ title: '위치 설정' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
