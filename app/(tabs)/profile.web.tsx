import { authService } from '@/authService';
import { ColorBlindMode, useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { DEFAULT_GAME_GRADIENTS, gradientFromHex, type GameColorGradient } from '@/lib/gameColors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { Switch } from 'react-native-switch';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const COLOR_BLIND_TOKENS: Record<ColorBlindMode, readonly string[]> = {
  symbols: ['●', '▲', '■', '◆', '★'],
  emojis: ['🍓', '🥑', '🫐', '🖤', '🍋'],
  cards: ['♥', '♣', '♦', '♠', '★'],
  letters: ['A', 'B', 'C', 'D', 'E'],
} as const;

function getColorBlindToken(mode: ColorBlindMode, index: number) {
  return COLOR_BLIND_TOKENS[mode][index] ?? '?';
}

export default function ProfileScreenWeb() {
  const { colors, theme } = useTheme();
  const { colorBlindEnabled, colorBlindMode, setColorBlindEnabled, setColorBlindMode, customGameColors, setCustomGameColors } = useSettings();
  const displayGradients = customGameColors ?? [...DEFAULT_GAME_GRADIENTS];
  const [editingColors, setEditingColors] = useState<GameColorGradient[]>(() => customGameColors ?? [...DEFAULT_GAME_GRADIENTS]);
  const [colorsSaved, setColorsSaved] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [pickerHex, setPickerHex] = useState('');
  const throttleRef = useRef<{ raf: number | null; pending: string | null }>({ raf: null, pending: null });
  const selectedIndexRef = useRef(selectedColorIndex);
  selectedIndexRef.current = selectedColorIndex;

  useEffect(() => {
    setEditingColors(customGameColors ?? [...DEFAULT_GAME_GRADIENTS]);
  }, [customGameColors]);

  useEffect(() => {
    if (selectedColorIndex !== null) setPickerHex(editingColors[selectedColorIndex][0]);
  }, [selectedColorIndex]);

  const commitPickerColor = useCallback((hex: string) => {
    const idx = selectedIndexRef.current;
    if (idx === null) return;
    setEditingColors((prev) => {
      const next = [...prev];
      next[idx] = gradientFromHex(hex);
      return next;
    });
    setColorsSaved(false);
  }, []);

  const handlePickerChange = useCallback((hex: string) => {
    setPickerHex(hex);
    const ref = throttleRef.current;
    ref.pending = hex;
    if (ref.raf !== null) return;
    ref.raf = requestAnimationFrame(() => {
      if (ref.pending !== null) {
        commitPickerColor(ref.pending);
        ref.pending = null;
      }
      ref.raf = null;
    });
  }, [commitPickerColor]);

  const gradientColors =
    theme === 'dark'
      ? (['#000017', '#000074'] as const)
      : (['#FFFFFF', '#FFFFFF'] as const);


  const inputBackground = theme === 'dark' ? 'rgba(0, 0, 35, 0)' : '#FFFFFF';

  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  React.useEffect(() => {
    const loadProfile = async () => {
      // Use getSessionUser for faster initial load (avoids network roundtrip)
      const user = await authService.getSessionUser();
      if (user) {
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
        base64: true, // Request base64 for Web if needed, but we can try to use URI
      });

      if (!result.canceled && result.assets[0].uri) {
        // For web, URI might be a blob: or data: URL. 
        // If it's base64 (data:), we can pass it directly.
        // ImagePicker on web often returns base64 if requested, or a blob URI.
        
        let uriToUpload = result.assets[0].uri;
        if (result.assets[0].base64) {
           uriToUpload = `data:image/jpeg;base64,${result.assets[0].base64}`;
        }
        
        await uploadAvatar(uriToUpload);
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
      const result = await authService.uploadAvatar(user.id, uri);
      if (result.success && result.publicUrl) {
        setAvatar(result.publicUrl);
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
        updated_at: new Date(),
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
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.webBackButton} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/main');
            }
          }}
        >
           <Ionicons name="arrow-back" size={24} color={colors.primary} />
           <Text style={[styles.backButtonText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>

        {/* App Name */}
        <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.appName, { color: colors.primary }]}>
            PALINDROME®
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
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image
                source={avatar ? { uri: avatar } : require('../../assets/images/profile_ph.png')}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={[styles.editIcon, { backgroundColor: inputBackground }]}
                onPress={pickImage}
                disabled={uploading}
              >
                <Text style={[styles.editIconText, { color: colors.primary }]}>
                  {uploading ? '...' : '✎'}
                </Text>
              </TouchableOpacity>
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
                  value={email}
                  onChangeText={setEmail}
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
                  value={phone}
                  onChangeText={setPhone}
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
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardsSection}>
          <View
            style={[
              styles.fullWidthCard,
              styles.accessibilityCard,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.accessibilityTitle, { color: colors.text }]}>Accessibility</Text>
            <View style={styles.accessibilityRow}>
              <Text style={[styles.accessibilityLabel, { color: colors.text }]}>Color Blind Mode</Text>
              <Switch
                value={colorBlindEnabled}
                onValueChange={setColorBlindEnabled}
                circleSize={18}
                barHeight={22}
                backgroundActive={colors.primary}
                backgroundInactive="#ccc"
                circleActiveColor="#fff"
                circleInActiveColor="#fff"
                switchWidthMultiplier={2.5}
                renderActiveText={false}
                renderInActiveText={false}
              />
            </View>
            <Text style={[styles.accessibilitySubtitle, { color: colors.secondaryText }]}>
              Choose how colors are represented in the game.
            </Text>

            <View style={styles.modeGrid}>
              {(['symbols', 'emojis', 'cards', 'letters'] as const).map((mode) => {
                const selected = colorBlindMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setColorBlindMode(mode)}
                    style={[
                      styles.modeTile,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? (theme === 'dark' ? 'rgba(0,96,255,0.20)' : 'rgba(0,96,255,0.08)') : 'transparent',
                      },
                    ]}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.modeTitle, { color: colors.text }]}>
                      {mode === 'symbols'
                        ? 'Symbols'
                        : mode === 'emojis'
                          ? 'Emojis'
                          : mode === 'cards'
                            ? 'Cards'
                            : 'Letters'}
                    </Text>
                    <View style={styles.modePreviewRow}>
                      {displayGradients.map((g, i) => (
                        <LinearGradient key={i} colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modePreviewSwatch}>
                          <Text style={styles.modePreviewToken}>{getColorBlindToken(mode, i)}</Text>
                        </LinearGradient>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.fullWidthCard,
              styles.customColorsCard,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.accessibilityTitle, { color: colors.text }]}>Customize colors</Text>
            <Text style={[styles.accessibilitySubtitle, { color: colors.secondaryText, marginTop: 4 }]}>
              Tap a block to change its color. Use the picker or enter a hex code.
            </Text>
            <View style={styles.colorBlocksRow}>
              {editingColors.map((gradient, index) => {
                const selected = selectedColorIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedColorIndex(selected ? null : index)}
                    style={[
                      styles.colorBlockTapTarget,
                      selected && { borderColor: colors.primary, borderWidth: 3 },
                    ]}
                    activeOpacity={0.9}
                  >
                    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.colorBlockSwatch} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedColorIndex !== null && (
              <View style={styles.colorSelectorPanel}>
                <Text style={[styles.colorSelectorTitle, { color: colors.text }]}>
                  Editing block {selectedColorIndex + 1}
                </Text>
                <View style={styles.pickerWrapper}>
                  <HexColorPicker
                    color={pickerHex || editingColors[selectedColorIndex][0]}
                    onChange={handlePickerChange}
                  />
                </View>
                <View style={styles.hexInputRow}>
                  <View style={[styles.hexPreviewSwatch, { backgroundColor: pickerHex || editingColors[selectedColorIndex][0] }]} />
                  <HexColorInput
                    color={pickerHex || editingColors[selectedColorIndex][0]}
                    onChange={(hex) => {
                      setPickerHex(hex);
                      commitPickerColor(hex);
                    }}
                    prefixed
                    style={{
                      flex: 1,
                      height: 44,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingLeft: 14,
                      paddingRight: 14,
                      fontSize: 15,
                      fontFamily: 'Geist-Regular',
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    }}
                  />
                </View>
              </View>
            )}
            <View style={styles.colorActionsRow}>
              <TouchableOpacity
                style={[styles.resetColorsButton, { borderColor: colors.border }]}
                onPress={() => {
                  setEditingColors([...DEFAULT_GAME_GRADIENTS]);
                  setColorsSaved(false);
                }}
              >
                <Text style={[styles.resetColorsButtonText, { color: colors.text }]}>Reset to default</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveColorsButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  await setCustomGameColors(editingColors);
                  setColorsSaved(true);
                }}
              >
                <Text style={styles.saveButtonText}>{colorsSaved ? 'Saved' : 'Save colors'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
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
    position: 'relative', // Ensure absolute children are relative to this
  },
  webBackButton: {
    position: 'absolute',
    top: 40,
    left: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    cursor: 'pointer',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist-Bold',
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
  cardsSection: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 18,
    gap: 20,
  },
  fullWidthCard: {
    width: '100%',
  },
  accessibilityCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  customColorsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  colorBlocksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
    justifyContent: 'center',
  },
  colorBlockTapTarget: {
    padding: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  colorBlockSwatch: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  colorSelectorPanel: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.25)',
  },
  colorSelectorTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'Geist-Bold',
  },
  pickerWrapper: {
    height: 220,
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexPreviewSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  hexColorInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Geist-Regular',
  },
  colorRow: {
    marginTop: 12,
  },
  colorRowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  colorPreviewSwatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  colorRowText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Geist-Regular',
  },
  hueBarContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  lightnessBarContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hueBarSegment: {
    flex: 1,
    minWidth: 2,
  },
  colorActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  resetColorsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetColorsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveColorsButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  accessibilityTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  accessibilityRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessibilityLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  accessibilitySubtitle: {
    marginTop: 10,
    fontSize: 13,
  },
  modeGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  modeTile: {
    flex: 1,
    minWidth: 200,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  modePreviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePreviewSwatch: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modePreviewToken: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
