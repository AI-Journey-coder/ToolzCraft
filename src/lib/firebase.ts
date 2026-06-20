import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// @ts-ignore
import appletConfig from "../../firebase-applet-config.json";

// Helper function to safely fetch environmental properties, falling back to firebase-applet-config.json
const getEnv = (key: string, appletKey: string, fallback: string = ""): string => {
  try {
    // Try Vite's client-side environment standard first
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {
    // Silent catch
  }

  // Try direct fallback to the provisioned applet configuration from the JSON blueprint
  if (appletConfig && appletConfig[appletKey]) {
    return appletConfig[appletKey];
  }

  try {
    // Try Node's default server-side environment properties
    if (typeof process !== "undefined" && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
  } catch (e) {
    // Silent catch
  }

  return fallback;
};

// Load configuration from Environment Variables (set via AI Studio Settings or local .env or fallback config)
const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "apiKey", "AIzaSyDummyKeyForCompilation_12345"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "authDomain", "dummy-project.firebaseapp.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "projectId", "dummy-project"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "storageBucket", "dummy-project.appspot.com"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId", "1234567890"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "appId", "1:1234567890:web:abcdef12345")
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Determine if Firebase environment credentials have been actively supplied
export const isFirebaseConfigured = (): boolean => {
  const key = getEnv("VITE_FIREBASE_API_KEY", "apiKey");
  return !!(key && key !== "" && key !== "AIzaSyDummyKeyForCompilation_12345");
};

