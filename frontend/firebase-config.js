/*
 * Firebase web config for Another Day Coffee's order system.
 *
 * 1. Create a free project at https://console.firebase.google.com
 * 2. Add a Web app (</>) and copy its config values below.
 * 3. Enable Firestore (Build → Firestore Database → Create database).
 * 4. Enable Email/Password sign-in (Build → Authentication → Sign-in method)
 *    and add one admin user (Authentication → Users → Add user).
 * 5. Paste the Firestore security rules from README ("Order dashboard").
 *
 * These values are SAFE to commit/expose for a Firebase web app — access is
 * controlled by the security rules, not by hiding these keys. Leaving them
 * blank simply disables the order database (orders still go to WhatsApp).
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBxNm9mzKEZ4yvnvaYNqynxu6aRXaApsk",
  authDomain: "another-day-cafe.firebaseapp.com",
  projectId: "another-day-cafe",
  storageBucket: "another-day-cafe.firebasestorage.app",
  messagingSenderId: "312314419408",
  appId: "1:312314419408:web:22bd7f16e6bf1c775ae6d5",
  measurementId: "G-8734C1CTPE",
};
