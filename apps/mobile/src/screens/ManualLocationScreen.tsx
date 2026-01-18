import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function ManualLocationScreen({ route, navigation }: any) {
  const { userMode } = route.params;
  const [inputMode, setInputMode] = useState<'text' | 'map'>('text');
  const [textInput, setTextInput] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.4563,
    longitude: 126.7052,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  
  const mapRef = useRef<MapView>(null);

  const parseTextInput = () => {
    // Try to parse as coordinates (lat, lng)
    const coordPattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
    const match = textInput.match(coordPattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLocation({ latitude: lat, longitude: lng });
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        Alert.alert('성공', '좌표가 설정되었습니다.');
      } else {
        Alert.alert('오류', '유효한 좌표 범위가 아닙니다.\n위도: -90~90, 경도: -180~180');
      }
    } else {
      // Treat as address (would need geocoding API in production)
      setLocation({ 
        latitude: mapRegion.latitude, 
        longitude: mapRegion.longitude,
        address: textInput 
      });
      Alert.alert(
        '주소 입력됨',
        '실제 서비스에서는 주소를 좌표로 변환합니다.\n현재는 지도 중심 좌표가 사용됩니다.'
      );
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (!location) {
      Alert.alert('오류', '위치를 먼저 선택하세요.');
      return;
    }

    // Navigate back with location data
    navigation.navigate('Home', {
      userMode,
      manualLocation: location,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              위치 설정
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {userMode === 'driver' ? '현재 택시 위치' : '목적지'} 입력
            </Text>
          </Card.Content>
        </Card>

        {/* Input Mode Selector */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <SegmentedButtons
              value={inputMode}
              onValueChange={(value) => setInputMode(value as 'text' | 'map')}
              buttons={[
                {
                  value: 'text',
                  label: '텍스트 입력',
                  icon: 'text',
                },
                {
                  value: 'map',
                  label: '지도 선택',
                  icon: 'map',
                },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Text Input Mode */}
        {inputMode === 'text' && (
          <Card style={styles.inputCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>
                주소 또는 좌표 입력
              </Text>
              <Text variant="bodySmall" style={styles.inputHint}>
                예시:
                {'\n'}• 주소: 인천공항 제1여객터미널
                {'\n'}• 좌표: 37.4563, 126.7052
              </Text>

              <TextInput
                label="위치 정보"
                value={textInput}
                onChangeText={setTextInput}
                mode="outlined"
                placeholder="주소 또는 '위도, 경도' 입력"
                style={styles.textInput}
                multiline
              />

              <Button
                mode="contained"
                onPress={parseTextInput}
                style={styles.parseButton}
                icon="check"
              >
                위치 설정
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Map Input Mode */}
        {inputMode === 'map' && (
          <Card style={styles.mapCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>
                지도에서 선택
              </Text>
              <Text variant="bodySmall" style={styles.inputHint}>
                지도를 탭하여 위치를 선택하세요
              </Text>

              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={mapRegion}
                  region={mapRegion}
                  onPress={handleMapPress}
                  onRegionChangeComplete={setMapRegion}
                >
                  {location && (
                    <Marker
                      coordinate={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }}
                      title={userMode === 'driver' ? '택시 위치' : '목적지'}
                    />
                  )}
                </MapView>
              </View>

              <Text variant="bodySmall" style={styles.mapHint}>
                💡 지도를 드래그하여 이동하고, 탭하여 선택하세요
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Current Location Display */}
        {location && (
          <Card style={styles.locationCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.locationTitle}>
                ✅ 선택된 위치
              </Text>
              <Text variant="bodyMedium" style={styles.locationText}>
                위도: {location.latitude.toFixed(6)}
              </Text>
              <Text variant="bodyMedium" style={styles.locationText}>
                경도: {location.longitude.toFixed(6)}
              </Text>
              {location.address && (
                <Text variant="bodyMedium" style={styles.locationText}>
                  주소: {location.address}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Confirm Button */}
        <Button
          mode="contained"
          onPress={handleConfirm}
          style={styles.confirmButton}
          contentStyle={styles.buttonContent}
          icon="check-circle"
          disabled={!location}
        >
          위치 확정
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          취소
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#2563eb',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#e0e7ff',
    marginTop: 4,
  },
  modeCard: {
    marginBottom: 16,
  },
  inputCard: {
    marginBottom: 16,
  },
  mapCard: {
    marginBottom: 16,
  },
  inputTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputHint: {
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  textInput: {
    marginBottom: 12,
  },
  parseButton: {
    backgroundColor: '#2563eb',
  },
  mapContainer: {
    height: 300,
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapHint: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  locationCard: {
    marginBottom: 16,
    backgroundColor: '#f0fdf4',
  },
  locationTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#15803d',
  },
  locationText: {
    marginBottom: 4,
    color: '#166534',
  },
  confirmButton: {
    marginBottom: 12,
    backgroundColor: '#059669',
  },
  cancelButton: {
    borderColor: '#666',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
