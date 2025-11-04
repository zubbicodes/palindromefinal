import { useTheme } from '@/context/ThemeContext'; // ✅ Theme import
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

const { width } = Dimensions.get('window');

export default function ProfileScreenWeb() {
  const { colors, theme } = useTheme(); // ✅ Theme hook

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* App Name */}
        <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.appName, { color: colors.primary }]}>PALINDROME</Text>
        </View>

        {/* Page Title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>PROFILE</Text>
        </View>

        {/* Form Area */}
        <View style={styles.formWrapper}>
          {/* Full Name + Avatar in one row */}
          <View style={styles.nameRow}>
            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text style={[styles.floatingLabel, { backgroundColor: colors.background, color: colors.text }]}>
                  Full Name
                </Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    backgroundColor: colors.inputBackground,
                    color: colors.text 
                  }]}
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
              <View style={[styles.editIcon, { backgroundColor: colors.background }]}>
                <Text style={[styles.editIconText, { color: colors.primary }]}>✎</Text>
              </View>
            </View>
          </View>

          {/* Email + Phone in one row */}
          <View style={styles.rowInputs}>
            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text style={[styles.floatingLabel, { backgroundColor: colors.background, color: colors.text }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    backgroundColor: colors.inputBackground,
                    color: colors.text 
                  }]}
                  placeholder="e.g. wilson09@gmail.com"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.floatingLabelWrapper}>
                <Text style={[styles.floatingLabel, { backgroundColor: colors.background, color: colors.text }]}>
                  Phone Number
                </Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border, 
                    backgroundColor: colors.inputBackground,
                    color: colors.text 
                  }]}
                  placeholder="0 123 456 7890"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Change Password + Save Button */}
          <View style={styles.actionRow}>
            <TouchableOpacity>
              <Text style={[styles.changePassword, { color: colors.primary }]}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const AVATAR_SIZE = 110;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  topHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pageHeader: {
    width: width * 0.7,
    alignSelf: 'center',
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formWrapper: {
    width: width * 0.7,
    alignSelf: 'center',
    marginTop: 35,
  },

  /** Full Name + Avatar Row **/
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
    marginRight: 90,
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
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  
  editIconText: {
    fontSize: 15,
  },

  /** Email + Phone Row **/
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 24,
  },

  /** Floating Label Inputs **/
  inputGroup: {
    marginBottom: 20,
    width: 480,
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
  },

  /** Buttons **/
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -15,
    gap: 745,
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
    marginTop: 120,
    width: 180,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});