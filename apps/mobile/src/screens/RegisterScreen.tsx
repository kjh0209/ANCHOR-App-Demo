import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, SegmentedButtons, Snackbar } from 'react-native-paper';
import { authAPI } from '../services/api';

// 웹 호환 Alert
const showAlert = (title: string, message: string, onPress?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (onPress) onPress();
  } else {
    Alert.alert(title, message, onPress ? [{ text: '확인', onPress }] : undefined);
  }
};

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'driver' | 'passenger'>('driver');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setSnackbarMessage('아이디와 비밀번호를 입력해주세요.');
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage('비밀번호가 일치하지 않습니다.');
      setSnackbarVisible(true);
      return;
    }

    if (password.length < 4) {
      setSnackbarMessage('비밀번호는 4자 이상이어야 합니다.');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      const user = await authAPI.register(username.trim(), password, role);
      setSnackbarMessage('회원가입이 완료되었습니다!');
      setSnackbarVisible(true);
      // 1.5초 후 매칭 화면으로 이동
      setTimeout(() => {
        navigation.replace('Matching', { user });
      }, 1500);
    } catch (error: any) {
      setSnackbarMessage(error.response?.data?.message || '이미 존재하는 아이디입니다.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            회원가입
          </Text>

          <Text variant="bodyMedium" style={styles.label}>
            사용자 유형 선택
          </Text>
          <SegmentedButtons
            value={role}
            onValueChange={(value) => setRole(value as 'driver' | 'passenger')}
            buttons={[
              { value: 'driver', label: '🚕 택시 기사' },
              { value: 'passenger', label: '🧳 승객' },
            ]}
            style={styles.segmented}
          />

          <TextInput
            label="아이디"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
          />

          <TextInput
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />

          <TextInput
            label="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            회원가입
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            이미 계정이 있으신가요? 로그인
          </Button>
        </Card.Content>
      </Card>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  label: {
    marginBottom: 8,
    color: '#333',
  },
  segmented: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 16,
  },
  snackbar: {
    marginBottom: 20,
  },
});
