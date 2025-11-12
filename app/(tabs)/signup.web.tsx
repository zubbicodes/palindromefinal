import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';

export default function SignUpWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { colors, theme } = useTheme();

  // Track screen width for responsive scroll
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const placeholderStyles = `
    input::placeholder {
      color: ${colors.secondaryText} !important;
      opacity: 0.7;
    }
  `;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        overflowY: windowWidth < 900 ? 'auto' : 'hidden', // ✅ small screens scroll
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        background:
          theme === 'dark'
            ? 'linear-gradient(to right, #000017, #000074)'
            : '#FFFFFF',
        fontFamily: 'Geist, sans-serif',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <style>{placeholderStyles}</style>

      {/* ✅ Top Bar */}
      <LinearGradient
        colors={theme === 'dark' ? ['#000017', '#000074'] : ['#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: '100%',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: colors.primary,
            fontSize: '22px',
            letterSpacing: '0.5px',
          }}
        >
          PALINDROME
        </span>
      </LinearGradient>

      {/* ✅ Main Section */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1200px',
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
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              textAlign: 'right',
              margin: '0 auto',
            }}
          >
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                marginBottom: '10px',
                color: colors.text,
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: colors.secondaryText,
              }}
            >
              Enter the Palindrome Realm
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div
          style={{
            flex: 1,
            minWidth: '380px',
            maxWidth: '400px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '32px',
              boxShadow:
                theme === 'dark'
                  ? '0 4px 20px rgba(0, 96, 255, 0.1)'
                  : '0 2px 10px rgba(0,0,0,0.04)',
              marginBottom: '20px',
              background:
                theme === 'dark'
                  ? 'rgba(25, 25, 91, 0.7)'
                  : '#FFFFFF',
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
              {/* Name */}
              <div style={{ position: 'relative', width: '100%' }}>
                <label
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '16px',
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
                    lineHeight: '1',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    color: colors.text,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ position: 'relative', width: '100%' }}>
                <label
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '16px',
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
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
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    color: colors.text,
                    boxSizing: 'border-box',
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
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
                    lineHeight: '1',
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
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(25, 25, 91, 0.7)'
                        : '#F9FAFB',
                    color: colors.text,
                    boxSizing: 'border-box',
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

              {/* Checkbox */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: colors.text,
                }}
              >
                <input
                  type="checkbox"
                  id="agree"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  style={{
                    marginRight: '8px',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                  }}
                />
                <label htmlFor="agree">
                  I agree to the{' '}
                  <span
                    style={{
                      color: '#FF0000',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    terms
                  </span>{' '}
                  and{' '}
                  <span
                    style={{
                      color: '#FF0000',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    privacy policy
                  </span>
                </label>
              </div>

              {/* Signup Button */}
              <button
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
                }}
                disabled={!agree}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '14px',
              color: colors.text,
            }}
          >
            Already have an account?{' '}
            <span
              style={{
                color: colors.primary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Log In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
