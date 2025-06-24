// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAA0SwxR5WIrpSZhvyrd-JgtN50fyaMHLs",
  authDomain: "waqui-leveling.firebaseapp.com",
  projectId: "waqui-leveling",
  storageBucket: "waqui-leveling.firebasestorage.app",
  messagingSenderId: "284134639130",
  appId: "1:284134639130:web:9bd519359015d84e0e73a3",
  measurementId: "G-299GXFDM1W"
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Authentication
const auth = firebase.auth();

// Initialize Analytics (optional)
const analytics = firebase.analytics();

// Export Firebase services for use in other files
const firebaseServices = {
  app,
  db,
  auth,
  analytics
}; 