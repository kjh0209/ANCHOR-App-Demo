import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { matchAPI, User, Match } from '../services/api';
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
      { text: '아니오', style: 'cancel' },
      { text: '예', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

interface Props {
  navigation: any;
  route: {
    params: {
      user: User;
    };
  };
}

export default function MatchingScreen({ navigation, route }: Props) {
  const { user } = route.params;
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const checkMatchStatus = useCallback(async () => {
    try {
      const status = await matchAPI.getStatus(user.id, user.role);
      if (status && status.status !== 'none') {
        setMatch(status);
        if (status.status === 'matched') {
          if (user.role === 'driver') {
            navigation.replace('DriverDashboard', { user, match: status });
          } else {
            navigation.replace('PassengerWait', { user, match: status });
          }
        }
      }
    } catch (error) {
      console.error('Failed to check match status:', error);
    } finally {
      setChecking(false);
    }
  }, [user, navigation]);

  useFocusEffect(
    useCallback(() => {
      checkMatchStatus();
      const interval = setInterval(checkMatchStatus, 3000);
      return () => clearInterval(interval);
    }, [checkMatchStatus])
  );

  const handleRequestMatch = async () => {
    if (!targetUsername.trim()) {
      showAlert('오류', user.role === 'driver' ? '승객 아이디를 입력해주세요.' : '기사 아이디를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await matchAPI.request(
        user.id,
        user.username,
        user.role,
        targetUsername.trim()
      );
      setMatch(result);

      if (result.status === 'matched') {
        if (user.role === 'driver') {
          navigation.replace('DriverDashboard', { user, match: result });
        } else {
          navigation.replace('PassengerWait', { user, match: result });
        }
      } else {
        showAlert('매칭 대기', '상대방이 아이디를 입력하면 매칭이 완료됩니다.');
        setTimeout(() => checkMatchStatus(), 500);
      }
    } catch (error: any) {
      showAlert(
        '매칭 실패',
        error.response?.data?.message || '매칭 요청에 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMatch = async () => {
    if (!match) return;

    showConfirm('매칭 취소', '정말 매칭을 취소하시겠습니까?', async () => {
      try {
        await matchAPI.cancel(match.id);
        setMatch(null);
        setTargetUsername('');
      } catch (error) {
        showAlert('오류', '매칭 취소에 실패했습니다.');
      }
    });
  };

  const handleLogout = () => {
    showConfirm('로그아웃', '로그아웃 하시겠습니까?', () => {
      navigation.replace('Login');
    });
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>매칭 상태 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarEmoji}>
            {user.role === 'driver' ? '🚕' : '✈️'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.username}</Text>
          <View style={[
            styles.roleBadge,
            user.role === 'driver' ? styles.driverBadge : styles.passengerBadge
          ]}>
            <Text style={[
              styles.roleBadgeText,
              user.role === 'driver' ? styles.driverBadgeText : styles.passengerBadgeText
            ]}>
              {user.role === 'driver' ? '택시 기사' : '승객'}
            </Text>
          </View>
        </View>
      </View>

      {/* Matching Card */}
      <View style={styles.matchingCard}>
        <Text style={styles.cardTitle}>
          {user.role === 'driver' ? '승객 매칭' : '기사 매칭'}
        </Text>

        {match && match.status === 'pending' ? (
          <View style={styles.pendingSection}>
            <View style={styles.pendingIndicator}>
              <View style={styles.pulseOuter}>
                <View style={styles.pulseInner}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            </View>
            <Text style={styles.pendingTitle}>상대방 대기 중</Text>
            <Text style={styles.pendingSubtitle}>
              {user.role === 'driver'
                ? `승객 "${match.passengerUsername || targetUsername}" 대기 중`
                : `기사 "${match.driverUsername || targetUsername}" 대기 중`}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelMatch}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelButtonText}>매칭 취소</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.cardDescription}>
              {user.role === 'driver'
                ? '픽업할 승객의 아이디를 입력하세요.'
                : '탑승할 택시 기사의 아이디를 입력하세요.'}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {user.role === 'driver' ? '승객 아이디' : '기사 아이디'}
              </Text>
              <TextInput
                style={[styles.input, inputFocused && styles.inputFocused]}
                value={targetUsername}
                onChangeText={setTargetUsername}
                placeholder="아이디를 입력하세요"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.matchButton, loading && styles.matchButtonDisabled]}
              onPress={handleRequestMatch}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.matchButtonText}>매칭 요청</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  driverBadge: {
    backgroundColor: '#FFF3E0',
  },
  passengerBadge: {
    backgroundColor: colors.primaryLight,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  driverBadgeText: {
    color: colors.warning,
  },
  passengerBadgeText: {
    color: colors.primary,
  },

  // Matching Card
  matchingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Input
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },

  // Buttons
  matchButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  matchButtonDisabled: {
    opacity: 0.7,
  },
  matchButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },

  // Pending State
  pendingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pendingIndicator: {
    marginBottom: spacing.lg,
  },
  pulseOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pendingTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  pendingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },

  // Logout
  logoutButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  logoutButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
