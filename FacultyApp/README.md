// Initial setup steps
1. Install dependencies
npm install

2. Start the development server
npm start

3. Install the Expo Go app on your mobile device

4. Scan the QR code shown in the terminal with your device's camera (iOS) or Expo Go app (Android)

// Development
- iOS Simulator: Press 'i' in the terminal
- Android Emulator: Press 'a' in the terminal
- Web Browser: Press 'w' in the terminal

// Build Commands
- Android: eas build -p android
- iOS: eas build -p ios

// Project Structure
/src
  /components - Reusable UI components
  /screens - Screen components
  /navigation - Navigation configuration
  /services - API and other services
  /utils - Helper functions
  /hooks - Custom React hooks
  /types - TypeScript type definitions
  /constants - Constants and theme
/assets - Images and other static assets