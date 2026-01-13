import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ProfileWeb from './profile.web';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadAvatar = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        try {
          const storedAvatar = await AsyncStorage.getItem(`user_avatar_${user.id}`);
          if (storedAvatar) {
            setAvatar(storedAvatar);
          }
        } catch (error) {
          console.error('Error loading avatar:', error);
        }
      }
    };
    loadAvatar();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
        saveAvatarLocally(base64Img);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const saveAvatarLocally = async (base64Image: string) => {
    const user = await authService.getCurrentUser();
    if (!user) return;

    setUploading(true);
    try {
      await AsyncStorage.setItem(`user_avatar_${user.id}`, base64Image);
      setAvatar(base64Image);
    } catch (error) {
      console.error('Error saving image locally:', error);
      alert('Failed to save image.');
    } finally {
      setUploading(false);
    }
  };

  if (Platform.OS === 'web') {
    return <ProfileWeb />;
  }

  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(0, 0, 116, 1)', 'rgba(0, 0, 23, 1)']
          : ['#FFFFFF', '#E9EFFF']
      }
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/bg.png')}
            style={styles.headerImage}
          />
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#FFFFFF' : '#0060FF' },
            ]}
          >
            PROFILE
          </Text>

          <View
            style={[
              styles.semicircle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fff' },
            ]}
          />
        </View>

        {/* Profile Image */}
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          <Image
            source={avatar ? { uri: avatar } : require('../../assets/images/profile.jpg')}
            style={styles.profileImage}
          />
          {uploading && (
            <View style={[styles.profileImage, styles.uploadingOverlay]}>
              <Text style={{ color: '#FFF' }}>...</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    backgroundColor: 'transparent',
                    color: isDark ? '#FFF' : '#000',
                  },
                ]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: 'transparent',
                    color: isDark ? '#FFF' : '#000',
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#CCC',
                  },
                ]}
                placeholder="e.g. Jenny Wilson"
                placeholderTextColor={isDark ? '#CCC' : '#777'}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    backgroundColor: 'transparent',
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
                    backgroundColor: 'transparent',
                    color: isDark ? '#FFF' : '#000',
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#CCC',
                  },
                ]}
                placeholder="e.g. wilson09@gmail.com"
                placeholderTextColor={isDark ? '#CCC' : '#777'}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <View style={styles.floatingLabelWrapper}>
              <Text
                style={[
                  styles.floatingLabel,
                  {
                    backgroundColor: 'transparent',
                    color: isDark ? '#FFF' : '#000',
                  },
                ]}
              >
                Phone number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: 'transparent',
                    color: isDark ? '#FFF' : '#000',
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#CCC',
                  },
                ]}
                placeholder="e.g. 0 123 456 7890"
                placeholderTextColor={isDark ? '#CCC' : '#777'}
              />
            </View>
          </View>

          {/* Change Password + Save */}
          <View style={styles.actionRow}>
            <TouchableOpacity>
              <Text
                style={[
                  styles.changePassword,
                  { color: isDark ? '#FFF' : '#000' },
                ]}
              >
                Change Password
              </Text>
            </TouchableOpacity>

            {/* ✅ Gradient Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: 'rgba(0, 123, 255, 0.85)' }, // ✅ single color with opacity
              ]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ Gradient Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: 'rgba(0, 123, 255, 0.85)' }, // ✅ single color with opacity
          ]}
          onPress={async () => {
            try {
              await authService.signOut();
              router.replace('/');
            } catch (error) {
              console.error('Logout failed:', error);
              alert('Failed to logout. Please try again.');
            }
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    width: width,
    height: 240,
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
  },
  headerTitle: {
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
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    marginTop: -70,
    marginBottom: 20,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '85%',
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 80,
  },
  changePassword: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 180,
    width: '85%',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
