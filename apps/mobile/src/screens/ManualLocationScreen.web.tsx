import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function ManualLocationScreen({ route, navigation }: any) {
  const { userMode, returnScreen, user, match } = route.params;
  const [inputMode, setInputMode] = useState<'text'>('text');
  const [textInput, setTextInput] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    // 웹에서는 초기 위치 로딩을 굳이 하지 않음 (브라우저 권한 팝업이 UX를 해칠 수 있음)
    // 필요하다면 버튼으로 실행
  }, []);

  const parseTextInput = async () => {
    const coordPattern = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/;
    const match = textInput.match(coordPattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLocation({ latitude: lat, longitude: lng });
        if(Platform.OS === 'web') window.alert('좌표가 설정되었습니다.');
      } else {
        if(Platform.OS === 'web') window.alert('유효한 좌표 범위가 아닙니다.');
      }
      return;
    }

    if (!textInput.trim()) {
      if(Platform.OS === 'web') window.alert('주소 또는 좌표를 입력해주세요.');
      return;
    }

    // 웹에서 지오코딩 시도 (API 키 없으면 실패할 수 있음)
    try {
      setLoadingLocation(true);
      const geocodedLocation = await Location.geocodeAsync(textInput);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        setLocation({ latitude, longitude, address: textInput });
        if(Platform.OS === 'web') window.alert(`위치를 찾았습니다.\n위도: ${latitude}, 경도: ${longitude}`);
      } else {
        if(Platform.OS === 'web') window.alert('해당 주소의 위치를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error(error);
      if(Platform.OS === 'web') window.alert('주소 변환에 실패했습니다. (웹에서는 좌표 직접 입력을 권장합니다)');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!location) {
      if(Platform.OS === 'web') window.alert('위치를 먼저 설정하세요.');
      return;
    }

    if (returnScreen) {
      navigation.navigate(returnScreen, {
        manualLocation: location,
        userMode,
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
            <Text variant="titleLarge" style={styles.title}>위치 설정 (웹)</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>{userMode === 'driver' ? '현재 택시 위치' : '목적지'} 입력</Text>
          </Card.Content>
        </Card>

        {loadingLocation && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator animating={true} color="#2563eb" />
            <Text style={{ marginTop: 10, color: '#666' }}>처리 중...</Text>
          </View>
        )}

        {!loadingLocation && (
          <Card style={styles.inputCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.inputTitle}>주소 또는 좌표 입력</Text>
              <Text variant="bodySmall" style={styles.inputHint}>웹에서는 지도 기능이 제한됩니다. 좌표나 주소를 직접 입력해주세요.</Text>
              <Text variant="bodySmall" style={styles.inputHint}>예시: 37.4563, 126.7052</Text>
              <TextInput
                label="위치 정보"
                value={textInput}
                onChangeText={setTextInput}
                mode="outlined"
                placeholder="주소 또는 '위도, 경도' 입력"
                style={styles.textInput}
                multiline
              />
              <Button mode="contained" onPress={parseTextInput} style={styles.parseButton} icon="check">위치 설정</Button>
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
  inputCard: { marginBottom: 16 },
  inputTitle: { fontWeight: 'bold', marginBottom: 8 },
  inputHint: { color: '#666', marginBottom: 12, lineHeight: 20 },
  textInput: { marginBottom: 12 },
  parseButton: { backgroundColor: '#2563eb' },
  locationCard: { marginBottom: 16, backgroundColor: '#f0fdf4' },
  locationTitle: { fontWeight: 'bold', marginBottom: 12, color: '#15803d' },
  locationText: { marginBottom: 4, color: '#166534' },
  confirmButton: { marginBottom: 12, backgroundColor: '#059669' },
  cancelButton: { borderColor: '#666' },
  buttonContent: { paddingVertical: 8 },
  modeCard: { marginBottom: 16 },
});