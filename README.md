# Fitwise Mobile App

The frontend application for Fitwise, an AI-powered men's personal styling application designed to help users build cohesive capsule wardrobes and visualize outfits perfectly suited to their style.

## Tech Stack
- **Framework**: React Native, Expo, Expo Router
- **Language**: TypeScript
- **Styling**: React Native StyleSheet, Custom Theme System
- **State Management / API**: Axios, React Hooks

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Set up your `.env` file with the following variables:
   - `EXPO_PUBLIC_API_URL`: The URL to your backend (e.g. `http://localhost:5001/api`)
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`: Your iOS client ID for Google Auth
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`: Your Android client ID for Google Auth

3. **Run the App**:
   ```bash
   npx expo start
   ```
   Use the Expo Go app on your phone to scan the QR code, or press `i` / `a` to run it on an iOS Simulator or Android Emulator.

## Key Features
- **Smart Onboarding**: Captures user measurements, preferences, and budget to build an accurate profile.
- **AI Wardrobe**: Displays AI-generated clothing recommendations as a capsule wardrobe with beautiful, highly-realistic product images.
- **Outfit Generator**: Allows users to select an occasion and get AI-curated outfits constructed dynamically from their wardrobe items.
- **Modern UI/UX**: Features a highly premium aesthetic with seamless glassmorphic styling, smooth animations, and dynamic layouts.
