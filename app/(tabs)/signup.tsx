import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import SignUpWeb from './signup.web';

export default function SignupScreen() {
  const { theme } = useThemeContext();

  if (Platform.OS === 'web') {
    return <SignUpWeb />;
  }

  const [agree, setAgree] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#000017', '#000074'] // 🌙 Dark theme gradient
          : ['#FFFFFF', '#FFFFFF'] // ☀️ Light theme gradient
      }
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View style={styles.container}>
          {/* Header */}
          <Text
            style={[
              styles.title,
              { color: theme === 'dark' ? '#FFF' : '#000' },
            ]}
          >
            Create your account
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme === 'dark' ? '#CCC' : '#49463F' },
            ]}
          >
            Enter the Palindrome Realm
          </Text>

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    color: theme === 'dark' ? '#FFF' : '#000',
                    backgroundColor: theme === 'dark' ? '#00002A' : '#FFF',
                  },
                ]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(0,0,50,0.4)'
                        : 'rgba(255,255,255,0.6)',
                    borderColor:
                      theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.1)',
                    color: theme === 'dark' ? '#FFF' : '#000',
                  },
                ]}
                placeholder="e.g. Jenny Wilson"
                placeholderTextColor={theme === 'dark' ? '#AAA' : '#B0B0B0'}
                keyboardType="default"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    color: theme === 'dark' ? '#FFF' : '#000',
                    backgroundColor: theme === 'dark' ? '#00002A' : '#FFF',
                  },
                ]}
              >
                Email address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(0,0,50,0.4)'
                        : 'rgba(255,255,255,0.6)',
                    borderColor:
                      theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.1)',
                    color: theme === 'dark' ? '#FFF' : '#000',
                  },
                ]}
                placeholder="e.g. wilson09@gmail.com"
                placeholderTextColor={theme === 'dark' ? '#AAA' : '#B0B0B0'}
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
                  {
                    color: theme === 'dark' ? '#FFF' : '#000',
                    backgroundColor: theme === 'dark' ? '#00002A' : '#FFF',
                  },
                ]}
              >
                Password
              </Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(0,0,50,0.4)'
                        : 'rgba(255,255,255,0.6)',
                    borderColor:
                      theme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.1)',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.passwordInput,
                    { color: theme === 'dark' ? '#FFF' : '#000' },
                  ]}
                  placeholder="********"
                  placeholderTextColor={theme === 'dark' ? '#AAA' : '#B0B0B0'}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={theme === 'dark' ? '#DDD' : '#999'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ✅ Terms & Conditions Checkbox */}
          <TouchableOpacity
            onPress={() => setAgree(!agree)}
            activeOpacity={0.8}
            style={styles.checkboxRow}
          >
            <View
              style={[
                styles.checkboxBox,
                {
                  backgroundColor:
                    theme === 'dark' ? '#00002A' : '#FFF',
                  borderColor:
                    theme === 'dark' ? '#999' : '#B0B0B0',
                },
                agree && {
                  backgroundColor: '#007BFF',
                  borderColor: '#007BFF',
                },
              ]}
            >
              {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>

            <Text
              style={[
                styles.checkboxText,
                { color: theme === 'dark' ? '#DDD' : '#333' },
              ]}
            >
              I've read and agree to the{' '}
              <Text
                style={[styles.linkText, { textDecorationLine: 'underline' }]}
              >
                terms{' '}
              </Text>
              or{' '}
              <Text
                style={[styles.linkText, { textDecorationLine: 'underline' }]}
              >
                privacy policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: agree ? '#007BFF' : '#A0C8FF' },
            ]}
            disabled={!agree}
          >
            <Text style={styles.loginButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: theme === 'dark' ? '#CCC' : '#2A2A2A' },
              ]}
            >
              Already have an account?{' '}
              <Text
                style={[
                  styles.footerBold,
                  { color: theme === 'dark' ? '#66A3FF' : '#007BFF' },
                ]}
              >
                Log In
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

  // --- Header ---
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

  // --- Input Section ---
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

  // ✅ Checkbox Styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Geist-Regular',
  },
  linkText: {
    color: '#007BFF',
    fontWeight: '500',
  },

  // --- Buttons ---
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

  // --- Footer ---
  footer: {
    marginTop: 280,
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
