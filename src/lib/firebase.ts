import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDW6Niv0-Ol65RsZ0tUzPT8e5gXLfpKTRs",
  authDomain: "orion-ai-87220.firebaseapp.com",
  projectId: "orion-ai-87220",
  storageBucket: "orion-ai-87220.firebasestorage.app",
  messagingSenderId: "928645630976",
  appId: "1:928645630976:web:c4bcbb16578b458b39dce5",
  measurementId: "G-2CRR1S7HJL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
