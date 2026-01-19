import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  TextInput,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { matchAPI, instructionAPI, User, Match, Instruction } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { colors, spacing, borderRadius, typography, shadows, fonts } from '../theme';

// 웹 호환 Confirm
const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = '확인') => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
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

export default function PassengerWaitScreen({ navigation, route }: Props) {
  const { user, match: initialMatch } = route.params;
  const [match, setMatch] = useState<Match>(initialMatch);
  const [gpsInput, setGpsInput] = useState({ latitude: '', longitude: '' });
  const [gpsSet, setGpsSet] = useState(false);
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [checking, setChecking] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (match.passengerLatitude && match.passengerLongitude) {
      setGpsInput({
        latitude: match.passengerLatitude.toString(),
        longitude: match.passengerLongitude.toString(),
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

  const checkStatusAndInstruction = useCallback(async () => {
    if (!match?.id) return;
    try {
      const latestMatch = await matchAPI.getMatch(match.id);
      if (!latestMatch || latestMatch.status === 'none') {
        throw new Error('Match deleted');
      }
      setMatch(latestMatch);
      const result = await instructionAPI.getPending(match.id);
      if (result && 'content' in result && result.sentToPassenger) {
        setInstruction(result as Instruction);
      }
    } catch (error) {
      showAlert('알림', '매칭이 종료되었거나 취소되었습니다.');
      navigation.replace('Matching', { user });
    }
  }, [match?.id, navigation, user]);

  useFocusEffect(
    useCallback(() => {
      checkStatusAndInstruction();
      const interval = setInterval(checkStatusAndInstruction, 3000);
      return () => clearInterval(interval);
    }, [checkStatusAndInstruction])
  );

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
      await matchAPI.updateGPS(match.id, user.id, 'passenger', latitude, longitude);
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
      const updated = await matchAPI.updateGPS(match.id, user.id, 'passenger', lat, lng);
      setMatch(updated);
      setGpsSet(true);
      showAlert('성공', 'GPS 좌표가 설정되었습니다.');
    } catch (error) {
      showAlert('오류', 'GPS 설정에 실패했습니다.');
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    await checkStatusAndInstruction();
    setChecking(false);
  };

  const handleCompleteMatch = () => {
    showConfirm('탑승 완료', '기사님 차량에 탑승하셨습니까?\n매칭을 종료합니다.', async () => {
      try {
        await matchAPI.complete(match.id);
        navigation.replace('Matching', { user });
      } catch (error) {
        showAlert('오류', '탑승 완료 처리에 실패했습니다.');
      }
    }, '탑승 완료');
  };

  const handleEndMatch = () => {
    showConfirm('매칭 종료', '매칭을 종료(취소)하시겠습니까?', async () => {
      try {
        await matchAPI.cancel(match.id);
        navigation.replace('Matching', { user });
      } catch (error) {
        showAlert('오류', '매칭 종료에 실패했습니다.');
      }
    }, '매칭 종료');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPassenger}>
            <Text style={styles.avatarEmoji}>✈️</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{user.username}</Text>
            <Text style={styles.headerSubtitle}>기사: {match.driverUsername}</Text>
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
          <Text style={styles.sectionTitle}>내 위치 설정</Text>
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
              onPress={() => navigation.navigate('ManualLocation', { userMode: 'passenger', returnScreen: 'PassengerWait', user, match })}
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

      {/* Instruction Section */}
      <View style={[styles.card, instruction && styles.instructionCardActive]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{instruction ? '✅' : '📨'}</Text>
          <Text style={styles.sectionTitle}>안내문</Text>
          {instruction && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {instruction ? (
          <View>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>{instruction.content}</Text>
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteMatch} activeOpacity={0.85}>
              <Text style={styles.completeButtonText}>탑승 완료</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingSection}>
            <View style={styles.waitingIndicator}>
              {checking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.waitingEmoji}>📨</Text>
              )}
            </View>
            <Text style={styles.waitingTitle}>기사님의 안내문을 기다리고 있습니다</Text>
            <Text style={styles.waitingSubtitle}>
              기사가 주행 화면을 분석하고 안내문을 전송하면{'\n'}이곳에 표시됩니다.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={checking} activeOpacity={0.7}>
              <Text style={styles.refreshButtonText}>{checking ? '확인 중...' : '새로고침'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Driver Location */}
      {match.driverLatitude && match.driverLongitude && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🚕</Text>
            <Text style={styles.sectionTitle}>기사 위치</Text>
          </View>
          <View style={styles.driverLocationBox}>
            <Text style={styles.driverLocationText}>
              위도: {Number(match.driverLatitude).toFixed(6)}
            </Text>
            <Text style={styles.driverLocationText}>
              경도: {Number(match.driverLongitude).toFixed(6)}
            </Text>
          </View>
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
  avatarPassenger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
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
  instructionCardActive: {
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
    flex: 1,
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
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

  // Waiting
  waitingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  waitingIndicator: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  waitingEmoji: {
    fontSize: 32,
  },
  waitingTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  waitingSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  refreshButtonText: {
    ...typography.body,
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },

  // Instruction
  instructionBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  instructionText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  completeButton: {
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  completeButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },

  // Driver Location
  driverLocationBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  driverLocationText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
});
