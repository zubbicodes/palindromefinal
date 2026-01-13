import { useEffect, useState } from 'react';

export default function SplashScreen({ onReady }) {
  const [imagesLoaded, setImagesLoaded] = useState({ bg: false, logo: false });

  const handleImageLoad = (imageKey) => {
    console.log(`Image loaded: ${imageKey}`);
    setImagesLoaded(prev => {
      const newState = { ...prev, [imageKey]: true };
      if (newState.bg && newState.logo && onReady) {
        setTimeout(() => onReady(), 300);
      }
      return newState;
    });
  };

  const allLoaded = imagesLoaded.bg && imagesLoaded.logo;

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Fallback timer triggered');
      setImagesLoaded({ bg: true, logo: true });
      if (onReady) {
        setTimeout(() => onReady(), 300);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div style={styles.container}>
      <img
        src="/images/bg.png"
        style={{ ...styles.background, opacity: allLoaded ? 1 : 0 }}
        onLoad={() => handleImageLoad('bg')}
        onError={() => handleImageLoad('bg')}
        alt="background"
      />

      <div style={{ ...styles.contentContainer, opacity: allLoaded ? 1 : 0 }}>
        <img
          src="/images/bulldog.png"
          style={styles.logo}
          onLoad={() => handleImageLoad('logo')}
          onError={() => handleImageLoad('logo')}
          alt="Palindrome Logo"
        />

        <h1 style={styles.title}>PALINDROME®</h1>
        <p style={styles.subtitle}>BY GAMMA GAMES</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000428',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in',
  },

  backgroundFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  },

  contentContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'opacity 0.3s ease-in',
  },

  logo: {
    width: '200px',
    height: '200px',
    marginBottom: '60px',
    objectFit: 'contain',
  },

  logoFallback: {
    width: '200px',
    height: '200px',
    marginBottom: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
  },

  logoPlaceholder: {
    color: '#0060FF',
    fontSize: '16px',
    fontWeight: 'bold',
  },

  title: {
    margin: 0,
    textAlign: 'center',
    color: '#0060FF',
    fontSize: 'clamp(28px, 7vw, 48px)',
    fontWeight: '700',
    letterSpacing: '6px',
    marginBottom: '10px',
    fontFamily: 'Geist-Bold',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    maxWidth: '95vw',
    overflow: 'hidden',
    textOverflow: 'clip',
  },

  subtitle: {
    margin: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '400',
    letterSpacing: '4px',
    fontFamily: 'Geist-Regular',
    textTransform: 'uppercase',
  },
};
