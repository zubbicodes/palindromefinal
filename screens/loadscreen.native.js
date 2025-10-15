import { useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const scale = size => (width / 375) * size;
const verticalScale = size => (height / 812) * size;

export default function SplashScreen({ onReady }) {
  const [imagesLoaded, setImagesLoaded] = useState({ bg: false, logo: false });

  const handleImageLoad = (imageKey) => {
    setImagesLoaded(prev => {
      const newState = { ...prev, [imageKey]: true };
      if (newState.bg && newState.logo && onReady) {
        onReady();
      }
      return newState;
    });
  };

  const allLoaded = imagesLoaded.bg && imagesLoaded.logo;

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/bg.png')}
        style={[styles.background, { opacity: allLoaded ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={() => handleImageLoad('bg')}
      />

      <View style={[styles.contentContainer, { opacity: allLoaded ? 1 : 0 }]}>
        <Image
          source={require('../assets/images/bulldog.png')}
          style={styles.logo}
          resizeMode="contain"
          onLoad={() => handleImageLoad('logo')}
        />

        <Text style={styles.title}>PALINDROME</Text>
        <Text style={styles.subtitle}>BY GAMMA GAMES</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000428',
  },

  background: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },

  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(80),
  },

  logo: {
    width: scale(180),
    height: scale(180),
    marginBottom: verticalScale(80),
  },

  title: {
    textAlign: 'center',
    color: '#0060FF',
    fontSize: scale(48),
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: verticalScale(8),
    fontFamily: Platform.select({
      ios: 'Geist-Bold',
      android: 'Geist-Bold',
      default: 'sans-serif',
    }),
  },

  subtitle: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '400',
    letterSpacing: 4,
    fontFamily: Platform.select({
      ios: 'Geist-Regular',
      android: 'Geist-Regular',
      default: 'sans-serif',
    }),
  },
});