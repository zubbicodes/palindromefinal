import { authService } from '@/authService';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '../../utils/authErrors';

export default function LoginWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors, theme } = useTheme();



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

  // Handle login with Firebase
  const handleLogin = async () => {
    // Reset error
    setError('');

    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signIn(email, password);

      if (result.success) {
        router.replace('/main');
      } else {
        // Show friendly error message
        const friendlyError = result.error ? getFriendlyErrorMessage(result.error) : 'Login failed. Please try again.';
        setError(friendlyError);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const friendlyError = err.code ? getFriendlyErrorMessage(err.code) : 'An unexpected error occurred';
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        alert('Password reset email sent! Check your inbox.');
        setError('');
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success) {
        setError(result.error || 'Google sign-in failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await authService.signInWithApple();
      if (!result.success) {
        setError(result.error || 'Apple sign-in failed');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Apple sign-in failed');
      setLoading(false);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

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
          overflowY: windowWidth < 900 ? 'auto' : 'hidden',
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
          PALINDROME®
        </div>

        {/* Error Message (Only shown if there's an error) */}
        {error && (
          <div
            style={{
              marginTop: '20px',
              padding: '12px 20px',
              backgroundColor: colors.error + '20',
              border: `1px solid ${colors.error}`,
              borderRadius: '8px',
              color: colors.error,
              fontSize: '14px',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

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
              minWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              marginTop: '60px'
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
              marginTop: '80px'
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
                backgroundColor: theme === 'dark' ? 'rgba(25, 25, 91, 0.7)' : '#FFFFFF',
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
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
                    disabled={loading}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
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
                    onClick={handleForgotPassword}
                    style={{
                      fontSize: '14px',
                      color: colors.error,
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Forgot password?
                  </span>
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '50px',
                    backgroundColor: loading ? colors.secondaryText : colors.buttonPrimary,
                    color: colors.buttonText,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 96, 255, 0.3)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Logging in...' : 'Log In'}
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

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '50px',
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <img src="/images/google.png" alt="Google" style={{ width: 18, height: 18 }} />
                Continue with Google
              </button>

              <button
                onClick={handleAppleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '50px',
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <Ionicons name="logo-apple" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
                Continue with Apple
              </button>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '14px', color: colors.text }}>
              New on Palindrome?{' '}
              <button
                onClick={() => router.push('/signup')}
                disabled={loading}
                style={{
                  color: colors.primary,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '14px',
                  opacity: loading ? 0.5 : 1,
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
