# True Compass

A precise, ad-free compass app for iOS and Android that uses your device's magnetometer to provide accurate directional readings.

## Features

- **Accurate Magnetic Compass**: Uses device magnetometer for true magnetic north readings
- **Tilt Compensation**: Advanced cross-product fusion algorithm maintains accuracy even when phone isn't perfectly flat
- **Smart Calibration**: Initial setup flow with orientation-based calibration tracking
- **Light & Dark Modes**: Beautiful interface that adapts to your preference
- **Level Indicator**: Visual bubble shows device tilt for optimal accuracy
- **No Permissions Required**: Works without location services or internet
- **Ad-Free**: Clean, distraction-free experience

## How It Works

True Compass uses your device's built-in magnetometer and accelerometer sensors to:
1. Detect magnetic field direction (magnetic north)
2. Compensate for device tilt using accelerometer data
3. Apply cross-product fusion for stable readings at any angle
4. Smooth readings to eliminate jitter while maintaining responsiveness

## Initial Setup

On first launch, the app guides you through a quick calibration:
1. Move your phone in a figure-8 pattern
2. The app tracks orientation coverage to ensure proper calibration
3. Settings are saved for future use

## Development

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

### Tech Stack

- **React Native** with Expo SDK 54
- **Expo Router** for navigation
- **TypeScript** for type safety
- **React Native Reanimated** for smooth 60fps animations
- **Expo Sensors** for magnetometer and accelerometer access
- **AsyncStorage** for persistent settings

### Project Structure

```
├── app/                    # Main application screens
│   ├── index.tsx          # Entry point with theme management
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── compass.tsx        # Main compass component
│   ├── setup-screen.tsx   # Initial calibration flow
│   ├── calibration-modal.tsx
│   ├── loading-compass.tsx
│   └── compass-error.tsx
├── hooks/                 # Custom React hooks
│   └── use-compass.ts     # Compass sensor logic
├── constants/             # Theme and app constants
└── assets/               # Images and icons
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Privacy

True Compass:
- Does NOT collect any personal data
- Does NOT require location permissions
- Does NOT use internet connectivity
- Does NOT contain ads or tracking

The app only accesses:
- Magnetometer (for compass readings)
- Accelerometer (for tilt compensation)
- Local storage (for saving theme and calibration settings)

## License

Copyright © 2025. All rights reserved.

## Support

For issues or feature requests, please open an issue on GitHub.
