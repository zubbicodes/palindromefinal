import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

export default function SignUpWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);
  const { colors, theme } = useTheme();

  // CSS styles for placeholder
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
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: colors.background,
        fontFamily: 'Geist, sans-serif',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Add CSS for placeholder */}
      <style>{placeholderStyles}</style>

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
          background: theme === 'dark' ? 'rgba(10, 15, 45, 0.9)' : '#FFFFFF',
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
          padding: '80px 40px',
          gap: '60px',
          flexWrap: 'wrap',
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
              width: '400px',
              textAlign: 'right',
            }}
          >
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 700,
                marginBottom: '10px',
                color: colors.text,
                transition: 'color 0.3s ease',
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: colors.secondaryText,
                transition: 'color 0.3s ease',
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
            minWidth: '400px',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          {/* Form Card */}
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '32px',
              boxShadow: theme === 'dark' 
                ? '0 4px 20px rgba(0, 96, 255, 0.1)' 
                : '0 2px 10px rgba(0,0,0,0.04)',
              marginBottom: '20px',
              background: colors.card,
              transition: 'all 0.3s ease',
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
                    backgroundColor: colors.card,
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
                    lineHeight: '1',
                    transition: 'all 0.3s ease',
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
                    boxSizing: 'border-box',
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    transition: 'all 0.3s ease',
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
                    backgroundColor: colors.card,
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
                    lineHeight: '1',
                    transition: 'all 0.3s ease',
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
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    transition: 'all 0.3s ease',
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
                    backgroundColor: colors.card,
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    transform: 'translateY(-50%)',
                    lineHeight: '1',
                    zIndex: 1,
                    transition: 'all 0.3s ease',
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
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    transition: 'all 0.3s ease',
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
                    transition: 'color 0.3s ease',
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
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: colors.text,
                  transition: 'color 0.3s ease',
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
                  I have read and agree to the{' '}
                  <span
                    style={{
                      color: colors.primary,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    terms 
                  </span>{' '}
                  or{' '}
                  <span
                    style={{
                      color: colors.primary,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    privacy policy
                  </span>
                </label>
              </div>

              {/* Sign Up button */}
              <button
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '50px',
                  backgroundColor: colors.primary,
                  color: colors.buttonText,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: agree ? 1 : 0.6,
                }}
                disabled={!agree}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '14px', 
            color: colors.text,
            transition: 'color 0.3s ease',
          }}>
            Already have an account?{' '}
            <span style={{ 
              color: colors.primary, 
              fontWeight: 600, 
              cursor: 'pointer',
              textDecoration: 'none',
            }}>
              Log In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}