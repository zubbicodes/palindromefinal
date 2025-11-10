import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LoginWeb from './index.web';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (Platform.OS === 'web') {
    return <LoginWeb />;
  }

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
                  { backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.6)',
                    color: isDark ? '#FFF' : '#000',},
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
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  { backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.6)',
                    color: isDark ? '#FFF' : '#000', },
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
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.iconButton}
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
          <TouchableOpacity style={styles.forgotWrapper}>
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
            ]}
            onPress={() => router.push('/gamelayout')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerWrapper}>
            <View
              style={[
                styles.line,
                { backgroundColor: isDark ? '#444' : '#E0E0E0' },
              ]}
            />
            <Text
              style={[
                styles.orText,
                { color: isDark ? '#FFF' : '#007BFF' },
              ]}
            >
              or
            </Text>
            <View
              style={[
                styles.line,
                { backgroundColor: isDark ? '#444' : '#E0E0E0' },
              ]}
            />
          </View>

          {/* Google Login */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                borderColor: isDark ? '#2A2D50' : '#EFE8E8',
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.6)',
              },
            ]}
          >
            <Image
              source={require('../../assets/images/google.png')}
              style={styles.socialIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.socialText,
                { color: isDark ? '#FFF' : '#000' },
              ]}
            >
              Sign in with Google
            </Text>
          </TouchableOpacity>

          {/* Apple Login */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              {
                borderColor: isDark ? '#2A2D50' : '#EFE8E8',
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.6)',
              },
            ]}
          >
            <Image
              source={require('../../assets/images/apple.png')}
              style={styles.socialIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.socialText,
                { color: isDark ? '#FFF' : '#000' },
              ]}
            >
              Sign in with Apple
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
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  line: {
    width: 100,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontFamily: 'Geist-Bold',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 80,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialText: {
    fontFamily: 'Geist-Regular',
    fontSize: 16,
  },
  footer: {
    marginTop: 170,
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
