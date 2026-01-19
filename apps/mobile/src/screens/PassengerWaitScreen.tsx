import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Button, Text, Card, TextInput, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { matchAPI, instructionAPI, User, Match, Instruction } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

// 웹 호환 Alert/Confirm
const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = '확인', cancelText = '취소') => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      },
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

export default function PassengerWaitScreen({ navigation, route }: Props) {
  const { user, match: initialMatch } = route.params;
  const [match, setMatch] = useState<Match>(initialMatch);
  const [gpsInput, setGpsInput] = useState({
    latitude: '',
    longitude: '',
  });
  const [gpsSet, setGpsSet] = useState(false);
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // 기존 GPS 정보가 있으면 표시
    if (match.passengerLatitude && match.passengerLongitude) {
      setGpsInput({
        latitude: match.passengerLatitude.toString(),
        longitude: match.passengerLongitude.toString(),
      });
      setGpsSet(true);
    }
  }, [match]);

  // 매칭 상태 및 안내문 폴링
  const checkStatusAndInstruction = useCallback(async () => {
    if (!match?.id) return;

    try {
      // 1. 매칭 상태 확인 (기사가 취소했는지 확인)
      const latestMatch = await matchAPI.getMatch(match.id);
      if (!latestMatch || latestMatch.status === 'none') {
        throw new Error('Match deleted');
      }
      setMatch(latestMatch);

      // 2. 안내문 확인
      const result = await instructionAPI.getPending(match.id);
      if (result && 'content' in result && result.sentToPassenger) {
        setInstruction(result as Instruction);
      }
    } catch (error) {
      // 매칭이 사라진 경우
      if (Platform.OS === 'web') {
        window.alert('매칭이 종료되었거나 취소되었습니다.');
      } else {
        Alert.alert('알림', '매칭이 종료되었거나 취소되었습니다.');
      }
      navigation.replace('Matching', { user });
    }
  }, [match?.id, navigation, user]);

  useFocusEffect(
    useCallback(() => {
      checkStatusAndInstruction();
      const interval = setInterval(checkStatusAndInstruction, 3000); // 3초마다 확인
      return () => clearInterval(interval);
    }, [checkStatusAndInstruction])
  );

  const handleSetGPS = async () => {
    const lat = parseFloat(gpsInput.latitude);
    const lng = parseFloat(gpsInput.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      if (Platform.OS === 'web') {
        window.alert('오류: 유효한 좌표를 입력해주세요.');
      } else {
        Alert.alert('오류', '유효한 좌표를 입력해주세요.');
      }
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      if (Platform.OS === 'web') {
        window.alert('오류: 좌표 범위가 올바르지 않습니다.');
      } else {
        Alert.alert('오류', '좌표 범위가 올바르지 않습니다.');
      }
      return;
    }

    try {
      const updated = await matchAPI.updateGPS(match.id, user.id, 'passenger', lat, lng);
      setMatch(updated);
      setGpsSet(true);
      if (Platform.OS === 'web') {
        window.alert('성공: GPS 좌표가 설정되었습니다.');
      } else {
        Alert.alert('성공', 'GPS 좌표가 설정되었습니다.');
      }
    } catch (error) {
       if (Platform.OS === 'web') {
        window.alert('오류: GPS 설정에 실패했습니다.');
      } else {
        Alert.alert('오류', 'GPS 설정에 실패했습니다.');
      }
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    await checkStatusAndInstruction();
    setChecking(false);
  };

  const handleCompleteMatch = () => {
    showConfirm(
      '탑승 완료',
      '기사님 차량에 탑승하셨습니까?\n매칭을 종료합니다.',
      async () => {
        try {
          await matchAPI.complete(match.id);
          navigation.replace('Matching', { user });
        } catch (error) {
          if (Platform.OS === 'web') {
            window.alert('오류: 탑승 완료 처리에 실패했습니다.');
          } else {
            Alert.alert('오류', '탑승 완료 처리에 실패했습니다.');
          }
        }
      },
      '탑승 완료'
    );
  };

  const handleEndMatch = () => {
    showConfirm(
      '매칭 종료',
      '매칭을 종료(취소)하시겠습니까?\n상대방의 화면에서도 매칭이 종료됩니다.',
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
      },
      '매칭 종료'
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 매칭 정보 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium">🧳 승객: {user.username}</Text>
            <Chip mode="flat" compact>매칭됨</Chip>
          </View>
          <Text variant="bodyMedium" style={styles.matchInfo}>
            기사: {match.driverUsername}
          </Text>
        </Card.Content>
      </Card>

      {/* GPS 설정 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📍 GPS 위치 설정 (승객)
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

      {/* 안내문 대기 / 표시 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📋 안내문
          </Text>

          {instruction ? (
            <View>
              <View style={styles.instructionHeader}>
                <Chip mode="flat" style={styles.receivedChip}>새 안내문</Chip>
              </View>

              <Divider style={styles.divider} />

              <Text variant="bodyLarge" style={styles.instruction}>
                {instruction.content}
              </Text>

              <Divider style={styles.divider} />

              <Button mode="contained" onPress={handleCompleteMatch} style={styles.completeButton}>
                탑승 완료 (안내 종료)
              </Button>
            </View>
          ) : (
            <View style={styles.waitingContainer}>
              {checking ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text style={styles.waitingIcon}>📨</Text>
              )}
              <Text style={styles.waitingText}>
                기사의 안내문을 기다리고 있습니다...
              </Text>
              <Text style={styles.waitingSubtext}>
                기사가 주행 화면을 분석하고 안내문을 전송하면{'\n'}
                이곳에 표시됩니다.
              </Text>
              <Button
                mode="text"
                onPress={handleRefresh}
                loading={checking}
                style={styles.refreshButton}
              >
                새로고침
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 기사 GPS 정보 */}
      {match.driverLatitude && match.driverLongitude && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🚕 기사 위치
            </Text>
            <Text style={styles.driverLocation}>
              위도: {Number(match.driverLatitude).toFixed(6)}{'\n'}
              경도: {Number(match.driverLongitude).toFixed(6)}
            </Text>
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
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  receivedChip: {
    backgroundColor: '#dcfce7',
  },
  divider: {
    marginVertical: 12,
  },
  instruction: {
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  driverLocation: {
    color: '#666',
    lineHeight: 24,
  },
  endButton: {
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
