# Google Auth Quick Start Checklist

Use this checklist to ensure you've completed all steps for Google Authentication setup.

## ✅ Pre-Setup

- [ ] Google account ready
- [ ] Supabase project created
- [ ] Android Studio installed
- [ ] Project package name confirmed: `com.gammagames.palindrome`

## ✅ Step 1: Google Cloud Console

- [ ] Project created in Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] **Web Client ID** created (for Supabase)
  - [ ] Client ID copied: `___________________________`
  - [ ] Client Secret copied: `___________________________`
- [ ] **Android Client ID** created
  - [ ] Package name set: `com.gammagames.palindrome`
  - [ ] SHA-1 fingerprint added (see SHA1_FINGERPRINT_GUIDE.md)

## ✅ Step 2: Firebase Console

- [ ] Firebase project created
- [ ] Android app added to Firebase
  - [ ] Package name: `com.gammagames.palindrome`
  - [ ] SHA-1 fingerprint added
  - [ ] `google-services.json` downloaded
- [ ] iOS app added to Firebase (optional)
  - [ ] Bundle ID: `com.gammagames.palindrome`
  - [ ] `GoogleService-Info.plist` downloaded
- [ ] Google Sign-In enabled in Firebase Authentication

## ✅ Step 3: Supabase Configuration

- [ ] Google provider enabled in Supabase
- [ ] Web Client ID added to Supabase
- [ ] Client Secret added to Supabase
- [ ] Redirect URLs configured in Supabase:
  - [ ] Production URL: `https://gammagamesbyoxford.com/auth/callback`
  - [ ] Local development URL: `http://localhost:8081/auth/callback`

## ✅ Step 4: App Configuration

- [ ] `.env` file created with:
  ```env
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-actual-client-id
  ```
- [ ] `google-services.json` placed in:
  - [ ] Project root: `./google-services.json`
  - [ ] Android app: `./android/app/google-services.json`
- [ ] `GoogleService-Info.plist` placed in project root (iOS)
- [ ] Dependencies installed: `npm install`
- [ ] Native code generated: `npx expo prebuild --clean`

## ✅ Step 5: Build & Test

- [ ] SHA-1 fingerprint obtained (see SHA1_FINGERPRINT_GUIDE.md)
- [ ] SHA-1 added to Google Cloud Console
- [ ] SHA-1 added to Firebase Console
- [ ] Debug APK built and tested
- [ ] Release APK built (if needed)

## ✅ Testing

- [ ] Web: Google Sign-In works
- [ ] Android (Development Build): Google Sign-In works
- [ ] Android (Release APK): Google Sign-In works

## 🔧 Troubleshooting Checklist

If Google Sign-In doesn't work, check:

- [ ] All IDs and secrets are correct (no typos)
- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set in `.env`
- [ ] Service files are in correct locations
- [ ] SHA-1 fingerprint matches the keystore used to sign APK
- [ ] Package name matches everywhere: `com.gammagames.palindrome`
- [ ] Redirect URLs are correct in Supabase
- [ ] Waited 5-10 minutes after adding SHA-1 (propagation time)
- [ ] Ran `npx expo prebuild --clean` after configuration changes

## 📝 Important Notes

1. **Google Sign-In does NOT work in Expo Go** - you need a development build or APK
2. **SHA-1 is required** for Android - get it using methods in SHA1_FINGERPRINT_GUIDE.md
3. **Web Client ID** is the most important - use it for both web and native
4. **Wait time**: Changes in Google Cloud/Firebase can take 5-10 minutes to propagate

## 🚀 Next Steps After Setup

1. Test on web first (easiest)
2. Build development build: `npx expo run:android`
3. Test on physical device with development build
4. Build release APK for final testing
5. Deploy!

---

**Need help?** Refer to `GOOGLE_AUTH_SETUP_GUIDE.md` for detailed instructions.
