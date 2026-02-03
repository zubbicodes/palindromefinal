import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ColorBlindMode = 'symbols' | 'emojis' | 'cards' | 'letters';
export type InteractionMode = 'drag' | 'pick';

type SettingsContextValue = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  colorBlindEnabled: boolean;
  colorBlindMode: ColorBlindMode;
  interactionMode: InteractionMode;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setColorBlindEnabled: (enabled: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setInteractionMode: (mode: InteractionMode) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  soundEnabled: true,
  hapticsEnabled: true,
  colorBlindEnabled: false,
  colorBlindMode: 'symbols',
  interactionMode: 'drag',
  setSoundEnabled: () => {},
  setHapticsEnabled: () => {},
  setColorBlindEnabled: () => {},
  setColorBlindMode: () => {},
  setInteractionMode: () => {},
});

const SOUND_ENABLED_KEY = 'appSoundEnabled';
const HAPTICS_ENABLED_KEY = 'appHapticsEnabled';
const COLOR_BLIND_ENABLED_KEY = 'appColorBlindEnabled';
const COLOR_BLIND_MODE_KEY = 'appColorBlindMode';
const INTERACTION_MODE_KEY = 'appInteractionMode';

const COLOR_BLIND_MODES: readonly ColorBlindMode[] = ['symbols', 'emojis', 'cards', 'letters'] as const;
const INTERACTION_MODES: readonly InteractionMode[] = ['drag', 'pick'] as const;

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [colorBlindEnabled, setColorBlindEnabledState] = useState(false);
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>('symbols');
  const [interactionMode, setInteractionModeState] = useState<InteractionMode>('drag');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [soundValue, hapticsValue, colorBlindEnabledValue, colorBlindModeValue, interactionModeValue] = await Promise.all([
          AsyncStorage.getItem(SOUND_ENABLED_KEY),
          AsyncStorage.getItem(HAPTICS_ENABLED_KEY),
          AsyncStorage.getItem(COLOR_BLIND_ENABLED_KEY),
          AsyncStorage.getItem(COLOR_BLIND_MODE_KEY),
          AsyncStorage.getItem(INTERACTION_MODE_KEY),
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
        if (interactionModeValue && (INTERACTION_MODES as readonly string[]).includes(interactionModeValue)) {
          setInteractionModeState(interactionModeValue as InteractionMode);
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

  const setInteractionMode = async (mode: InteractionMode) => {
    try {
      setInteractionModeState(mode);
      await AsyncStorage.setItem(INTERACTION_MODE_KEY, mode);
    } catch (error) {
      console.log('Error saving interaction mode:', error);
    }
  };

  const value = useMemo(
    () => ({
      soundEnabled,
      hapticsEnabled,
      colorBlindEnabled,
      colorBlindMode,
      interactionMode,
      setSoundEnabled,
      setHapticsEnabled,
      setColorBlindEnabled,
      setColorBlindMode,
      setInteractionMode,
    }),
    [soundEnabled, hapticsEnabled, colorBlindEnabled, colorBlindMode, interactionMode],
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
