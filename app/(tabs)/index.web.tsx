import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; // ✅ import router from expo-router
import React, { useState } from 'react';

export default function LoginWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        fontFamily: 'Geist, sans-serif',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          width: '100%',
          borderBottom: '1px solid #E5E5E5',
          padding: '20px 0',
          textAlign: 'center',
          fontWeight: 700,
          color: '#0060FF',
          fontSize: '22px',
          letterSpacing: '0.5px',
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
                color: '#000',
              }}
            >
              Login to your account
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#555',
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
              border: '1px solid #E0E0E0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              marginBottom: '20px',
              background: '#fff',
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
                    backgroundColor: '#fff',
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#333',
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
                    border: '1px solid #EFE8E8',
                    borderRadius: '10px',
                    fontSize: '16px',
                    outline: 'none',
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
                    backgroundColor: '#fff',
                    padding: '0 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#333',
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
                    border: '1px solid #EFE8E8',
                    borderRadius: '10px',
                    fontSize: '16px',
                    outline: 'none',
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
                    color: '#777',
                  }}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye' : 'eye-off'}
                    size={20}
                    color="#777"
                  />
                </button>
              </div>

              {/* Forgot password */}
              <div
                style={{
                  textAlign: 'right',
                  marginTop: '-10px',
                  marginBottom: '0',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: '#FF002B',
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
                  backgroundColor: '#007BFF',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Log In
              </button>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ width: '70px', height: '1px', background: '#E0E0E0' }} />
            <span
              style={{
                margin: '0 10px',
                color: '#007BFF',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              or
            </span>
            <div style={{ width: '70px', height: '1px', background: '#E0E0E0' }} />
          </div>

          {/* Social Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <button
              style={{
                flex: 1,
                borderRadius: '50px',
                border: '1px solid #EFE8E8',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              <img src="/images/google.png" alt="Google" style={{ width: '18px', marginRight: '8px' }} />
              Sign in with Google
            </button>

            <button
              style={{
                flex: 1,
                borderRadius: '50px',
                border: '1px solid #EFE8E8',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              <img src="/images/apple.png" alt="Apple" style={{ width: '18px', marginRight: '8px' }} />
              Sign in with Apple
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#2A2A2A' }}>
            New on Palindrome?{' '}
            <button
              onClick={() => router.push('/signup')} // ✅ Expo Router navigation
              style={{
                color: '#007BFF',
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
  );
}
