import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Card, Chip, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { detectObjects, DetectionResponse, GPSLocation } from '../services/api';

const CLASS_COLORS: Record<string, string> = {
  platform_sign: '#3b82f6',
  traffic_sign: '#eab308',
  traffic_light: '#ef4444',
  crosswalk: '#22c55e',
  vehicle: '#a855f7',
  pedestrian: '#ec4899',
};

const CLASS_NAMES: Record<string, string> = {
  platform_sign: '플랫폼 표지판',
  traffic_sign: '교통 표지판',
  traffic_light: '신호등',
  crosswalk: '횡단보도',
  vehicle: '차량',
  pedestrian: '보행자',
};

export default function ResultScreen({ route, navigation }: any) {
  const { imageUri, userMode, location } = route.params;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeImage();
  }, []);

  const analyzeImage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare GPS data based on user mode
      const driverLocation: GPSLocation | undefined =
        userMode === 'driver' && location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : undefined;

      const passengerLocation: GPSLocation | undefined =
        userMode === 'passenger' && location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : undefined;

      const response = await detectObjects({
        imageUri,
        userMode,
        driverLocation,
        passengerLocation,
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다');
      Alert.alert('오류', err.message || '분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const countByClass = React.useMemo(() => {
    if (!result) return {};
    return result.detections.reduce((acc, d) => {
      acc[d.class_name] = (acc[d.class_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [result]);

  const signsWithText = React.useMemo(() => {
    if (!result) return [];
    return result.detections.filter(
      (d) =>
        (d.class_name === 'platform_sign' || d.class_name === 'traffic_sign') &&
        d.ocr_text
    );
  }, [result]);

  const formatDistance = (meters?: number) => {
    if (!meters) return null;
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>이미지 분석 중...</Text>
          <Text style={styles.loadingSubtext}>
            YOLO 객체 감지, OCR 처리 및 GPS 계산 진행 중
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Button mode="contained" onPress={analyzeImage} style={styles.retryButton}>
            다시 시도
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()}>
            돌아가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Preview */}
        <Card style={styles.imageCard}>
          <Card.Cover source={{ uri: imageUri }} style={styles.image} />
        </Card>

        {/* GPS Info Card */}
        {(result.distance_meters || result.direction) && (
          <Card style={styles.gpsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.gpsTitle}>
                📍 위치 정보
              </Text>
              {result.distance_meters && (
                <View style={styles.gpsRow}>
                  <Text style={styles.gpsLabel}>거리:</Text>
                  <Text style={styles.gpsValue}>
                    {formatDistance(result.distance_meters)}
                  </Text>
                </View>
              )}
              {result.direction && (
                <View style={styles.gpsRow}>
                  <Text style={styles.gpsLabel}>방향:</Text>
                  <Text style={styles.gpsValue}>{result.direction}</Text>
                </View>
              )}

              {userMode === 'driver' && result.passenger_latitude && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="bodySmall" style={styles.coordsTitle}>
                    승객 위치 좌표:
                  </Text>
                  <Text style={styles.coords}>
                    {result.passenger_latitude.toFixed(6)}, {result.passenger_longitude?.toFixed(6)}
                  </Text>
                </>
              )}

              {userMode === 'passenger' && result.driver_latitude && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="bodySmall" style={styles.coordsTitle}>
                    기사 위치 좌표:
                  </Text>
                  <Text style={styles.coords}>
                    {result.driver_latitude.toFixed(6)}, {result.driver_longitude?.toFixed(6)}
                  </Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Instruction Card */}
        <Card style={styles.instructionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.instructionTitle}>
              🎯 {userMode === 'driver' ? '승객용 안내' : '이동 안내'}
            </Text>
            <Text variant="bodyLarge" style={styles.instructionText}>
              {result.instruction}
            </Text>
          </Card.Content>
        </Card>

        {/* Detection Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ✅ 감지 결과
            </Text>
            <View style={styles.chipsContainer}>
              {Object.entries(countByClass).map(([className, count]) => (
                <Chip
                  key={className}
                  style={[
                    styles.chip,
                    { backgroundColor: CLASS_COLORS[className] + '20' },
                  ]}
                  textStyle={{ color: CLASS_COLORS[className], fontWeight: 'bold' }}
                >
                  {CLASS_NAMES[className]}: {count}
                </Chip>
              ))}
            </View>
            <Text style={styles.totalText}>
              총 {result.detections.length}개 객체 감지
            </Text>
          </Card.Content>
        </Card>

        {/* Detected Signs */}
        {signsWithText.length > 0 && (
          <Card style={styles.signsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                🔢 인식된 표지판 숫자
              </Text>
              {signsWithText.map((sign, idx) => (
                <View key={idx} style={styles.signItem}>
                  <View style={styles.signInfo}>
                    <Text style={styles.signName}>
                      {CLASS_NAMES[sign.class_name]}
                    </Text>
                    <Text style={styles.signConfidence}>
                      신뢰도: {(sign.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={styles.signNumber}>{sign.ocr_text}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Camera', { userMode, location })}
            style={styles.actionButton}
            icon="camera"
          >
            다시 촬영
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Home', { userMode })}
            style={styles.actionButton}
          >
            홈으로
          </Button>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginBottom: 12,
  },
  imageCard: {
    marginBottom: 16,
  },
  image: {
    height: 250,
  },
  gpsCard: {
    marginBottom: 16,
    backgroundColor: '#f0f9ff',
  },
  gpsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0369a1',
  },
  gpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gpsLabel: {
    fontSize: 16,
    color: '#0c4a6e',
    fontWeight: '600',
  },
  gpsValue: {
    fontSize: 16,
    color: '#0369a1',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  coordsTitle: {
    color: '#0c4a6e',
    marginBottom: 4,
  },
  coords: {
    fontSize: 12,
    color: '#0369a1',
    fontFamily: 'monospace',
  },
  instructionCard: {
    marginBottom: 16,
    backgroundColor: '#2563eb',
  },
  instructionTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: '#ffffff',
    lineHeight: 24,
  },
  summaryCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 14,
    color: '#666',
  },
  signsCard: {
    marginBottom: 16,
  },
  signItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  signInfo: {
    flex: 1,
  },
  signName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  signConfidence: {
    fontSize: 12,
    color: '#666',
  },
  signNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  buttonContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
});
