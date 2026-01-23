# Google Authentication Setup Guide

This comprehensive guide will walk you through setting up Google Authentication for your Expo app with Supabase, step by step.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Google Cloud Console Setup](#step-1-google-cloud-console-setup)
3. [Step 2: Firebase Console Setup](#step-2-firebase-console-setup)
4. [Step 3: Supabase Configuration](#step-3-supabase-configuration)
5. [Step 4: Configure Your App](#step-4-configure-your-app)
6. [Step 5: Building APK Locally](#step-5-building-apk-locally)
7. [Step 6: Testing](#step-6-testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
- ✅ A Google account
- ✅ A Supabase account and project
- ✅ Android Studio installed
- ✅ Your app's package name: `com.gammagames.palindromeuk`
- ✅ Your app's bundle identifier (iOS): `com.gammagames.palindromeuk`

---

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"** (or select an existing project)
4. Enter project name: `Palindrome App` (or any name you prefer)
5. Click **"Create"**
6. Wait for the project to be created, then select it

### 1.2 Enable Google+ API (if needed)

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** (or "Google Sign-In API")
3. Click on it and click **"Enable"** (if not already enabled)

### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"** in the left sidebar
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### 1.4 Configure OAuth Consent Screen (First Time Only)

If this is your first time, you'll need to configure the consent screen:

1. You'll be prompted to configure the consent screen - click **"Configure Consent Screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `Palindrome`
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"** (default scopes are fine)
7. On **"Test users"** page, click **"Save and Continue"** (add test users if needed)
8. Click **"Back to Dashboard"**

### 1.5 Create Web Client ID (For Supabase)

1. Go back to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Give it a name: `Palindrome Web Client`
5. **Authorized JavaScript origins**: Add your Supabase redirect URLs:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co`
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Your web app URL (e.g., `https://gammagamesbyoxford.com`)
6. **Authorized redirect URIs**: Add:
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Your web app callback URL (e.g., `https://gammagamesbyoxford.com/auth/callback`)
7. Click **"Create"**
8. **IMPORTANT**: Copy the **Client ID** - this is your **Web Client ID** (you'll need this for Supabase and as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)

### 1.6 Create Android OAuth Client ID

1. Still in **"Credentials"**, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
2. Select **"Android"** as the application type
3. Give it a name: `Palindrome Android`
4. **Package name**: `com.gammagames.palindrome` (your app's package name)
5. **SHA-1 certificate fingerprint**: You'll need to get this from your keystore
   - We'll cover this in [Step 5](#step-5-building-apk-locally)
   - For now, you can add it later or use the debug keystore SHA-1
6. Click **"Create"**
7. **Note the Client ID** (you might need it, but the Web Client ID is more important)

### 1.7 Get SHA-1 Certificate Fingerprint (For Android)

You need the SHA-1 fingerprint from your keystore. Here's how to get it:

#### For Debug Build (Testing):
```bash
# On Windows (PowerShell)
cd android
.\gradlew signingReport

# Or using keytool directly
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Look for the **SHA1** value in the output.

#### For Release Build:
```bash
# If you have a release keystore
keytool -list -v -keystore release.keystore -alias your-key-alias
```

**Copy the SHA-1 fingerprint** and add it to your Android OAuth client in Google Cloud Console.

---

## Step 2: Firebase Console Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select existing)
3. Enter project name: `Palindrome` (or same as Google Cloud project)
4. Click **"Continue"**
5. Disable Google Analytics (optional) or enable it
6. Click **"Create project"**
7. Wait for project creation, then click **"Continue"**

### 2.2 Add Android App to Firebase

1. In Firebase Console, click the **Android icon** (or **"Add app"** > **Android**)
2. **Android package name**: `com.gammagames.palindrome`
3. **App nickname** (optional): `Palindrome Android`
4. **Debug signing certificate SHA-1**: Paste your SHA-1 fingerprint here
5. Click **"Register app"**
6. **Download `google-services.json`**:
   - Click **"Download google-services.json"**
   - **IMPORTANT**: Save this file to your project root: `./google-services.json`
   - Also copy it to: `./android/app/google-services.json`

### 2.3 Add iOS App to Firebase (Optional for now)

1. Click **"Add app"** > **iOS**
2. **iOS bundle ID**: `com.gammagames.palindrome`
3. **App nickname**: `Palindrome iOS`
4. Click **"Register app"**
5. **Download `GoogleService-Info.plist`**:
   - Click **"Download GoogleService-Info.plist"**
   - Save to your project root: `./GoogleService-Info.plist`

### 2.4 Enable Google Sign-In in Firebase

1. In Firebase Console, go to **"Authentication"** in the left sidebar
2. Click **"Get started"** (if first time)
3. Click on the **"Sign-in method"** tab
4. Click on **"Google"**
5. **Enable** the Google provider
6. **Project support email**: Select your email
7. **Web SDK configuration**: 
   - The Web client ID should auto-populate (from Google Cloud Console)
   - If not, paste your Web Client ID from Step 1.5
8. Click **"Save"**

---

## Step 3: Supabase Configuration

### 3.1 Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **"Authentication"** > **"Providers"** in the left sidebar
4. Find **"Google"** in the list
5. Click to enable it
6. **Client ID (for OAuth)**: Paste your **Web Client ID** from Step 1.5
7. **Client Secret (for OAuth)**: 
   - Go back to Google Cloud Console
   - Go to **"APIs & Services"** > **"Credentials"**
   - Click on your **Web Client** OAuth 2.0 Client ID
   - Copy the **Client secret**
   - Paste it in Supabase
8. **Authorized Client IDs (optional)**: Add your Web Client ID
9. Click **"Save"**

### 3.2 Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **"Authentication"** > **"URL Configuration"**
2. **Site URL**: Your production URL (e.g., `https://gammagamesbyoxford.com`)
3. **Redirect URLs**: Add:
   - `https://gammagamesbyoxford.com/auth/callback`
   - `http://localhost:8081/auth/callback` (for local development)
   - `exp://localhost:8081/--/auth/callback` (for Expo Go - though Google Sign-In won't work in Expo Go)
   - Your custom scheme: `palindrome://auth/callback`

---

## Step 4: Configure Your App

### 4.1 Add Environment Variable

Create or update your `.env` file (or `.env.local`) in the project root:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id-here.apps.googleusercontent.com
```

**Replace `your-web-client-id-here`** with your actual Web Client ID from Step 1.5.

### 4.2 Place Service Files

Make sure you have the following files in your project root:

1. **`google-services.json`** (from Firebase Step 2.2)
   - Should be in: `./google-services.json`
   - Also copy to: `./android/app/google-services.json`

2. **`GoogleService-Info.plist`** (from Firebase Step 2.3, for iOS)
   - Should be in: `./GoogleService-Info.plist`

### 4.3 Install Dependencies

Run in your project root:

```bash
npm install
# or
yarn install
```

This will install `@react-native-google-signin/google-signin` that we added to `package.json`.

### 4.4 Prebuild (Generate Native Code)

Since Google Sign-In requires native code, you need to generate the native projects:

```bash
npx expo prebuild --clean
```

This will:
- Generate `android/` and `ios/` folders
- Apply all plugins including Google Sign-In
- Configure native code

---

## Step 5: Building APK Locally

### 5.1 Important Note About Expo Go

⚠️ **Google Sign-In does NOT work in Expo Go** because it requires custom native code. You need to build a **development build** or **production APK**.

### 5.2 Get SHA-1 Fingerprint for Release Build

If you have a release keystore:

```bash
# Windows PowerShell
keytool -list -v -keystore release.keystore -alias your-key-alias
```

Enter your keystore password when prompted.

**Copy the SHA-1** and:
1. Add it to Google Cloud Console (Android OAuth client)
2. Add it to Firebase (Android app settings)

### 5.3 Configure Release Keystore

If you don't have a release keystore, create one:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias palindrome-release -keyalg RSA -keysize 2048 -validity 10000
```

Follow the prompts to create your keystore.

### 5.4 Build Debug APK

1. Open Android Studio
2. Open your project: File > Open > Select `android` folder
3. Wait for Gradle sync to complete
4. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
5. Wait for build to complete
6. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5.5 Build Release APK

1. Configure signing in `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../release.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'palindrome-release'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

2. In Android Studio:
   - Go to **Build** > **Generate Signed Bundle / APK**
   - Select **APK**
   - Choose your keystore
   - Select **release** build variant
   - Click **Finish**

3. APK will be at: `android/app/release/app-release.apk`

### 5.6 Alternative: Build via Command Line

```bash
# Debug APK
cd android
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease
```

APKs will be in `android/app/build/outputs/apk/`

---

## Step 6: Testing

### 6.1 Test on Web

1. Start your development server:
```bash
npm start
# or
npx expo start --web
```

2. Open your web app
3. Click "Continue with Google"
4. You should be redirected to Google sign-in
5. After signing in, you should be redirected back

### 6.2 Test on Android (Development Build)

1. Build and install a development build:
```bash
npx expo run:android
```

This will:
- Build the app with native code
- Install it on your connected device/emulator
- Start the app

2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be authenticated

### 6.3 Test Release APK

1. Build release APK (see Step 5.5)
2. Transfer APK to your Android device
3. Enable "Install from unknown sources" on your device
4. Install the APK
5. Open the app and test Google Sign-In

---

## Troubleshooting

### Issue: "Google Sign-In failed" on Android

**Solutions:**
1. Verify `google-services.json` is in `android/app/`
2. Check SHA-1 fingerprint is added to Google Cloud Console
3. Ensure package name matches: `com.gammagames.palindrome`
4. Run `npx expo prebuild --clean` again

### Issue: "No ID token found"

**Solutions:**
1. Verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set correctly
2. Check that Web Client ID is correct in Supabase
3. Ensure Google Sign-In is enabled in Firebase

### Issue: "Sign in cancelled" when clicking Google button

**Solutions:**
1. Check that OAuth consent screen is configured
2. Verify redirect URLs in Supabase
3. Ensure app is not in restricted mode in Google Cloud Console

### Issue: APK build fails

**Solutions:**
1. Clean build: `cd android && ./gradlew clean`
2. Delete `android/.gradle` folder
3. Run `npx expo prebuild --clean` again
4. Check Android Studio for specific error messages

### Issue: Google Sign-In doesn't work in Expo Go

**This is expected!** Google Sign-In requires native code. You must:
- Use `npx expo run:android` for development builds
- Build APK for testing (see Step 5)

---

## Quick Checklist

Before testing, verify:

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 Web Client ID created
- [ ] OAuth 2.0 Android Client ID created (with SHA-1)
- [ ] Firebase project created
- [ ] `google-services.json` downloaded and placed correctly
- [ ] Google Sign-In enabled in Firebase
- [ ] Supabase Google provider configured with Client ID and Secret
- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set in `.env`
- [ ] `npx expo prebuild --clean` run successfully
- [ ] SHA-1 fingerprint added to both Google Cloud and Firebase

---

## Additional Resources

- [Expo Google Sign-In Docs](https://docs.expo.dev/guides/authentication/#google)
- [React Native Google Sign-In Docs](https://github.com/react-native-google-signin/google-signin)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Firebase Setup Guide](https://firebase.google.com/docs/android/setup)

---

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify all configuration steps
3. Check that all IDs and secrets are correct
4. Ensure service files are in the correct locations
5. Try cleaning and rebuilding: `npx expo prebuild --clean`

Good luck! 🚀
