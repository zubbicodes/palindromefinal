# Get Your SHA-1 Fingerprints Now! 🚀

I found your release keystore alias: **`palindromefinal`**

## ✅ Step 1: Get RELEASE SHA-1 (You can do this now!)

Open PowerShell in your project directory and run:

```powershell
keytool -list -v -keystore release.keystore -alias palindromefinal
```

**You'll be prompted for the keystore password** - enter it when asked.

Look for this line in the output:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the entire SHA1 value** (the long string with colons).

---

## ✅ Step 2: Get DEBUG SHA-1 (After first build)

The debug keystore will be created when you first build your Android app. 

**Option A: Build the app first (recommended)**
```powershell
cd android
.\gradlew signingReport
```

Look for the output section:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Option B: Or use keytool after building**
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

## 📋 Quick Copy-Paste Commands

### Release SHA-1:
```powershell
keytool -list -v -keystore release.keystore -alias palindromefinal
```
*(Enter password when prompted)*

### Debug SHA-1 (after first build):
```powershell
cd android
.\gradlew signingReport
```

---

## 📝 Where to Add These SHA-1 Values

### 1. Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your **Android OAuth 2.0 Client ID**
3. Under **"SHA-1 certificate fingerprints"**, click **"+ ADD ITEM"**
4. Add **BOTH** SHA-1 values:
   - Paste your **Release SHA-1**
   - Paste your **Debug SHA-1** (after you get it)
5. Click **"Save"**

### 2. Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click ⚙️ **Settings** > **Project settings**
4. Scroll to **"Your apps"** > Click your Android app
5. Under **"SHA certificate fingerprints"**, click **"Add fingerprint"**
6. Add **BOTH** SHA-1 values:
   - Paste your **Release SHA-1**
   - Paste your **Debug SHA-1** (after you get it)
7. Click **"Save"**

---

## 🎯 Summary

**Right now, you can get:**
- ✅ **Release SHA-1** - Run the command above with alias `palindromefinal`

**After first build, you can get:**
- ⏳ **Debug SHA-1** - Run `.\gradlew signingReport` in the android folder

**Then add both to:**
- Google Cloud Console (Android OAuth Client)
- Firebase Console (Android App Settings)

---

## 💡 Pro Tip

If you want to get the debug SHA-1 right now without building, you can create the debug keystore manually:

```powershell
keytool -genkey -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

Then get the SHA-1:
```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

**Run the release SHA-1 command now and copy the value!** 🚀
