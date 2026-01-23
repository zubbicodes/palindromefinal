# How to Get SHA-1 Fingerprints

Follow these instructions to get both Debug and Release SHA-1 fingerprints.

## 🔍 Method 1: Using the PowerShell Script (Easiest)

I've created a script for you. Run this in PowerShell:

```powershell
cd D:\StratonAlly\Code\palindromefinal
.\get-sha1.ps1
```

---

## 🔍 Method 2: Manual Commands

### Get DEBUG SHA-1

The debug keystore will be created automatically when you first build an Android app. To get the SHA-1:

**Option A: After building once (recommended)**
```powershell
# First, build your app once to create the debug keystore
cd android
.\gradlew signingReport
```

Look for the output that shows:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Option B: Using keytool directly (if keystore exists)**
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Look for the line: `SHA1: XX:XX:XX:XX:...`

---

### Get RELEASE SHA-1

You have a `release.keystore` file. To get its SHA-1, you need to know the **alias** and **password**.

**Step 1: List all aliases in your keystore**
```powershell
keytool -list -keystore release.keystore
```

You'll be prompted for the keystore password. This will show you all aliases.

**Step 2: Get SHA-1 for the alias**
```powershell
keytool -list -v -keystore release.keystore -alias YOUR_ALIAS_NAME
```

Replace `YOUR_ALIAS_NAME` with the actual alias from Step 1.

**Common aliases to try:**
- `release`
- `palindrome-release`
- `key0`
- `androidreleasekey`

**Example:**
```powershell
# Try this first (most common)
keytool -list -v -keystore release.keystore -alias release

# Or try this
keytool -list -v -keystore release.keystore -alias palindrome-release
```

Look for the line: `SHA1: XX:XX:XX:XX:...`

---

## 📋 What to Do With the SHA-1 Values

Once you have both SHA-1 fingerprints:

### 1. Add to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your **Android OAuth 2.0 Client ID**
4. Under **"SHA-1 certificate fingerprints"**, click **"+ ADD ITEM"**
5. Add **BOTH** SHA-1 values:
   - Debug SHA-1 (for testing)
   - Release SHA-1 (for production)
6. Click **"Save"**

### 2. Add to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > **Project settings**
4. Scroll to **"Your apps"** section
5. Click on your Android app
6. Under **"SHA certificate fingerprints"**, click **"Add fingerprint"**
7. Add **BOTH** SHA-1 values:
   - Debug SHA-1
   - Release SHA-1
8. Click **"Save"**

---

## 🚀 Quick Commands Reference

### Debug SHA-1 (after first build):
```powershell
cd android
.\gradlew signingReport
```

### Release SHA-1:
```powershell
# List aliases first
keytool -list -keystore release.keystore

# Then get SHA-1 (replace ALIAS with actual alias)
keytool -list -v -keystore release.keystore -alias ALIAS
```

---

## ⚠️ Important Notes

1. **Debug keystore doesn't exist yet?** 
   - That's normal! It will be created when you first build: `npx expo run:android`
   - Or run: `cd android && ./gradlew signingReport`

2. **Don't know the release keystore password/alias?**
   - Check your project documentation
   - Or check if there's a `keystore.properties` file
   - The alias is usually something like: `release`, `key0`, or `androidreleasekey`

3. **Need to create a new release keystore?**
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias palindrome-release -keyalg RSA -keysize 2048 -validity 10000
   ```

---

## ✅ Checklist

- [ ] Debug SHA-1 obtained
- [ ] Release SHA-1 obtained  
- [ ] Both SHA-1s added to Google Cloud Console
- [ ] Both SHA-1s added to Firebase Console
- [ ] Waited 5-10 minutes for changes to propagate
- [ ] Tested Google Sign-In

---

**Need help?** If you're stuck, share the error message and I'll help you troubleshoot!
