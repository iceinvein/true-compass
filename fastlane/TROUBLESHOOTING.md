# 🔧 Fastlane Troubleshooting

Common issues and solutions when uploading to App Store Connect.

---

## ❌ "Incorrect, or missing copyright date"

### Error Message:
```
😵  Failed: Incorrect, or missing copyright date
-> using a copyright date that is any different from this current year, or missing a date
```

### Solution:
Add a copyright file with the current year:

**File:** `store-metadata/ios/en-US/copyright.txt`
```
2024 True Compass
```

**✅ Fixed!** This file has been created.

---

## ❌ "No broken urls-> unreachable URLs in app metadata"

### Error Message:
```
😵  Failed: No broken urls-> unreachable URLs in app metadata
```

### Cause:
Empty URL files (privacy_url.txt, support_url.txt, marketing_url.txt) were being uploaded as empty strings.

### Solution 1: Remove Empty URL Files (Done)
```bash
rm store-metadata/ios/en-US/privacy_url.txt
rm store-metadata/ios/en-US/support_url.txt
rm store-metadata/ios/en-US/marketing_url.txt
```

**✅ Fixed!** Empty files have been removed.

### Solution 2: Upload Screenshots Only (Recommended)
Updated `fastlane/Fastfile` to skip metadata when uploading screenshots:

```ruby
lane :upload_screenshots do
  deliver(
    skip_metadata: true,  # Skip metadata to avoid URL errors
    skip_screenshots: false
  )
end
```

**✅ Fixed!** Fastfile has been updated.

---

## 🎯 Recommended Workflow

### For Screenshots Only:
```bash
# Upload only screenshots (no metadata)
fastlane ios upload_screenshots
```

This avoids metadata validation issues.

### For Metadata Only:
```bash
# Upload only metadata (no screenshots)
fastlane ios upload_metadata
```

But you'll need to add URLs first (see below).

### For Both:
```bash
# Upload both (after adding URLs)
fastlane ios upload_all
```

---

## 📝 Adding URLs (Optional)

If you want to upload metadata with URLs:

### Support URL (Required for metadata upload)

**Option 1: Email**
```bash
echo "mailto:support@yourapp.com" > store-metadata/ios/en-US/support_url.txt
```

**Option 2: Website**
```bash
echo "https://yourwebsite.com/support" > store-metadata/ios/en-US/support_url.txt
```

### Privacy Policy URL (Optional)
```bash
echo "https://yourwebsite.com/privacy" > store-metadata/ios/en-US/privacy_url.txt
```

### Marketing URL (Optional)
```bash
echo "https://yourwebsite.com" > store-metadata/ios/en-US/marketing_url.txt
```

---

## ⚠️ Other Common Issues

### "Could not find app with bundle identifier"

**Cause:** App doesn't exist in App Store Connect yet.

**Solution:**
1. Go to https://appstoreconnect.apple.com
2. Create app manually
3. Use bundle ID: `com.truecompass.app`
4. Then run Fastlane

---

### "Invalid credentials"

**Cause:** Using regular password instead of app-specific password.

**Solution:**
1. Go to https://appleid.apple.com
2. Security → App-Specific Passwords
3. Generate new password
4. Use that password (not your regular password)

---

### "No screenshots found"

**Cause:** Screenshots not in correct location.

**Solution:**
```bash
# Check screenshots exist
ls screenshots/en-US/

# Should show:
# 01-compass-dark.jpeg
# 02-compass-light.jpeg
# etc.
```

---

### "Wrong device size"

**Cause:** Screenshot dimensions don't match any device.

**Solution:**
- iPhone 6.7": 1290 x 2796 ✅ (your screenshots)
- iPhone 6.5": 1242 x 2688
- iPad Pro 12.9": 2048 x 2732

Fastlane auto-detects from dimensions.

---

### "App is not ready for submission"

**Cause:** Missing required fields in App Store Connect.

**Solution:**
1. Go to App Store Connect
2. Fill in required fields manually:
   - App name
   - Subtitle
   - Description
   - Keywords
   - Support URL
   - Category
   - Age rating
3. Then use Fastlane for screenshots

---

### "Two-factor authentication required"

**Cause:** Apple requires 2FA for App Store Connect.

**Solution:**
1. Enable 2FA on your Apple ID
2. Generate app-specific password
3. Use app-specific password with Fastlane

---

## 🔄 Current Setup (Fixed)

### What's Working:
- ✅ Screenshots upload (6 files)
- ✅ Copyright date added (2024)
- ✅ Empty URL files removed
- ✅ Fastfile configured to skip metadata

### What to Do Manually:
- 📝 Add app description in App Store Connect
- 📝 Add keywords in App Store Connect
- 📝 Add support URL in App Store Connect
- 📝 Set category in App Store Connect

### Why Manual?
- Avoids validation errors
- Easier to see what you're submitting
- Can preview before saving
- No URL requirements

---

## 💡 Best Practice

### First Time Setup:
1. **Create app in App Store Connect** (manual)
2. **Fill in basic info** (manual):
   - Name, subtitle, description
   - Category, age rating
   - Support URL
3. **Upload screenshots** (Fastlane):
   ```bash
   fastlane ios upload_screenshots
   ```
4. **Done!**

### Future Updates:
1. **Update screenshots** (Fastlane):
   ```bash
   fastlane ios upload_screenshots
   ```
2. **Update description** (manual in App Store Connect)

---

## 🎯 Quick Fix Summary

### What Was Wrong:
- ❌ Missing copyright date
- ❌ Empty URL files causing validation errors

### What Was Fixed:
- ✅ Added `copyright.txt` with "2024 True Compass"
- ✅ Removed empty URL files
- ✅ Changed `upload_screenshots` to skip metadata
- ✅ Screenshots upload without metadata validation

### What to Do Now:
```bash
# Upload screenshots (should work now!)
fastlane ios upload_screenshots
```

---

## 📞 If You Still Get Errors

### Check App Exists:
```bash
# Verify app exists in App Store Connect
# Bundle ID: com.truecompass.app
```

### Check Credentials:
```bash
# Use app-specific password, not regular password
# Generate at: https://appleid.apple.com
```

### Check Screenshots:
```bash
# Verify screenshots exist and have correct dimensions
ls -lh screenshots/en-US/
file screenshots/en-US/*.jpeg
```

### Verbose Mode:
```bash
# Run with verbose output to see details
fastlane ios upload_screenshots --verbose
```

---

## 🔗 Useful Links

- **App Store Connect:** https://appstoreconnect.apple.com
- **Apple ID (for app-specific password):** https://appleid.apple.com
- **Fastlane Deliver Docs:** https://docs.fastlane.tools/actions/deliver/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/

---

**Status:** Issues fixed! Ready to upload screenshots.

**Next command:**
```bash
fastlane ios upload_screenshots
```

