import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProfileScreenWeb() {
  const { colors, theme } = useTheme();

  const gradientColors =
    theme === 'dark'
      ? (['#000017', '#000074'] as const)
      : (['#FFFFFF', '#FFFFFF'] as const);

  const inputBackground = theme === 'dark' ? 'rgba(0, 0, 35, 0)' : '#FFFFFF';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* App Name */}
        <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.appName, { color: colors.primary }]}>
            PALINDROME
          </Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            PROFILE
          </Text>
        </View>

        {/* Form Area */}
        <View style={styles.formWrapper}>
          {/* Full Name + Avatar */}
          <View style={styles.nameRow}>
            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text
                  style={[
                    styles.floatingLabel,
                    { backgroundColor: 'transparent', color: colors.text },
                  ]}
                >
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: inputBackground,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Jenny Wilson"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image
                source={require('../../assets/images/profile.jpg')}
                style={styles.avatar}
              />
              <View
                style={[styles.editIcon, { backgroundColor: inputBackground }]}
              >
                <Text style={[styles.editIconText, { color: colors.primary }]}>
                  ✎
                </Text>
              </View>
            </View>
          </View>

          {/* Email + Phone */}
          <View style={styles.rowInputs}>
            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text
                  style={[
                    styles.floatingLabel,
                    { backgroundColor: 'transparent', color: colors.text },
                  ]}
                >
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: inputBackground,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. wilson09@gmail.com"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text
                  style={[
                    styles.floatingLabel,
                    { backgroundColor: 'transparent', color: colors.text },
                  ]}
                >
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: inputBackground,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0 123 456 7890"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Change Password + Save */}
          <View style={styles.actionRow}>
            <TouchableOpacity>
              <Text style={[styles.changePassword, { color: colors.primary }]}>
                Change Password
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveButtonText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
}

// Avatar and fonts capped for large screens
const MAX_CONTAINER_WIDTH = 1000;
const AVATAR_SIZE = Math.min(screenWidth * 0.12, 110);

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    minHeight: screenHeight,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topHeader: {
    paddingVertical: -1,
    borderBottomWidth: 1,
    alignItems: 'center',
    width: '120%', 
  },
  appName: {
    fontSize: Math.min(screenWidth * 0.03, 30),
    fontWeight: '700',
    letterSpacing: 1,
   
  },
  pageHeader: {
    maxWidth: MAX_CONTAINER_WIDTH,
    width: '100%',
    alignSelf: 'center',
    marginTop: 160,
    marginBottom: -50
  },
  headerTitle: {
    fontSize: Math.min(screenWidth * 0.02, 24),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formWrapper: {
    maxWidth: MAX_CONTAINER_WIDTH,
    width: '100%',
    alignSelf: 'center',
    marginTop: 30,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  editIcon: {
  position: 'absolute',
  bottom: 6,
  right: 6,
  borderRadius: 15,
  width: AVATAR_SIZE * 0.3, // Much smaller relative size
  height: AVATAR_SIZE * 0.3, // Much smaller relative size
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 3,
  backgroundColor: 'transparent', // Make it transparent
  borderWidth: 2,
  },
  editIconText: {
    fontSize: AVATAR_SIZE * 0.3,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 30,
  },
  inputGroup: {
    flex: 1,
    minWidth: 250,
    maxWidth: 480, // capped for large screens
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
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 20,
  },
  changePassword: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 50,
    width: 180,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
