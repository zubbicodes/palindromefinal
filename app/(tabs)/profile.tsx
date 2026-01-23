import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      // Use getSessionUser for faster initial load (avoids network roundtrip)
      const user = await authService.getSessionUser();
      if (user) {
        // Set email from auth user as fallback
        setEmail(user.email || '');
        
        // Try to load from cache first
        const cached = await authService.getCachedProfile(user.id);
        if (cached) {
          setFullName(cached.full_name || '');
          setPhone(cached.phone || '');
          if (cached.email) setEmail(cached.email);
          setAvatar(cached.avatar_url);
        }

        // Fetch fresh profile data
        const profile = await authService.getProfile(user.id);
        if (profile) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
          if (profile.email) setEmail(profile.email);
          setAvatar(profile.avatar_url);
        }
      }
    };
    loadProfile();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false, // We use URI for upload
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    const user = await authService.getSessionUser();
    if (!user) return;

    setUploading(true);
    try {
      const result = await authService.uploadAvatar(user.id, { uri, type: 'image/jpeg' });
      if (result.success && result.publicUrl) {
        setAvatar(result.publicUrl);
        // Update profile with new avatar URL
        await authService.updateProfile(user.id, { avatar_url: result.publicUrl });
      } else {
        alert(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const user = await authService.getSessionUser();
    if (!user) return;

    setLoading(true);
    try {
      const updates = {
        full_name: fullName,
        email: email,
        phone: phone,
        updated_at: new Date().toISOString(),
      };

      const result = await authService.updateProfile(user.id, updates);
      if (result.success) {
        alert('Profile updated successfully!');
      } else {
        alert(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

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
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
              router.replace('/main');
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#0060FF'} />
          </TouchableOpacity>

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
                value={fullName}
                onChangeText={setFullName}
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
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    elevation: 5,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle background for visibility
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
