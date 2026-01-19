import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image, Platform } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

import { matchAPI, instructionAPI, detectObjects, User, Match, DetectionResponse } from '../services/api';

// 웹 호환 Alert
const showAlert = (title: string, message: string, onPress?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onPress) onPress();
  } else {
    Alert.alert(title, message, onPress ? [{ text: '확인', onPress }] : undefined);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '종료', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

interface Props {
  navigation: any;
  route: {
    params: {
      user: User;
      match: Match;
    };
  };
}

export default function DriverDashboardScreen({ navigation, route }: Props) {
  const { user, match: initialMatch } = route.params;
  const [match, setMatch] = useState<Match>(initialMatch);
  const [gpsInput, setGpsInput] = useState({
    latitude: '',
    longitude: '',
  });
  const [gpsSet, setGpsSet] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [instructionId, setInstructionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // 매칭 상태 폴링 (승객이 탑승 완료했는지 확인)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkMatchStatus = async () => {
        try {
          const latestMatch = await matchAPI.getMatch(match.id);
          
          if (!isActive) return;

          // 매칭이 종료되었거나(completed) 
          if (latestMatch.status === 'completed') {
            if (Platform.OS === 'web') {
              window.alert('승객이 탑승을 완료했습니다.\n운행을 종료합니다.');
            } else {
              Alert.alert('운행 종료', '승객이 탑승을 완료했습니다.');
            }
            navigation.replace('Matching', { user });
          } else {
            // 위치 정보 등 업데이트
            setMatch(latestMatch);
          }
        } catch (error) {
          // 매칭이 삭제된 경우 (404 등) - 승객이 매칭 취소 시
          if (Platform.OS === 'web') {
            window.alert('매칭이 종료되었습니다.');
          } else {
            Alert.alert('알림', '매칭이 종료되었습니다.');
          }
          navigation.replace('Matching', { user });
        }
      };

      const interval = setInterval(checkMatchStatus, 3000); // 3초마다 확인
      checkMatchStatus(); // 진입 시 즉시 1회 실행

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [match.id, navigation, user])
  );

  useEffect(() => {
    // 기존 GPS 정보가 있으면 표시
    if (match.driverLatitude && match.driverLongitude) {
      setGpsInput({
        latitude: match.driverLatitude.toString(),
        longitude: match.driverLongitude.toString(),
      });
      setGpsSet(true);
    }
  }, [match]);

  const handleSetGPS = async () => {
    const lat = parseFloat(gpsInput.latitude);
    const lng = parseFloat(gpsInput.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      showAlert('오류', '유효한 좌표를 입력해주세요.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showAlert('오류', '좌표 범위가 올바르지 않습니다.');
      return;
    }

    try {
      const updated = await matchAPI.updateGPS(match.id, user.id, 'driver', lat, lng);
      setMatch(updated);
      setGpsSet(true);
      showAlert('성공', 'GPS 좌표가 설정되었습니다.');
    } catch (error) {
      showAlert('오류', 'GPS 설정에 실패했습니다.');
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setInstructionId(null);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      showAlert('알림', '웹에서는 갤러리 선택만 가능합니다.');
      handlePickImage();
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setInstructionId(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      if (Platform.OS === 'web') {
        window.alert('오류: 이미지를 먼저 선택해주세요.');
      } else {
        Alert.alert('오류', '이미지를 먼저 선택해주세요.');
      }
      return;
    }

    // 매칭 정보 다시 조회해서 승객 GPS 확인
    let latestMatch = match;
    try {
      latestMatch = await matchAPI.getMatch(match.id);
      setMatch(latestMatch);
    } catch (e) {
      // 무시하고 진행
    }

    setAnalyzing(true);
    try {
      const response = await detectObjects({
        imageUri,
        userMode: 'driver',
        driverLocation: match.driverLatitude && match.driverLongitude
          ? { latitude: Number(match.driverLatitude), longitude: Number(match.driverLongitude) }
          : undefined,
        passengerLocation: latestMatch.passengerLatitude && latestMatch.passengerLongitude
          ? { latitude: Number(latestMatch.passengerLatitude), longitude: Number(latestMatch.passengerLongitude) }
          : undefined,
      });

      setResult(response);

      // 안내문 DB에 저장 (아직 전송 안함)
      const instruction = await instructionAPI.create(
        match.id,
        response.instruction,
        response.detections,
        response.image_width,
        response.image_height
      );
      setInstructionId(instruction.id);

    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(`분석 실패: ${error.message || '이미지 분석에 실패했습니다.'}`);
      } else {
        Alert.alert('분석 실패', error.message || '이미지 분석에 실패했습니다.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendInstruction = async () => {
    if (!instructionId) {
      showAlert('오류', '먼저 이미지를 분석해주세요.');
      return;
    }

    setSending(true);
    try {
      await instructionAPI.send(instructionId);
      showAlert('전송 완료', '안내문이 승객에게 전송되었습니다.', () => {
        setImageUri(null);
        setResult(null);
        setInstructionId(null);
      });
    } catch (error) {
      showAlert('오류', '안내문 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInstruction = async () => {
    if (instructionId) {
      try {
        await instructionAPI.cancel(instructionId);
      } catch (error) {
        // 무시
      }
    }
    setImageUri(null);
    setResult(null);
    setInstructionId(null);
  };

  const handleEndMatch = () => {
    showConfirm(
      '매칭 종료',
      '매칭을 종료하시겠습니까?',
      async () => {
        try {
          await matchAPI.cancel(match.id);
          navigation.replace('Matching', { user });
        } catch (error) {
          if (Platform.OS === 'web') {
            window.alert('오류: 매칭 종료에 실패했습니다.');
          } else {
            Alert.alert('오류', '매칭 종료에 실패했습니다.');
          }
        }
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 매칭 정보 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium">🚕 기사: {user.username}</Text>
            <Chip mode="flat" compact>매칭됨</Chip>
          </View>
          <Text variant="bodyMedium" style={styles.matchInfo}>
            승객: {match.passengerUsername}
          </Text>
        </Card.Content>
      </Card>

      {/* GPS 설정 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📍 GPS 위치 설정 (기사)
          </Text>
          <View style={styles.gpsRow}>
            <TextInput
              label="위도"
              value={gpsInput.latitude}
              onChangeText={(text) => setGpsInput({ ...gpsInput, latitude: text })}
              style={styles.gpsInput}
              mode="outlined"
              keyboardType="numeric"
              placeholder="37.4563"
            />
            <TextInput
              label="경도"
              value={gpsInput.longitude}
              onChangeText={(text) => setGpsInput({ ...gpsInput, longitude: text })}
              style={styles.gpsInput}
              mode="outlined"
              keyboardType="numeric"
              placeholder="126.7052"
            />
          </View>
          <Button mode="contained" onPress={handleSetGPS} style={styles.gpsButton}>
            {gpsSet ? 'GPS 업데이트' : 'GPS 설정'}
          </Button>
          {gpsSet && (
            <Text style={styles.gpsStatus}>
              ✅ 설정됨: {gpsInput.latitude}, {gpsInput.longitude}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* 이미지 촬영/선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📷 도로 주행 화면
          </Text>
          <View style={styles.imageButtons}>
            <Button mode="outlined" onPress={handleTakePhoto} style={styles.imageButton}>
              카메라 촬영
            </Button>
            <Button mode="outlined" onPress={handlePickImage} style={styles.imageButton}>
              갤러리 선택
            </Button>
          </View>

          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <Button
                mode="contained"
                onPress={handleAnalyze}
                loading={analyzing}
                disabled={analyzing}
                style={styles.analyzeButton}
              >
                이미지 분석
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 분석 결과 */}
      {analyzing && (
        <Card style={styles.card}>
          <Card.Content style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>이미지 분석 중...</Text>
          </Card.Content>
        </Card>
      )}

      {result && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              📋 분석 결과
            </Text>

            <Divider style={styles.divider} />

            <Text variant="bodyLarge" style={styles.instruction}>
              {result.instruction}
            </Text>

            {result.distance_meters && (
              <Text style={styles.distanceInfo}>
                거리: {result.distance_meters.toFixed(0)}m | 방향: {result.direction}
              </Text>
            )}

            <Divider style={styles.divider} />

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleSendInstruction}
                loading={sending}
                disabled={sending}
                style={[styles.actionButton, styles.sendButton]}
              >
                안내문 전송
              </Button>
              <Button
                mode="outlined"
                onPress={handleCancelInstruction}
                disabled={sending}
                style={styles.actionButton}
              >
                취소
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <Button mode="text" onPress={handleEndMatch} style={styles.endButton} textColor="#ef4444">
        매칭 종료
      </Button>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchInfo: {
    marginTop: 8,
    color: '#666',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gpsInput: {
    flex: 1,
  },
  gpsButton: {
    marginTop: 12,
  },
  gpsStatus: {
    marginTop: 8,
    color: '#22c55e',
    textAlign: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  imagePreview: {
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  analyzeButton: {
    marginTop: 12,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  instruction: {
    lineHeight: 24,
    color: '#333',
  },
  distanceInfo: {
    marginTop: 8,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#22c55e',
  },
  endButton: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});