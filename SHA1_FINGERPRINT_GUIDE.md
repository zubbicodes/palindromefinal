# SHA-1 Certificate Fingerprint Guide

This guide shows you how to get the SHA-1 fingerprint needed for Google Sign-In configuration.

## Why You Need SHA-1?

Google requires the SHA-1 fingerprint to verify your app's identity. You need to add it to:
1. Google Cloud Console (Android OAuth Client)
2. Firebase Console (Android App settings)

## Getting SHA-1 Fingerprint

### Method 1: Using Gradle (Recommended for Debug)

```bash
cd android
./gradlew signingReport
```

Look for the output section that shows:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the SHA1 value** (the long string of hex characters separated by colons).

### Method 2: Using Keytool (Direct)

#### For Debug Keystore (Default Location):

**Windows (PowerShell):**
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Windows (Command Prompt):**
```cmd
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**macOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### For Release Keystore:

**If you have a release keystore:**
```bash
keytool -list -v -keystore release.keystore -alias your-key-alias
```

Replace:
- `release.keystore` with your keystore file path
- `your-key-alias` with your key alias name

You'll be prompted for the keystore password.

### Method 3: Using Android Studio

1. Open Android Studio
2. Open your project (the `android` folder)
3. In the right sidebar, open **"Gradle"** tab
4. Navigate to: `android` > `Tasks` > `android` > `signingReport`
5. Double-click `signingReport`
6. Check the **"Run"** tab at the bottom for output
7. Find the SHA1 value in the output

## What to Look For

In the keytool output, look for a line like:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy this entire SHA1 value** (including the colons).

## Adding SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your **Android OAuth 2.0 Client ID**
4. Under **"SHA-1 certificate fingerprints"**, click **"+ ADD ITEM"**
5. Paste your SHA-1 fingerprint
6. Click **"Save"**

## Adding SHA-1 to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to **Project Overview**
4. Select **Project settings**
5. Scroll down to **"Your apps"** section
6. Click on your Android app
7. Under **"SHA certificate fingerprints"**, click **"Add fingerprint"**
8. Paste your SHA-1 fingerprint
9. Click **"Save"**

## Important Notes

### Debug vs Release

- **Debug SHA-1**: Used for development and testing
- **Release SHA-1**: Used for production builds

You should add **both** SHA-1 fingerprints to Google Cloud Console and Firebase:
1. Debug SHA-1 (for testing)
2. Release SHA-1 (for production)

### Multiple SHA-1s

You can add multiple SHA-1 fingerprints. This is useful if:
- You have multiple developers
- You use different keystores for different build types
- You're testing on different machines

### After Adding SHA-1

After adding SHA-1 to Google Cloud Console and Firebase:
1. Wait a few minutes for changes to propagate
2. Rebuild your app: `npx expo prebuild --clean`
3. Test Google Sign-In again

## Troubleshooting

### "SHA-1 not found" error

- Verify you copied the entire SHA-1 (including colons)
- Check that you added it to the correct OAuth client
- Ensure you're using the same keystore that signed your APK

### "Invalid SHA-1" error

- Make sure there are no extra spaces
- Verify the format: `XX:XX:XX:XX:...` (20 pairs of hex digits)
- Check that you're using the correct keystore

### Google Sign-In still not working after adding SHA-1

- Wait 5-10 minutes for Google's servers to update
- Clear app data and try again
- Verify the package name matches exactly: `com.gammagames.palindrome`

---

## Quick Command Reference

```bash
# Debug SHA-1 (Windows PowerShell)
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Debug SHA-1 (Windows CMD)
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# Debug SHA-1 (macOS/Linux)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release SHA-1 (replace with your keystore path and alias)
keytool -list -v -keystore release.keystore -alias your-key-alias

# Using Gradle
cd android && ./gradlew signingReport
```
