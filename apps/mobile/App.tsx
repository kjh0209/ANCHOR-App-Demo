import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ModeSelectionScreen from './src/screens/ModeSelectionScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultScreen from './src/screens/ResultScreen';
import ManualLocationScreen from './src/screens/ManualLocationScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="ModeSelection"
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
              name="ModeSelection"
              component={ModeSelectionScreen}
              options={{ title: '사용자 선택' }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: '공항 픽업 안내' }}
            />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
              options={{ title: '주행 화면 촬영' }}
            />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: '감지 결과' }}
            />
            <Stack.Screen
              name="ManualLocation"
              component={ManualLocationScreen}
              options={{ title: '위치 수동 입력' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
