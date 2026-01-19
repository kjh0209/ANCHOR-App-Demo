import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';
import { colors, spacing, borderRadius, typography, shadows, fonts } from '../theme';

// 웹 호환 Alert
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const user = await authAPI.login(username.trim(), password);
      navigation.replace('Matching', { user });
    } catch (error: any) {
      showAlert(
        '로그인 실패',
        error.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header / Brand Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoIcon}>🚕</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>ANCHOR</Text>
          <Text style={styles.subtitle}>공항 택시 픽업 안내 서비스</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>아이디</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'username' && styles.inputFocused,
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="아이디를 입력하세요"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>비밀번호</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'password' && styles.inputFocused,
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>계정이 없으신가요?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    ...typography.h1,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Form
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
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
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },

  // Button
  loginButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },

  // Footer
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
