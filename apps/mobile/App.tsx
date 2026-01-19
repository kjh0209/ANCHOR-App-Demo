import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MatchingScreen from './src/screens/MatchingScreen';
import DriverDashboardScreen from './src/screens/DriverDashboardScreen';
import PassengerWaitScreen from './src/screens/PassengerWaitScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: '로그인', headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: '회원가입' }}
            />
            <Stack.Screen
              name="Matching"
              component={MatchingScreen}
              options={{ title: '매칭', headerLeft: () => null }}
            />
            <Stack.Screen
              name="DriverDashboard"
              component={DriverDashboardScreen}
              options={{ title: '기사 대시보드', headerLeft: () => null }}
            />
            <Stack.Screen
              name="PassengerWait"
              component={PassengerWaitScreen}
              options={{ title: '승객 대기', headerLeft: () => null }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
