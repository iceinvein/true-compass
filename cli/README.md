# 🚀 True Compass Deployment CLI

An interactive deployment tool built with [Ink](https://github.com/vadimdemedes/ink) (React for CLIs).

## ✨ Features

- 🎨 Beautiful terminal UI with colors and animations
- ⌨️ Keyboard-driven navigation
- 📱 All deployment commands in one place
- 🔄 Full deployment workflows
- ✅ Real-time feedback

## 🚀 Usage

```bash
npm run deploy
```

## 🎮 Controls

- **↑↓** - Navigate menu
- **Enter** - Select option
- **Q** - Quit (from menu)
- **ESC** - Return to menu

## 📋 Available Commands

### Build
- Build iOS (Production)
- Build iOS (Preview/TestFlight)
- Build Android (Production)
- Build Android (Preview)

### Upload
- Upload Screenshots Only
- Upload Metadata Only
- Upload Screenshots + Metadata

### Submit
- Submit iOS to App Store
- Submit Android to Play Store

### Workflows
- Full iOS Deploy (Build → Upload → Submit)
- Full Android Deploy (Build → Upload → Submit)

### Utilities
- Check Build Status
- Verify Screenshots

## 🛠️ Tech Stack

- **Ink** - React for CLIs
- **TypeScript** - Type safety
- **tsx** - TypeScript execution
- **Node.js** - Runtime

## 📁 Structure

```
cli/
├── deploy.tsx          # Main Ink app
├── index.ts            # Entry point
├── tsconfig.json       # TypeScript config
└── utils/
    └── commands.ts     # Command utilities
```

## 🎨 Components

The CLI uses Ink components:
- `SelectInput` - Interactive menu
- `Spinner` - Loading animations
- `Gradient` - Rainbow text effects
- `BigText` - ASCII art title
- `Box` - Layout containers
- `Text` - Styled text

## 🔧 Development

### Run locally:
```bash
npm run deploy
```

### Add new commands:
1. Add command function to `utils/commands.ts`
2. Add menu item to `deploy.tsx`
3. Add case to switch statement in `executeAction`

### Customize UI:
Edit `deploy.tsx` to change:
- Colors
- Layout
- Text
- Animations

## 📚 Learn More

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Ink Components](https://github.com/vadimdemedes/ink#built-in-components)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Fastlane](https://docs.fastlane.tools/)

---

**Built with ❤️ using Ink**

