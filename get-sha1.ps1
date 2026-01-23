# SHA-1 Fingerprint Generator Script
# This script will get SHA-1 fingerprints for both Debug and Release keystores

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SHA-1 Fingerprint Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get Debug SHA-1
Write-Host "1. Getting DEBUG SHA-1 fingerprint..." -ForegroundColor Yellow
Write-Host "   (From default Android debug keystore)" -ForegroundColor Gray
Write-Host ""

$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

if (Test-Path $debugKeystore) {
    Write-Host "   Running keytool for debug keystore..." -ForegroundColor Gray
    Write-Host ""
    
    keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android | Select-String -Pattern "SHA1:"
    
    Write-Host ""
    Write-Host "   ✅ Debug SHA-1 extracted above" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Debug keystore not found at: $debugKeystore" -ForegroundColor Red
    Write-Host "   This is normal if you haven't built an Android app yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get Release SHA-1
Write-Host "2. Getting RELEASE SHA-1 fingerprint..." -ForegroundColor Yellow
Write-Host "   (From release.keystore)" -ForegroundColor Gray
Write-Host ""

$releaseKeystore = "release.keystore"

if (Test-Path $releaseKeystore) {
    Write-Host "   Keystore found: $releaseKeystore" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Please enter your keystore information:" -ForegroundColor Yellow
    
    # Try common aliases first
    $aliases = @("release", "palindrome-release", "key0", "androidreleasekey")
    
    Write-Host ""
    Write-Host "   Attempting common aliases..." -ForegroundColor Gray
    
    foreach ($alias in $aliases) {
        Write-Host "   Trying alias: $alias" -ForegroundColor Gray
        $result = keytool -list -v -keystore $releaseKeystore -alias $alias -storepass "your-password" -keypass "your-password" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Found alias: $alias" -ForegroundColor Green
            Write-Host ""
            $result | Select-String -Pattern "SHA1:"
            Write-Host ""
            break
        }
    }
    
    Write-Host ""
    Write-Host "   If no SHA-1 was found above, run this command manually:" -ForegroundColor Yellow
    Write-Host "   keytool -list -v -keystore release.keystore -alias YOUR_ALIAS" -ForegroundColor White
    Write-Host ""
    Write-Host "   You'll be prompted for the keystore password." -ForegroundColor Gray
    
} else {
    Write-Host "   ⚠️  Release keystore not found: $releaseKeystore" -ForegroundColor Red
    Write-Host "   Make sure release.keystore is in the project root directory." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the SHA-1 values above" -ForegroundColor White
Write-Host "2. Add them to Google Cloud Console (Android OAuth Client)" -ForegroundColor White
Write-Host "3. Add them to Firebase Console (Android App Settings)" -ForegroundColor White
Write-Host ""
Write-Host "See SHA1_FINGERPRINT_GUIDE.md for detailed instructions." -ForegroundColor Gray
Write-Host ""
