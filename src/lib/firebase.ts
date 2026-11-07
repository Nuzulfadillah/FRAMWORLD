import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export { doc, getDoc, setDoc };
export const googleAuthProvider = new GoogleAuthProvider();
export { onAuthStateChanged, type User };

// Google Sign In via Popup (as required for iframe preview compatibility)
export const loginWithGoogle = async (): Promise<User> => {
  googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, googleAuthProvider);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
