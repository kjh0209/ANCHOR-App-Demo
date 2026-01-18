import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, Card, Button, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModeSelectionScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              사용자 선택
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              서비스 이용 유형을 선택하세요
            </Text>
          </Card.Content>
        </Card>

        {/* Driver Mode */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.modeTitle}>
              🚕 택시 기사 모드
            </Text>
            <Text variant="bodyMedium" style={styles.modeDescription}>
              현재 위치를 자동으로 감지하고, 카메라로 주변 환경을 촬영하여 승객에게 정확한 픽업 위치를 안내합니다.
            </Text>

            <View style={styles.featureList}>
              <List.Item
                title="실시간 GPS 위치 추적"
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                titleStyle={styles.featureText}
              />
              <List.Item
                title="주변 환경 자동 분석"
                left={(props) => <List.Icon {...props} icon="camera" />}
                titleStyle={styles.featureText}
              />
              <List.Item
                title="승객용 안내 문구 자동 생성"
                left={(props) => <List.Icon {...props} icon="message-text" />}
                titleStyle={styles.featureText}
              />
            </View>

            <Button
              mode="contained"
              onPress={() => navigation.navigate('Home', { userMode: 'driver' })}
              style={styles.selectButton}
              contentStyle={styles.buttonContent}
              icon="taxi"
            >
              택시 기사로 시작
            </Button>
          </Card.Content>
        </Card>

        {/* Passenger Mode */}
        <Card style={styles.modeCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.modeTitle}>
              🧳 승객 모드
            </Text>
            <Text variant="bodyMedium" style={styles.modeDescription}>
              현재 위치 또는 목적지를 설정하여 택시 기사에게 정확한 픽업 위치를 요청합니다.
            </Text>

            <View style={styles.featureList}>
              <List.Item
                title="현재 위치 자동 감지"
                left={(props) => <List.Icon {...props} icon="crosshairs-gps" />}
                titleStyle={styles.featureText}
              />
              <List.Item
                title="목적지 수동 입력 (주소/좌표)"
                left={(props) => <List.Icon {...props} icon="map-search" />}
                titleStyle={styles.featureText}
              />
              <List.Item
                title="지도에서 위치 선택"
                left={(props) => <List.Icon {...props} icon="map-marker-plus" />}
                titleStyle={styles.featureText}
              />
            </View>

            <Button
              mode="contained"
              onPress={() => navigation.navigate('Home', { userMode: 'passenger' })}
              style={[styles.selectButton, styles.passengerButton]}
              contentStyle={styles.buttonContent}
              icon="account"
            >
              승객으로 시작
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="bodySmall" style={styles.infoText}>
              ℹ️ 모드는 언제든지 변경할 수 있습니다
            </Text>
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
    marginBottom: 20,
    backgroundColor: '#2563eb',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e0e7ff',
  },
  modeCard: {
    marginBottom: 16,
  },
  modeTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modeDescription: {
    marginBottom: 16,
    lineHeight: 22,
    color: '#666',
  },
  featureList: {
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: '#2563eb',
  },
  passengerButton: {
    backgroundColor: '#059669',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
  },
  infoText: {
    color: '#0369a1',
    textAlign: 'center',
  },
});
