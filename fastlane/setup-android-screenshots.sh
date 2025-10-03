#!/bin/bash

# Setup Android screenshots for Fastlane
# This script copies screenshots from various locations to the Fastlane structure

set -e

echo "🤖 Setting up Android screenshots for Fastlane..."
echo ""

# Create directory structure
ANDROID_SCREENSHOTS_DIR="store-metadata/android/en-US/images/phoneScreenshots"
mkdir -p "$ANDROID_SCREENSHOTS_DIR"

# Check if we have screenshots in the old store-assets location
if [ -d "store-assets/screenshots/android" ] && [ "$(ls -A store-assets/screenshots/android/*.jpeg 2>/dev/null)" ]; then
    echo "✅ Found screenshots in store-assets/screenshots/android/"
    cp store-assets/screenshots/android/*.jpeg "$ANDROID_SCREENSHOTS_DIR/"
    echo "✅ Copied $(ls -1 $ANDROID_SCREENSHOTS_DIR/*.jpeg | wc -l) screenshots"
elif [ -d "screenshots/android" ] && [ "$(ls -A screenshots/android/*.jpeg 2>/dev/null)" ]; then
    echo "✅ Found screenshots in screenshots/android/"
    cp screenshots/android/*.jpeg "$ANDROID_SCREENSHOTS_DIR/"
    echo "✅ Copied $(ls -1 $ANDROID_SCREENSHOTS_DIR/*.jpeg | wc -l) screenshots"
else
    echo "⚠️  No Android screenshots found!"
    echo ""
    echo "Please place your Android screenshots in one of these locations:"
    echo "  - store-assets/screenshots/android/"
    echo "  - screenshots/android/"
    echo ""
    echo "Then run this script again."
    echo ""
    echo "Or manually copy them to:"
    echo "  $ANDROID_SCREENSHOTS_DIR/"
    exit 1
fi

# Optional: Copy feature graphic if it exists
if [ -f "store-assets/promotional/google-play.png" ]; then
    echo "✅ Found feature graphic"
    cp store-assets/promotional/google-play.png "store-metadata/android/en-US/images/featureGraphic.png"
    echo "✅ Copied feature graphic"
fi

echo ""
echo "✅ Android screenshots setup complete!"
echo ""
echo "📁 Screenshots location:"
echo "   $ANDROID_SCREENSHOTS_DIR/"
echo ""
echo "📋 Files:"
ls -1 "$ANDROID_SCREENSHOTS_DIR/"
echo ""
echo "🚀 Next steps:"
echo "   1. Set up Google Play service account JSON"
echo "   2. Run: export SUPPLY_JSON_KEY=\"./google-play-service-account.json\""
echo "   3. Run: fastlane android upload_screenshots"
echo ""

