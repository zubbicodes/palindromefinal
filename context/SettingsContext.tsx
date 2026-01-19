import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SettingsContextValue = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  soundEnabled: true,
  hapticsEnabled: true,
  setSoundEnabled: () => {},
  setHapticsEnabled: () => {},
});

const SOUND_ENABLED_KEY = 'appSoundEnabled';
const HAPTICS_ENABLED_KEY = 'appHapticsEnabled';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [soundValue, hapticsValue] = await Promise.all([
          AsyncStorage.getItem(SOUND_ENABLED_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
        ]);

        if (soundValue === 'true' || soundValue === 'false') {
          setSoundEnabledState(soundValue === 'true');
        }
        if (hapticsValue === 'true' || hapticsValue === 'false') {
          setHapticsEnabledState(hapticsValue === 'true');
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

  const value = useMemo(
    () => ({
      soundEnabled,
      hapticsEnabled,
      setSoundEnabled,
      setHapticsEnabled,
    }),
    [soundEnabled, hapticsEnabled],
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

