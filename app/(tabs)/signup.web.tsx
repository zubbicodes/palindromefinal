import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

export default function SignUpWeb() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agree, setAgree] = useState(false);

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
              Create your account
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#555',
              }}
            >
              Enter the Palindrome Realm
            </p>
          </div>
        </div>

        {/* Right Form (outer wrapper - no padding/border) */}
        <div
          style={{
            flex: 1,
            minWidth: '400px',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          {/* ---------- bordered card: ONLY these items inside ---------- */}
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
                {/* Name */}
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
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
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
               {/* ✅ Checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#333',
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
              I've read and agree to the{' '}
              <span
                style={{
                  color: '#B7463F',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                terms 
              </span> {' '}
              or {' '}
                <span
                    style={{
                      color: '#B7463F',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                >
                  privacy policy
                </span>
            </label>
          </div>

              {/* Login button (inside card) */}
              <button
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
                Sign Up
              </button>
            </div>
          </div>
          {/* ---------- end bordered card ---------- */}

          {/* -------- OUTSIDE the card: footer -------- */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#2A2A2A' }}>
            Already have an account?{' '}
            <span style={{ color: '#007BFF', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
              Log In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
