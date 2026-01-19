import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Card, Button, List, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen({ route, navigation }: any) {
  const { userMode = 'driver', manualLocation } = route.params || {};
  const [hasPermission, setHasPermission] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(manualLocation || null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (manualLocation) {
      setSelectedLocation(manualLocation);
    }
  }, [manualLocation]);

  const getCurrentLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert('권한 필요', '위치 권한을 허용해주세요.');
      return;
    }

    setLoadingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('성공', '현재 위치가 설정되었습니다.');
    } catch (error) {
      Alert.alert('오류', 'GPS 위치를 가져올 수 없습니다.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleTakePhoto = () => {
    if (userMode === 'driver' && !currentLocation && !selectedLocation) {
      Alert.alert(
        'GPS 필요',
        '택시 기사 모드에서는 현재 위치 정보가 필요합니다.\nGPS를 먼저 활성화하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: 'GPS 활성화', onPress: getCurrentLocation },
        ]
      );
      return;
    }
    navigation.navigate('Camera', { 
      userMode, 
      location: selectedLocation || currentLocation?.coords 
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      navigation.navigate('Result', { 
        imageUri: result.assets[0].uri,
        userMode,
        location: selectedLocation || currentLocation?.coords
      });
    }
  };

  const handleManualLocation = () => {
    navigation.navigate('ManualLocation', { userMode });
  };

  const handleChangeMode = () => {
    navigation.navigate('ModeSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text variant="headlineMedium" style={styles.title}>
                  🛬 공항 픽업 안내
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {userMode === 'driver' ? '🚕 택시 기사 모드' : '🧳 승객 모드'}
                </Text>
              </View>
              <Chip
                mode="outlined"
                onPress={handleChangeMode}
                style={styles.modeChip}
                textStyle={styles.modeChipText}
              >
                모드 변경
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* GPS Status Card */}
        <Card style={styles.gpsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.gpsTitle}>
              📍 위치 정보
            </Text>

            {selectedLocation ? (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  ✅ 위도: {selectedLocation.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  ✅ 경도: {selectedLocation.longitude.toFixed(6)}
                </Text>
                {selectedLocation.address && (
                  <Text style={styles.locationText}>
                    📍 주소: {selectedLocation.address}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.noLocationText}>
                ⚠️ 위치 정보 없음
              </Text>
            )}

            <View style={styles.gpsButtons}>
              <Button
                mode="contained"
                onPress={getCurrentLocation}
                style={styles.gpsButton}
                icon="crosshairs-gps"
                disabled={!hasLocationPermission || loadingLocation}
                loading={loadingLocation}
              >
                현재 위치
              </Button>
              <Button
                mode="outlined"
                onPress={handleManualLocation}
                style={styles.gpsButton}
                icon="map-marker-plus"
              >
                수동 입력
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleTakePhoto}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            icon="camera"
            disabled={!hasPermission}
          >
            주행 화면 촬영
          </Button>

          <Button
            mode="outlined"
            onPress={handlePickImage}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            icon="image"
          >
            갤러리에서 선택
          </Button>
        </View>

        {(!hasPermission || !hasLocationPermission) && (
          <Card style={styles.warningCard}>
            <Card.Content>
              {!hasPermission && (
                <Text style={styles.warningText}>
                  ⚠️ 카메라 권한이 필요합니다
                </Text>
              )}
              {!hasLocationPermission && (
                <Text style={styles.warningText}>
                  ⚠️ 위치 권한이 필요합니다 (GPS 기능용)
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Features */}
        <Card style={styles.featuresCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.featuresTitle}>
              {userMode === 'driver' ? '기사 모드 기능' : '승객 모드 기능'}
            </Text>

            {userMode === 'driver' ? (
              <>
                <List.Item
                  title="GPS 실시간 위치 추적"
                  description="현재 택시 위치를 자동으로 파악합니다"
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  titleStyle={styles.listTitle}
                />
                <List.Item
                  title="YOLOv8 객체 감지"
                  description="표지판, 신호등, 횡단보도 등을 인식합니다"
                  left={(props) => <List.Icon {...props} icon="eye" />}
                  titleStyle={styles.listTitle}
                />
                <List.Item
                  title="승객용 안내 생성"
                  description="위치와 주변 환경 기반 픽업 안내를 생성합니다"
                  left={(props) => <List.Icon {...props} icon="message-text" />}
                  titleStyle={styles.listTitle}
                />
              </>
            ) : (
              <>
                <List.Item
                  title="목적지 설정"
                  description="현재 위치 또는 수동으로 목적지를 입력합니다"
                  left={(props) => <List.Icon {...props} icon="map-search" />}
                  titleStyle={styles.listTitle}
                />
                <List.Item
                  title="주변 환경 분석"
                  description="목적지 주변의 표지판과 랜드마크를 확인합니다"
                  left={(props) => <List.Icon {...props} icon="image-search" />}
                  titleStyle={styles.listTitle}
                />
                <List.Item
                  title="거리 계산"
                  description="기사 위치와의 거리를 계산하여 안내합니다"
                  left={(props) => <List.Icon {...props} icon="map-marker-distance" />}
                  titleStyle={styles.listTitle}
                />
              </>
            )}
          </Card.Content>
        </Card>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e0e7ff',
    fontSize: 16,
  },
  modeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#ffffff',
  },
  modeChipText: {
    color: '#ffffff',
  },
  gpsCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  gpsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationInfo: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  noLocationText: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  gpsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  gpsButton: {
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  primaryButton: {
    marginBottom: 12,
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    borderColor: '#2563eb',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#fef2f2',
  },
  warningText: {
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 4,
  },
  featuresCard: {
    marginBottom: 20,
  },
  featuresTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  listTitle: {
    fontWeight: '600',
  },
});
