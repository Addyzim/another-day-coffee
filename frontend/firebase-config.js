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
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
