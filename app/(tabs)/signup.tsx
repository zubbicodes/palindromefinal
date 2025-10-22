import { Ionicons } from '@expo/vector-icons';
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
  if (Platform.OS === 'web') {
    return <SignUpWeb />;
  }

  const [agree, setAgree] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Enter the Palindrome Realm</Text>

        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <View style={styles.floatingLabelWrapper}>
            <Text style={styles.floatingLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jenny Wilson"
              placeholderTextColor="#B0B0B0"
              keyboardType="default"
            />
          </View>
        </View>

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

        {/* ✅ Terms & Conditions Checkbox */}
        <TouchableOpacity
          onPress={() => setAgree(!agree)}
          activeOpacity={0.8}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkboxBox, agree && styles.checkboxChecked]}>
            {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>

          <Text style={styles.checkboxText}>
            I've read and agree to the{' '}
            <Text style={styles.linkText}>terms </Text>
            or{' '}
            <Text style={styles.linkText}>privacy policy</Text>
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
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerBold}>Log In</Text>
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
    top: -7,
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
    borderColor: '#B0B0B0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#B7463F',
    borderColor: '#B7463F',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: 'Geist-Regular',
  },
  linkText: {
    color: '#B7463F',
    fontWeight: '500',
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

  // --- Footer ---
  footer: {
    marginTop: 320,
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
