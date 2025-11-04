import { useThemeContext } from '@/context/ThemeContext';

const Colors = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    card: '#F3F3F3',
    tint: '#2f95dc',
  },
  dark: {
    // 🎨 Figma gradient base tones
    background: '#000017', // gradient ka start tone fallback ke liye
    text: '#FFFFFF',
    card: '#000074', // gradient ka end tone fallback ke liye
    tint: '#809CFF',
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { theme } = useThemeContext(); // <-- ab sahi context se theme milega
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
