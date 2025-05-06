# Buck-Shot

Buck-Shot is a mobile app built with Expo + React Native (TypeScript) that helps hunters log, measure, and share their hunting experiences. It features tools for recording harvests, mapping hunt locations, and syncing photos, with more to come.


## Getting Started

### 1. Expo Go
download expo go from your phone's app store

### 2. Clone the repository
git clone https://github.com/YOUR_USERNAME/Buck-Shot.git
cd Buck-Shot

### 3. Install Dependencies
npm install
expo install react-native-svg

### 4. Run the app
npx expo start


Technologies Used:
-Expo
-React Native + TypeScript
-Firebase (Auth, Firestore, Cloud Storage)
-React Navigation
-React Native Vector Icons


Branching Workflow:
Branch	Purpose
main	Final, production-ready code
dev	    Team-tested, stable code
johnny	Johnny's development work
josh	Josh's development work


Contributors:
Johnny Rosas – @ccjohnnycc

///
Frontend
Implemented HomeScreen with basic Firestore integration:

uploads a test hunt entry on button press.

Displays upload status with loading indicator and result message.

Created ProfileScreen with placeholder UI:

Includes avatar icon, static stats, and an “Edit Profile” button.

Uses Feather icon from @expo/vector-icons.

Navigation
Integrated @react-navigation/native and @react-navigation/native-stack.

Created AppNavigator with two defined routes: Home and Profile.

Added navigation button from HomeScreen to ProfileScreen.

Backend (Firebase)
Configured Firebase and connected Firestore database.

Verified write operations using addDoc() to store test data in a hunts collection.

Setup ready for future Firestore reads and Firebase Authentication.