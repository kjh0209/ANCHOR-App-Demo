import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function ManualLocationScreen({ route, navigation }: any) {
  const { userMode, returnScreen, user, match } = route.params;
  const [inputMode, setInputMode] = useState<'text' | 'map'>('text');
  const [textInput, setTextInput] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.4563,
    longitude: 126.7052,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<MapView>(null);

  // 화면 진입 시 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (Platform.OS !== 'web') {
            Alert.alert('권한 거부', '위치 정보 접근 권한이 필요합니다.');
          }
          return;
        }

        // 초기 로딩 시에도 Balanced 정확도 사용
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const { latitude, longitude } = location.coords;

        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        
      } catch (error) {
        console.log('Error getting location:', error);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handleMoveToCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 거부', '위치 정보 접근 권한이 필요합니다.');
        return;
      }

      // 먼저 마지막으로 알려진 위치 시도 (빠름)
      let location = await Location.getLastKnownPositionAsync({});
      
      // 없으면 현재 위치 가져오기 (정확도 Balanced로 설정하여 속도 개선)
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const parseTextInput = async () => {
    // 1. 좌표 직접 입력 패턴 확인 (37.xxx, 127.xxx)
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
      return;
    } 
    
    // 2. 주소 지오코딩 시도
    if (!textInput.trim()) {
      Alert.alert('오류', '주소 또는 좌표를 입력해주세요.');
      return;
    }

    try {
      setLoadingLocation(true);
      const geocodedLocation = await Location.geocodeAsync(textInput);
      
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        setLocation({ latitude, longitude, address: textInput });
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        Alert.alert('성공', `위치를 찾았습니다.\n위도: ${latitude}, 경도: ${longitude}`);
      } else {
        Alert.alert('실패', '해당 주소의 위치를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '주소 변환 중 오류가 발생했습니다.\n(웹 환경에서는 지원되지 않을 수 있습니다)');
    } finally {
      setLoadingLocation(false);
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

    if (returnScreen) {
      navigation.navigate(returnScreen, {
        userMode,
        manualLocation: location,
        user,  // Pass back user
        match, // Pass back match
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              위치 설정 (모바일)
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {userMode === 'driver' ? '현재 택시 위치' : '목적지'}
            </Text>
          </Card.Content>
        </Card>

        {loadingLocation && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator animating={true} color="#2563eb" />
            <Text style={{ marginTop: 10, color: '#666' }}>현재 위치를 찾는 중...</Text>
          </View>
        )}

        {!loadingLocation && (
          <Card style={styles.modeCard}>
            <Card.Content>
              <SegmentedButtons
                value={inputMode}
                onValueChange={(value) => setInputMode(value as 'text' | 'map')}
                buttons={[
                  { value: 'text', label: '텍스트 입력', icon: 'text' },
                  { value: 'map', label: '지도 선택', icon: 'map' },
                ]}
              />
            </Card.Content>
          </Card>
        )}

        {!loadingLocation && inputMode === 'text' && (
          <Card style={styles.inputCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>주소 또는 좌표 입력</Text>
              <Text variant="bodySmall" style={styles.inputHint}>예시: 인천공항 제1여객터미널 / 37.4563, 126.7052</Text>
              <TextInput
                label="위치 정보"
                value={textInput}
                onChangeText={setTextInput}
                mode="outlined"
                placeholder="주소 입력"
                style={styles.textInput}
                multiline
              />
              <Button mode="contained" onPress={parseTextInput} style={styles.parseButton} icon="check">위치 설정</Button>
            </Card.Content>
          </Card>
        )}

        {!loadingLocation && inputMode === 'map' && (
          <Card style={styles.mapCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>지도에서 선택</Text>
              <Button mode="outlined" onPress={handleMoveToCurrentLocation} style={{ marginBottom: 10 }} icon="crosshairs-gps">현재 위치로 지도 이동</Button>
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={mapRegion}
                  onPress={handleMapPress}
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
              <Text variant="bodySmall" style={styles.mapHint}>지도를 탭하여 위치를 선택하세요</Text>
            </Card.Content>
          </Card>
        )}

        {location && (
          <Card style={styles.locationCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.locationTitle}>✅ 선택된 위치</Text>
              <Text variant="bodyMedium" style={styles.locationText}>위도: {location.latitude.toFixed(6)}</Text>
              <Text variant="bodyMedium" style={styles.locationText}>경도: {location.longitude.toFixed(6)}</Text>
              {location.address && <Text variant="bodyMedium" style={styles.locationText}>주소: {location.address}</Text>}
            </Card.Content>
          </Card>
        )}

        <Button mode="contained" onPress={handleConfirm} style={styles.confirmButton} contentStyle={styles.buttonContent} icon="check-circle" disabled={!location}>위치 확정</Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.cancelButton}>취소</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 16 },
  headerCard: { marginBottom: 16, backgroundColor: '#2563eb' },
  title: { color: '#ffffff', fontWeight: 'bold' },
  subtitle: { color: '#e0e7ff', marginTop: 4 },
  modeCard: { marginBottom: 16 },
  inputCard: { marginBottom: 16 },
  mapCard: { marginBottom: 16 },
  inputTitle: { fontWeight: 'bold', marginBottom: 8 },
  inputHint: { color: '#666', marginBottom: 12, lineHeight: 20 },
  textInput: { marginBottom: 12 },
  parseButton: { backgroundColor: '#2563eb' },
  mapContainer: { height: 300, marginVertical: 12, borderRadius: 8, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  mapHint: { color: '#666', textAlign: 'center', marginTop: 8 },
  locationCard: { marginBottom: 16, backgroundColor: '#f0fdf4' },
  locationTitle: { fontWeight: 'bold', marginBottom: 12, color: '#15803d' },
  locationText: { marginBottom: 4, color: '#166534' },
  confirmButton: { marginBottom: 12, backgroundColor: '#059669' },
  cancelButton: { borderColor: '#666' },
  buttonContent: { paddingVertical: 8 },
});