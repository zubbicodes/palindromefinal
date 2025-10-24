import React from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProfileWeb from './profile.web';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    if (Platform.OS === 'web') {
    return <ProfileWeb />;
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/bg.png')}
          style={styles.headerImage}
        />
        <Text style={styles.headerTitle}>PROFILE</Text>
        {/* Semicircle cutout */}
        <View style={styles.semicircle} />
      </View>

      {/* Profile Image */}
      <Image
        source={require('../../assets/images/profile.jpg')}
        style={styles.profileImage}
      />

      {/* Form */}
      <View style={styles.form}>
        {/* Full Name */}
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

        {/* Email */}
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

        {/* Phone */}
        <View style={styles.inputGroup}>
          <View style={styles.floatingLabelWrapper}>
                      <Text style={styles.floatingLabel}>Phone number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 0 123 456 7890"
                        placeholderTextColor="#B0B0B0"
                        keyboardType="phone-pad"
                      />
                    </View>
        </View>

        {/* Change Password + Save */}
        <View style={styles.actionRow}>
          <TouchableOpacity>
            <Text style={styles.changePassword}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  header: {
    width: width,
    height: 240,
    backgroundColor: '#ffffffff',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 360,
    height: 210,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  headerTitle: {
    color: '#0060FF',
    fontSize: 26,
    fontWeight: '500',
    fontFamily: 'Geist-Bold',
    marginTop: -40,
  },
  semicircle: {
    position: 'absolute',
    bottom: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    marginTop: -70,
    marginBottom: 20,
  },
  form: {
    width: '85%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  floatingLabelWrapper:{
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
    borderWidth: 1,
    borderColor: '#EFE8E8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 100,
  },
  changePassword: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0060FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 180,
    width: '85%',
    backgroundColor: '#0060FF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
});