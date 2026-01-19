import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { matchAPI, User, Match } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

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

  const checkMatchStatus = useCallback(async () => {
    try {
      const status = await matchAPI.getStatus(user.id, user.role);
      if (status && status.status !== 'none') {
        setMatch(status);
        if (status.status === 'matched') {
          // 매칭 완료 - 대시보드로 이동
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
      const interval = setInterval(checkMatchStatus, 3000); // 3초마다 상태 확인
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
        // 매칭 완료 - 즉시 대시보드로 이동
        if (user.role === 'driver') {
          navigation.replace('DriverDashboard', { user, match: result });
        } else {
          navigation.replace('PassengerWait', { user, match: result });
        }
      } else {
        // 매칭 대기 중 - 상태 확인을 계속함
        showAlert('매칭 대기', '상대방이 아이디를 입력하면 매칭이 완료됩니다.');
        // 즉시 상태 확인
        setTimeout(() => {
          checkMatchStatus();
        }, 500);
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>매칭 상태 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <Text variant="titleMedium">
              {user.role === 'driver' ? '🚕' : '🧳'} {user.username}
            </Text>
            <Chip mode="outlined">
              {user.role === 'driver' ? '택시 기사' : '승객'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {user.role === 'driver' ? '승객 매칭' : '기사 매칭'}
          </Text>

          {match && match.status === 'pending' ? (
            <View style={styles.pendingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.pendingText}>
                상대방 대기 중...{'\n'}
                {user.role === 'driver'
                  ? `승객 "${match.passengerUsername || targetUsername}" 대기 중`
                  : `기사 "${match.driverUsername || targetUsername}" 대기 중`}
              </Text>
              <Button mode="outlined" onPress={handleCancelMatch} style={styles.cancelButton}>
                매칭 취소
              </Button>
            </View>
          ) : (
            <>
              <Text variant="bodyMedium" style={styles.description}>
                {user.role === 'driver'
                  ? '픽업할 승객의 아이디를 입력하세요.'
                  : '탑승할 택시 기사의 아이디를 입력하세요.'}
              </Text>

              <TextInput
                label={user.role === 'driver' ? '승객 아이디' : '기사 아이디'}
                value={targetUsername}
                onChangeText={setTargetUsername}
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
              />

              <Button
                mode="contained"
                onPress={handleRequestMatch}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                매칭 요청
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>
        로그아웃
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  userCard: {
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    padding: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    paddingVertical: 6,
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pendingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  cancelButton: {
    marginTop: 20,
  },
  logoutButton: {
    marginTop: 20,
  },
});
