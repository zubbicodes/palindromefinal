@echo off
echo ========================================
echo Debug SHA-1 Fingerprint Generator
echo ========================================
echo.
echo This will get the SHA-1 from the debug keystore.
echo.
echo Note: The debug keystore is created automatically
echo when you first build an Android app.
echo.
echo If you get an error, build the app first:
echo   cd android
echo   gradlew signingReport
echo.
echo ========================================
echo.
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
echo.
echo ========================================
echo Look for the line: SHA1: XX:XX:XX:...
echo Copy that entire SHA1 value!
echo ========================================
pause
