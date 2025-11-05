# IIITNR QR Attendance System

A mobile application for QR-based attendance tracking with location verification, built using React Native and TypeScript.

## Features

- 🔐 Student/Faculty Authentication
- 📱 QR Code Scanning for Attendance
- 📍 Location Verification
- 💾 Offline Support with AsyncStorage
- 🔄 Real-time Updates via WebSocket
- 📳 Push Notifications using Firebase Cloud Messaging

## Tech Stack

- **Frontend Framework**: React Native with TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **UI Components**: Custom Design System
- **Authentication**: JWT
- **Storage**: AsyncStorage
- **Testing**: Jest & React Native Testing Library

## Project Structure

```
iiitnr-attendance/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   │   ├── Home.tsx    # Dashboard screen
│   │   ├── Login.tsx   # Authentication screen
│   │   └── Scanner.tsx # QR scanner screen
│   ├── services/       # API and utility services
│   ├── store/          # Redux store configuration
│   │   ├── slices/     # Redux slices
│   │   └── middleware/ # Redux middleware
│   ├── styles/         # Theme and styling
│   └── types/          # TypeScript type definitions
├── __tests__/          # Test files
└── assets/             # Static assets
```

## Design System

### Colors
- Primary: `#1E3A8A` (Navy)
- Secondary: `#312E81` (Indigo)
- Accent: `#A3E635` (Lime)
- Error: `#DC2626`
- Warning: `#F59E0B`
- Success: `#10B981`

### Typography
- Headlines: 24px / Bold (700)
- Subheadings: 18px / Semibold (600)
- Body: 16px / Regular (400)
- Captions: 12px / Regular (400)
- Font Family: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn
- React Native development environment setup
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd iiitnr-attendance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running on Devices

#### Android
```bash
npm run android
```

#### iOS
```bash
npm run ios
```

#### Expo Go App
Scan the QR code shown after running:
```bash
npm start
```

## Testing

Run the test suite:
```bash
npm test
```

## Security Features

- JWT-based authentication
- Secure storage for sensitive data
- Location data privacy measures
- QR code encryption and validation
- API rate limiting

## Performance Optimizations

- App launch time < 2 seconds
- QR scan response < 1 second
- Smooth animations (60 fps)
- Offline functionality for critical features
- AsyncStorage caching

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Expo team for the amazing tooling
- React Native community for the excellent documentation
- IIIT Naya Raipur for the project opportunity