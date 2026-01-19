import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { matchAPI, instructionAPI, detectObjects, User, Match, DetectionResponse } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows, fonts } from '../theme';

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
      manualLocation?: { latitude: number; longitude: number };
    };
  };
}

export default function DriverDashboardScreen({ navigation, route }: Props) {
  const { user, match: initialMatch } = route.params;
  const [match, setMatch] = useState<Match>(initialMatch);
  const [gpsInput, setGpsInput] = useState({ latitude: '', longitude: '' });
  const [gpsSet, setGpsSet] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [instructionId, setInstructionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [instructionSent, setInstructionSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // 매칭 상태 폴링
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const checkMatchStatus = async () => {
        try {
          const latestMatch = await matchAPI.getMatch(match.id);
          if (!isActive) return;
          if (latestMatch.status === 'completed') {
            showAlert('운행 종료', '승객이 탑승을 완료했습니다.');
            navigation.replace('Matching', { user });
          } else {
            setMatch(latestMatch);
          }
        } catch (error) {
          showAlert('알림', '매칭이 종료되었습니다.');
          navigation.replace('Matching', { user });
        }
      };
      const interval = setInterval(checkMatchStatus, 3000);
      checkMatchStatus();
      return () => { isActive = false; clearInterval(interval); };
    }, [match.id, navigation, user])
  );

  useEffect(() => {
    if (match.driverLatitude && match.driverLongitude) {
      setGpsInput({
        latitude: match.driverLatitude.toString(),
        longitude: match.driverLongitude.toString(),
      });
      setGpsSet(true);
    }
  }, [match]);

  useEffect(() => {
    if (route.params?.manualLocation) {
      const { latitude, longitude } = route.params.manualLocation;
      setGpsInput({ latitude: String(latitude), longitude: String(longitude) });
    }
  }, [route.params?.manualLocation]);

  const handleSetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('권한 거부', '위치 정보 접근 권한이 필요합니다.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setGpsInput({ latitude: latitude.toString(), longitude: longitude.toString() });
      await matchAPI.updateGPS(match.id, user.id, 'driver', latitude, longitude);
      setMatch(await matchAPI.getMatch(match.id));
      setGpsSet(true);
      showAlert('성공', `현재 위치로 설정되었습니다.`);
    } catch (error) {
      showAlert('오류', '현재 위치를 가져오는데 실패했습니다.');
    }
  };

  const handleSetGPS = async () => {
    const lat = parseFloat(gpsInput.latitude);
    const lng = parseFloat(gpsInput.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showAlert('오류', '유효한 좌표를 입력해주세요.');
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setInstructionId(null);
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
      setInstructionId(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      showAlert('오류', '이미지를 먼저 선택해주세요.');
      return;
    }
    let latestMatch = match;
    try { latestMatch = await matchAPI.getMatch(match.id); setMatch(latestMatch); } catch (e) { }
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
      const instruction = await instructionAPI.create(
        match.id, response.instruction, response.detections, response.image_width, response.image_height
      );
      setInstructionId(instruction.id);
    } catch (error: any) {
      showAlert('분석 실패', error.message || '이미지 분석에 실패했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendInstruction = async () => {
    if (!instructionId) { showAlert('오류', '먼저 이미지를 분석해주세요.'); return; }
    setSending(true);
    try {
      await instructionAPI.send(instructionId);
      setInstructionSent(true);
      showAlert('전송 완료', '안내문이 승객에게 전송되었습니다.');
    } catch (error) {
      showAlert('오류', '안내문 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInstruction = () => {
    if (instructionId) { try { instructionAPI.cancel(instructionId); } catch (e) { } }
    setImageUri(null); setResult(null); setInstructionId(null);
  };

  const handleEndMatch = () => {
    showConfirm('매칭 종료', '매칭을 종료하시겠습니까?', async () => {
      try { await matchAPI.cancel(match.id); navigation.replace('Matching', { user }); }
      catch (error) { showAlert('오류', '매칭 종료에 실패했습니다.'); }
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarDriver}>
            <Text style={styles.avatarEmoji}>🚕</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{user.username}</Text>
            <Text style={styles.headerSubtitle}>승객: {match.passengerUsername}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>매칭됨</Text>
        </View>
      </View>

      {/* GPS Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📍</Text>
          <Text style={styles.sectionTitle}>GPS 위치 설정</Text>
        </View>

        <View style={styles.gpsInputRow}>
          <View style={styles.gpsInputContainer}>
            <Text style={styles.gpsLabel}>위도</Text>
            <TextInput
              style={[styles.gpsInput, focusedInput === 'lat' && styles.inputFocused]}
              value={gpsInput.latitude}
              onChangeText={(text) => setGpsInput({ ...gpsInput, latitude: text })}
              placeholder="37.4563"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              onFocus={() => setFocusedInput('lat')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          <View style={styles.gpsInputContainer}>
            <Text style={styles.gpsLabel}>경도</Text>
            <TextInput
              style={[styles.gpsInput, focusedInput === 'lng' && styles.inputFocused]}
              value={gpsInput.longitude}
              onChangeText={(text) => setGpsInput({ ...gpsInput, longitude: text })}
              placeholder="126.7052"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              onFocus={() => setFocusedInput('lng')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        <View style={styles.gpsButtonRow}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.gpsButtonSecondary}
              onPress={() => navigation.navigate('ManualLocation', { userMode: 'driver', returnScreen: 'DriverDashboard', user, match })}
              activeOpacity={0.85}
            >
              <Text style={styles.gpsButtonSecondaryText}>🗺 지도</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.gpsButtonPrimary} onPress={handleSetCurrentLocation} activeOpacity={0.85}>
            <Text style={styles.gpsButtonPrimaryText}>📍 현재 위치</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.gpsConfirmButton} onPress={handleSetGPS} activeOpacity={0.85}>
          <Text style={styles.gpsConfirmButtonText}>{gpsSet ? 'GPS 업데이트' : 'GPS 설정'}</Text>
        </TouchableOpacity>

        {gpsSet && (
          <View style={styles.gpsStatusBar}>
            <Text style={styles.gpsStatusText}>✓ {gpsInput.latitude}, {gpsInput.longitude}</Text>
          </View>
        )}
      </View>

      {/* Camera Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📷</Text>
          <Text style={styles.sectionTitle}>도로 주행 화면</Text>
        </View>

        <View style={styles.cameraButtonRow}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto} activeOpacity={0.85}>
            <Text style={styles.cameraButtonIcon}>📸</Text>
            <Text style={styles.cameraButtonText}>카메라</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage} activeOpacity={0.85}>
            <Text style={styles.cameraButtonIcon}>🖼</Text>
            <Text style={styles.cameraButtonText}>갤러리</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={[styles.analyzeButton, analyzing && styles.buttonDisabled]}
              onPress={handleAnalyze}
              disabled={analyzing}
              activeOpacity={0.85}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.analyzeButtonText}>이미지 분석</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Analysis Loading */}
      {analyzing && (
        <View style={styles.card}>
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>이미지 분석 중...</Text>
          </View>
        </View>
      )}

      {/* Result Section */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>분석 결과</Text>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{result.instruction}</Text>
          </View>

          {result.distance_meters && (
            <Text style={styles.distanceText}>
              거리: {result.distance_meters.toFixed(0)}m
            </Text>
          )}

          {!instructionSent ? (
            <View style={styles.resultButtonRow}>
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.buttonDisabled]}
                onPress={handleSendInstruction}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.sendButtonText}>안내문 전송</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelResultButton} onPress={handleCancelInstruction} activeOpacity={0.85}>
                <Text style={styles.cancelResultButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sentBadgeContainer}>
              <Text style={styles.sentBadgeText}>✓ 전송 완료</Text>
            </View>
          )}
        </View>
      )}

      {/* End Match Button */}
      <TouchableOpacity style={styles.endMatchButton} onPress={handleEndMatch} activeOpacity={0.7}>
        <Text style={styles.endMatchButtonText}>매칭 종료</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },

  // Header
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDriver: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.success,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
  },

  // GPS
  gpsInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gpsInputContainer: {
    flex: 1,
  },
  gpsLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  gpsInput: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  gpsButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gpsButtonSecondary: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsButtonSecondaryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  gpsButtonPrimary: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsButtonPrimaryText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  gpsConfirmButton: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  gpsConfirmButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  gpsStatusBar: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#E8F8EE',
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  gpsStatusText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '500',
  },

  // Camera
  cameraButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cameraButton: {
    flex: 1,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  cameraButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  imagePreviewContainer: {
    marginTop: spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  analyzeButton: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Loading
  loadingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Result
  instructionBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  distanceText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semiBold,
    marginBottom: spacing.md,
  },
  resultButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sendButton: {
    flex: 2,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  cancelResultButton: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelResultButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // End Match
  endMatchButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  endMatchButtonText: {
    ...typography.body,
    color: colors.error,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
  sentBadgeContainer: {
    backgroundColor: '#E8F8EE',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  sentBadgeText: {
    color: colors.success,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});