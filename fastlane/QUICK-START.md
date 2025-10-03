# 🚀 Fastlane Quick Start

## ✅ Fixed: "No deliver configuration found"

The issue was that Fastlane needed:
1. **Appfile** - Contains app identifier and Apple ID
2. **app_identifier** in Fastfile commands

Both are now configured!

---

## 📋 What Was Fixed

### Created `fastlane/Appfile`:
```ruby
app_identifier("com.truecompass.app")
```

### Updated `fastlane/Fastfile`:
- Added `app_identifier: "com.truecompass.app"` to all iOS commands
- Added `package_name: "com.truecompass.app"` to all Android commands
- Added `force: true` to skip HTML preview

---

## 🚀 Ready to Use!

### Upload iOS Screenshots

```bash
fastlane ios upload_screenshots
```

**What happens:**
1. Fastlane reads `Appfile` for app identifier
2. Prompts for Apple ID (first time)
3. Prompts for app-specific password (first time)
4. Uploads all screenshots from `screenshots/en-US/`
5. Done!

---

## 📝 Before First Upload

### 1. Generate App-Specific Password

1. Go to https://appleid.apple.com
2. Sign in with your Apple ID
3. Navigate to: **Security** → **App-Specific Passwords**
4. Click **Generate Password**
5. Label it: "Fastlane"
6. Copy the password (you'll need it once)

### 2. Optional: Add Your Apple ID to Appfile

Edit `fastlane/Appfile`:
```ruby
app_identifier("com.truecompass.app")
apple_id("your-email@example.com")  # Add your Apple ID here
```

This way Fastlane won't prompt for it every time.

---

## 🎯 Upload Commands

### iOS

```bash
# Upload only screenshots
fastlane ios upload_screenshots

# Upload only metadata (text)
fastlane ios upload_metadata

# Upload both screenshots + metadata
fastlane ios upload_all

# Download existing screenshots
fastlane ios download_screenshots

# Download existing metadata
fastlane ios download_metadata
```

### Android

```bash
# First: Set up service account
export SUPPLY_JSON_KEY="./google-play-service-account.json"

# Upload only screenshots
fastlane android upload_screenshots

# Upload only metadata
fastlane android upload_metadata

# Upload both
fastlane android upload_all

# Download existing metadata
fastlane android download_metadata
```

---

## 📁 Directory Structure (Current)

```
true-compass/
├── screenshots/                    # ✅ iOS screenshots ready
│   └── en-US/
│       ├── 01-compass-dark.jpeg
│       ├── 02-compass-light.jpeg
│       ├── 03-setup-start.jpeg
│       ├── 04-setup-calibrating.jpeg
│       ├── 05-setup-verifying.jpeg
│       └── 06-setup-complete.jpeg
│
├── store-metadata/                 # ✅ Metadata ready
│   ├── ios/en-US/
│   │   ├── name.txt
│   │   ├── subtitle.txt
│   │   ├── description.txt
│   │   └── ...
│   │
│   └── android/en-US/
│       ├── title.txt
│       ├── short_description.txt
│       ├── full_description.txt
│       └── images/phoneScreenshots/  # Android screenshots go here
│
└── fastlane/
    ├── Appfile                     # ✅ App identifier
    ├── Fastfile                    # ✅ Upload commands
    ├── README.md                   # Full documentation
    └── QUICK-START.md              # This file
```

---

## 🔐 Authentication

### First Time Running

```bash
fastlane ios upload_screenshots
```

**You'll be prompted for:**
1. **Apple ID:** your-email@example.com
2. **Password:** Use app-specific password (not regular password)
3. **Team ID:** (if you have multiple teams)

**Credentials are saved in macOS Keychain** - you won't be prompted again!

---

## ⚡ Quick Test

```bash
# Check available commands
fastlane lanes

# Upload iOS screenshots (do it now!)
fastlane ios upload_screenshots
```

---

## ⚠️ Common Issues

### "Could not find app with bundle identifier"
- **Solution:** App must exist in App Store Connect first
- Create app manually in App Store Connect
- Use bundle ID: `com.truecompass.app`

### "Invalid credentials"
- **Solution:** Use app-specific password, not regular password
- Generate at: https://appleid.apple.com

### "No screenshots found"
- **Solution:** Check screenshots are in `screenshots/en-US/`
- Run: `ls screenshots/en-US/`

### "Wrong device size"
- **Solution:** Fastlane auto-detects from image dimensions
- Your screenshots are 1290x2796 (iPhone 6.7") ✅

---

## 💡 Tips

1. **Test with one screenshot first:** Move 5 screenshots out temporarily
2. **Use force flag:** Already added - skips HTML preview
3. **Check App Store Connect:** Verify uploads in browser
4. **Multiple languages:** Create `screenshots/es-ES/` for Spanish, etc.
5. **Overwrite existing:** Already enabled - replaces old screenshots

---

## 🎉 Summary

**What was wrong:**
- ❌ Missing `Appfile`
- ❌ Missing `app_identifier` in commands

**What's fixed:**
- ✅ Created `Appfile` with app identifier
- ✅ Added `app_identifier` to all iOS commands
- ✅ Added `package_name` to all Android commands
- ✅ Added `force: true` to skip preview

**Ready to use:**
```bash
fastlane ios upload_screenshots
```

---

## 📞 Next Steps

1. **Generate app-specific password** at https://appleid.apple.com
2. **Run:** `fastlane ios upload_screenshots`
3. **Enter credentials** when prompted
4. **Wait** for upload (~1-2 minutes)
5. **Verify** in App Store Connect

---

**That's it! The configuration issue is fixed!** 🎉

