import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const facebookProvider = new FacebookAuthProvider();
export const twitterProvider = new TwitterAuthProvider();
export const githubProvider = new GithubAuthProvider();

/** Sign in with a social provider and return the Firebase ID token */
export async function signInWithProvider(
  provider:
    | GoogleAuthProvider
    | OAuthProvider
    | FacebookAuthProvider
    | TwitterAuthProvider
    | GithubAuthProvider,
): Promise<string> {
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}

/** Send SMS OTP to a phone number. Returns a ConfirmationResult. */
export async function sendPhoneOtp(
  phone: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> {
  // Clear any previously rendered reCAPTCHA widget before creating a new one
  const container = document.getElementById(recaptchaContainerId);
  if (container) container.innerHTML = '';
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
  return signInWithPhoneNumber(auth, phone, verifier);
}

/** Confirm OTP code and return Firebase ID token for phone auth */
export async function confirmPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<string> {
  const result = await confirmationResult.confirm(code);
  return result.user.getIdToken();
}
