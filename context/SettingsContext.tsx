import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ColorBlindMode = 'symbols' | 'emojis' | 'cards' | 'letters';

type SettingsContextValue = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  colorBlindEnabled: boolean;
  colorBlindMode: ColorBlindMode;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setColorBlindEnabled: (enabled: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  soundEnabled: true,
  hapticsEnabled: true,
  colorBlindEnabled: false,
  colorBlindMode: 'symbols',
  setSoundEnabled: () => {},
  setHapticsEnabled: () => {},
  setColorBlindEnabled: () => {},
  setColorBlindMode: () => {},
});

const SOUND_ENABLED_KEY = 'appSoundEnabled';
const HAPTICS_ENABLED_KEY = 'appHapticsEnabled';
const COLOR_BLIND_ENABLED_KEY = 'appColorBlindEnabled';
const COLOR_BLIND_MODE_KEY = 'appColorBlindMode';

const COLOR_BLIND_MODES: readonly ColorBlindMode[] = ['symbols', 'emojis', 'cards', 'letters'] as const;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [colorBlindEnabled, setColorBlindEnabledState] = useState(false);
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>('symbols');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [soundValue, hapticsValue, colorBlindEnabledValue, colorBlindModeValue] = await Promise.all([
          AsyncStorage.getItem(SOUND_ENABLED_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
          AsyncStorage.getItem(COLOR_BLIND_ENABLED_KEY),
          AsyncStorage.getItem(COLOR_BLIND_MODE_KEY),
        ]);

        if (soundValue === 'true' || soundValue === 'false') {
          setSoundEnabledState(soundValue === 'true');
        }
        if (hapticsValue === 'true' || hapticsValue === 'false') {
          setHapticsEnabledState(hapticsValue === 'true');
        }
        if (colorBlindEnabledValue === 'true' || colorBlindEnabledValue === 'false') {
          setColorBlindEnabledState(colorBlindEnabledValue === 'true');
        }
        if (colorBlindModeValue && (COLOR_BLIND_MODES as readonly string[]).includes(colorBlindModeValue)) {
          setColorBlindModeState(colorBlindModeValue as ColorBlindMode);
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const setSoundEnabled = async (enabled: boolean) => {
    try {
      setSoundEnabledState(enabled);
      await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.log('Error saving sound setting:', error);
    }
  };

  const setHapticsEnabled = async (enabled: boolean) => {
    try {
      setHapticsEnabledState(enabled);
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.log('Error saving haptics setting:', error);
    }
  };

  const setColorBlindEnabled = async (enabled: boolean) => {
    try {
      setColorBlindEnabledState(enabled);
      await AsyncStorage.setItem(COLOR_BLIND_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.log('Error saving color blind setting:', error);
    }
  };

  const setColorBlindMode = async (mode: ColorBlindMode) => {
    try {
      setColorBlindModeState(mode);
      await AsyncStorage.setItem(COLOR_BLIND_MODE_KEY, mode);
    } catch (error) {
      console.log('Error saving color blind mode:', error);
    }
  };

  const value = useMemo(
    () => ({
      soundEnabled,
      hapticsEnabled,
      colorBlindEnabled,
      colorBlindMode,
      setSoundEnabled,
      setHapticsEnabled,
      setColorBlindEnabled,
      setColorBlindMode,
    }),
    [soundEnabled, hapticsEnabled, colorBlindEnabled, colorBlindMode],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
