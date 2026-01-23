@echo off
echo ========================================
echo Release SHA-1 Fingerprint Generator
echo ========================================
echo.
echo Getting SHA-1 for release.keystore...
echo Alias: palindromefinal
echo.
echo You will be prompted for the keystore password.
echo.
keytool -list -v -keystore release.keystore -alias palindromefinal
echo.
echo ========================================
echo Look for the line: SHA1: XX:XX:XX:...
echo Copy that entire SHA1 value!
echo ========================================
pause
