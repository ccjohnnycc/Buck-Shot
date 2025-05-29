# Buck-Shot

Buck-Shot is a mobile app built with Expo + React Native (TypeScript) that helps hunters log, measure, and share their hunting experiences. It features tools for recording harvests, mapping hunt locations, and syncing photos, with more to come.

## Features
-Photo Capture & Measurement: Take photos, drag-to-measure antler widths, and save them by hunt session.

-Gallery View: View, rename, or delete specific hunting sessions organized in folders.

-Journal Logging: Add entries with species, width, location, and notes. Attach photos from the field.

-Mapping (Coming Soon): Future integration for tagging hunt locations on a map.

-User Accounts: Sign up, log in, or continue as a guest. Each user has their own data.

-Profile & Upload Tools: Test uploads and see account-level hunt statistics.

-Calibration System: Tap the edges of a known object (like a credit card) to calibrate accurate inch-based measurements.

### Technologies Used:
-Expo
-React Native + TypeScript
-Firebase (Auth, Firestore, Cloud Storage)
-React Navigation
-AsyncStorage
-Expo Camera API
-react-native-gesture-handler

//////////////////
# Getting Started
1. Expo Go
download expo go from your phone's app store

2. Clone the repository
git clone https://github.com/YOUR_USERNAME/Buck-Shot.git
cd Buck-Shot

3. Install Dependencies
npm install
expo install react-native-svg
npx expo install expo-camera
npm install @react-native-community/slider
 npm install react-native-view-shot

4. Run the app
npx expo start

## Development Setup
If you're a developer getting started with this repo:

Requires Node.js, npm, and Expo CLI
-npm install -g expo-cli

Firebase must be configured:
    -Create a Firebase project
    -Enable Email/Password Auth, Firestore, and Cloud Storage
    -Add your Firebase config to /services/firebaseConfig.ts

Folder Structure:
    -Photos saved under FileSystem.documentDirectory/hunt_TIMESTAMP/
    -Journal entries stored in Firestore under journalEntries collection


////////////////////////
# Project Status
Alpha – Core features are being implemented. Additional polish and enhancements in progress.

## Contributors:
Johnny Rosas – @ccjohnnycc
Joshua Brouillette - @Peepkiller

### Branching Workflow:
Branch	Purpose
main	Final, production-ready code
dev	    Team-tested, stable code
johnny	Johnny's development work
josh	Josh's development work


# Internal Notes (for devs or instructors)

## Frontend
Implemented HomeScreen with basic Firestore integration:

uploads a test hunt entry on button press.

Displays upload status with loading indicator and result message.

Created ProfileScreen with placeholder UI:

Includes avatar icon, static stats, and an “Edit Profile” button.

Uses Feather icon from @expo/vector-icons.

### Navigation
Integrated @react-navigation/native and @react-navigation/native-stack.

Created AppNavigator with two defined routes: Home and Profile.

Added navigation button from HomeScreen to ProfileScreen.

#### Backend (Firebase)
Configured Firebase and connected Firestore database.

Verified write operations using addDoc() to store test data in a hunts collection.

Setup ready for future Firestore reads and Firebase Authentication.
