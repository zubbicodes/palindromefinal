import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Login to your account</Text>
        <Text style={styles.subtitle}>Continue Your Palindrome Journey</Text>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <View style={styles.floatingLabelWrapper}>
            <Text style={styles.floatingLabel}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. wilson09@gmail.com"
              placeholderTextColor="#B0B0B0"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.floatingLabelWrapper}>
            <Text style={styles.floatingLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="********"
                placeholderTextColor="#B0B0B0"
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.iconButton}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotWrapper}>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Log In Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerWrapper}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>
         {/* Google Login */}
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../assets/images/google.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.socialText}>Sign in with Google</Text>
        </TouchableOpacity>

          {/* Apple Login */}
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={require('../../assets/images/apple.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
          <Text style={styles.socialText}>Sign in with Apple</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New on Palindrome?{' '}
            <Text style={styles.footerBold}>Create an account.</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },

  // --- Header ---
  title: {
    fontFamily: 'Geist-Bold',
    fontSize: 26,
    color: '#000',
    marginBottom: 6,
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    color: '#49463F',
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
    top: -7, // centered right on top of the border line
    left: 16,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    fontSize: 13,
    color: '#000',
    fontFamily: 'Geist-Bold',
    zIndex: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE8E8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Geist-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE8E8',
    borderRadius: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontFamily: 'Geist-Regular',
    fontSize: 16,
    color: '#000',
    paddingVertical: 14,
  },
  iconButton: {
    paddingLeft: 6,
  },

  // --- Forgot Password ---
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotPassword: {
    color: '#FF002B',
    fontFamily: 'Geist-Bold',
    fontSize: 14,
  },

  // --- Buttons ---
  loginButton: {
    backgroundColor: '#007BFF',
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

  // --- Divider ---
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  line: {
    width: 100,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#007BFF',
    fontFamily: 'Geist-Bold',
  },

  // --- Social Buttons ---
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE8E8',
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
    color: '#000',
  },

  // --- Footer ---
  footer: {
    marginTop: 120,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Geist-Regular',
    fontSize: 14,
    color: '#2A2A2A',
  },
  footerBold: {
    fontFamily: 'Geist-Bold',
    color: '#007BFF',
  },
});
