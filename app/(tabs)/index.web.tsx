import { useTheme } from '@/context/ThemeContext'; // ✅ Theme import
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function LoginWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { colors, theme } = useTheme(); // ✅ Theme hook

  // Update width on resize
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSS for placeholder
  const placeholderStyles = `
    input::placeholder {
      color: ${colors.secondaryText} !important;
      opacity: 0.7;
    }
  `;

  return (
    <>
      <style>{placeholderStyles}</style>
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: theme === 'dark'
            ? 'linear-gradient(to right, #000017, #000074)'
            : '#FFFFFF',
          fontFamily: 'Geist, sans-serif',
          overflowY: windowWidth < 900 ? 'auto' : 'hidden', // ✅ small screens scroll
          boxSizing: 'border-box',
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            width: '100%',
            borderBottom: `1px solid ${colors.border}`,
            padding: '20px 0',
            textAlign: 'center',
            fontWeight: 700,
            color: colors.primary,
            fontSize: '22px',
            letterSpacing: '0.5px',
            background: theme === 'dark' ? 'linear-gradient(to right, #000017, #000074)' : '#FFFFFF',
            backdropFilter: 'blur(10px)',
          }}
        >
          PALINDROME
        </div>

        {/* Main Section */}
        <div
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '1100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '60px 40px',
            gap: '60px',
            flexWrap: 'wrap',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Text */}
          <div
            style={{
              flex: 1,
              minWidth: '340px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ width: '400px', textAlign: 'right' }}>
              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: colors.text,
                }}
              >
                Login to your account
              </h1>
              <p
                style={{
                  fontSize: '18px',
                  color: colors.secondaryText,
                }}
              >
                Continue Your Palindrome Journey
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div
            style={{
              flex: 1,
              minWidth: '400px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            {/* Bordered Card */}
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '32px',
                boxShadow: theme === 'dark'
                  ? '0 4px 20px rgba(0, 96, 255, 0.1)'
                  : '0 2px 10px rgba(0,0,0,0.04)',
                marginBottom: '20px',
                backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                {/* Email */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <label
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '16px',
                      backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                      padding: '0 6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.text,
                      transform: 'translateY(-50%)',
                      lineHeight: '1',
                    }}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. wilson09@gmail.com"
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                      color: colors.text,
                    }}
                  />
                </div>

                {/* Password */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <label
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '16px',
                      backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                      padding: '0 6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.text,
                      transform: 'translateY(-50%)',
                      lineHeight: '1',
                      zIndex: 1,
                    }}
                  >
                    Password
                  </label>
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="********"
                    style={{
                      width: '100%',
                      padding: '16px 42px 16px 16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                      color: colors.text,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.secondaryText,
                    }}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye' : 'eye-off'}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </button>
                </div>

                {/* Forgot password */}
                <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '0' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      color: colors.error,
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Forgot password?
                  </span>
                </div>

                {/* Login Button */}
                <button
                  onClick={() => router.push('/gamelayout')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '50px',
                    backgroundColor: colors.buttonPrimary,
                    color: colors.buttonText,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 96, 255, 0.3)',
                  }}
                >
                  Log In
                </button>
              </div>
            </div>

            {/* Divider & Social Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ width: '70px', height: '1px', background: colors.border }} />
              <span style={{ color: colors.primary, fontWeight: 600, fontSize: '14px' }}>or</span>
              <div style={{ width: '70px', height: '1px', background: colors.border }} />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
              }}
            >
              <button
                style={{
                  flex: 1,
                  borderRadius: '50px',
                  border: `1px solid ${colors.border}`,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: theme === 'dark' ? 'rgba(25,25,91,1)' : '#FFFFFF',
                  color: colors.text,
                }}
              >
                <img src="/images/google.png" alt="Google" style={{ width: '18px', marginRight: '8px' }} />
                Sign in with Google
              </button>
              <button
                style={{
                  flex: 1,
                  borderRadius: '50px',
                  border: `1px solid ${colors.border}`,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#F9FAFB',
                  color: colors.text,
                }}
              >
                <img src="/images/apple.png" alt="Apple" style={{ width: '18px', marginRight: '8px' }} />
                Sign in with Apple
              </button>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '14px', color: colors.text }}>
              New on Palindrome?{' '}
              <button
                onClick={() => router.push('/signup')}
                style={{
                  color: colors.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '14px',
                }}
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
