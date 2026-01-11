import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getFriendlyErrorMessage } from '../../utils/authErrors';
import LoginWeb from './index.web';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (Platform.OS === 'web') {
    return <LoginWeb />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      if (result.success) {
        router.replace('/gamelayout');
      } else {
        const message = result.error ? getFriendlyErrorMessage(result.error) : 'Login failed';
        Alert.alert('Login Failed', message);
      }
    } catch (error: any) {
      const message = getFriendlyErrorMessage(error.code || error.message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Reset Password', 'Please enter your email address first.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        Alert.alert('Success', 'Password reset email sent! Check your inbox.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (result.success) {
        router.replace('/gamelayout');
      } else {
        Alert.alert('Login Failed', result.error || 'Google sign-in failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(0, 0, 116, 1)', 'rgba(0, 0, 23, 1)']
          : ['#FFFFFF', '#FFFFFF']
      }
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={[styles.container]}>
          {/* Header */}
          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Login to your account
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? '#DADADA' : '#49463F' },
            ]}
          >
            Continue Your Palindrome Journey
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0,0,23,1)'
                      : '#FFF',
                    color: isDark ? '#FFF' : '#000',
                  },
                ]}
              >
                Email address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.6)',
                    color: isDark ? '#FFF' : '#000',
                    borderColor: isDark ? '#2A2D50' : '#EFE8E8',
                  },
                ]}
                placeholder="e.g. wilson09@gmail.com"
                placeholderTextColor={isDark ? '#CCC' : '#555'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0,0,23,1)'
                      : '#FFF',
                    color: isDark ? '#FFF' : '#000',
                  },
                ]}
              >
                Password
              </Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.6)',
                    borderColor: isDark ? '#2A2D50' : '#EFE8E8',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.passwordInput,
                    { color: isDark ? '#FFF' : '#000' },
                  ]}
                  placeholder="********"
                  placeholderTextColor={isDark ? '#CCC' : '#555'}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.iconButton}
                  disabled={loading}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={isDark ? '#CCC' : '#999'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotWrapper}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text
              style={[
                styles.forgotPassword,
                { color: isDark ? '#FF6B81' : '#FF002B' },
              ]}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Log In Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: isDark ? '#375FFF' : '#007BFF' },
              loading && { opacity: 0.7 }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' },
              ]}
            />
            <Text style={[styles.dividerText, { color: isDark ? '#AAB3FF' : '#007BFF' }]}>
              or
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.googleButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
              },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Image source={require('../../assets/images/google.png')} style={styles.googleIcon} />
            <Text style={[styles.googleText, { color: isDark ? '#FFFFFF' : '#111111' }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: isDark ? '#DDD' : '#2A2A2A' },
              ]}
            >
              New on Palindrome?{' '}
              <Text
                style={[
                  styles.footerBold,
                  { color: isDark ? '#6C8CFF' : '#007BFF' },
                ]}
                onPress={() => router.push('/signup')}
              >
                Create an account.
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  title: {
    fontFamily: 'Geist-Bold',
    fontSize: 26,
    marginBottom: 6,
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: 18,
  },
  floatingLabelWrapper: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -7,
    left: 16,
    paddingHorizontal: 6,
    fontSize: 13,
    fontFamily: 'Geist-Bold',
    zIndex: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Geist-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontFamily: 'Geist-Regular',
    fontSize: 16,
    paddingVertical: 14,
  },
  iconButton: {
    paddingLeft: 6,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotPassword: {
    fontFamily: 'Geist-Bold',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 80,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 28,
  },
  loginButtonText: {
    color: '#FFF',
    fontFamily: 'Geist-Bold',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  dividerLine: {
    height: 1,
    width: 70,
  },
  dividerText: {
    fontFamily: 'Geist-Bold',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 80,
    paddingVertical: 12,
    marginBottom: 18,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleText: {
    fontFamily: 'Geist-Bold',
    fontSize: 15,
  },
  footer: {
    marginTop: 240,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
  },
  footerBold: {
    fontFamily: 'Geist-Bold',
  },
});
